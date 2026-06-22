import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "aihappey-i18n";
import { useLocation, useParams } from "react-router";
import { useJsonRenderApps } from "aihappey-json-render-apps";
import type { JsonRenderAppDataSource } from "aihappey-json-render-apps";
import { useTheme } from "aihappey-components";
import { OverviewPageHeader } from "../../ui/layout/OverviewPageHeader";
import { WebAppDetailHeader } from "./WebAppDetailHeader";
import { WebAppDetailChatDrawer } from "./WebAppDetailChatDrawer";
import { WebAppDetailAppPreview } from "./WebAppDetailAppPreview";
import {
  mapLegacyDefaultRegistrySelection,
  useCombinedComponentRegistryForIds,
} from "../json-render/ComponentRegistry";
import { useAppStore } from "aihappey-state";
import { useStructuredOutputs } from "aihappey-structured-outputs";
import { useJsonRenderCatalog } from "aihappey-json-render-catalog";
import {
  buildModelOptions,
  buildResourceOptions,
  buildResourceTemplateOptions,
  buildStructuredOutputOptions,
  buildToolOptions,
  refreshDataSource,
} from "./dataSources";
import { useChatContext } from "../chat/context/ChatContext";
import { useUIStream } from "../json-render/useUIStream";
import { createChatAuthHeadersForModel } from "../provider-credentials/providerAuthHeaders";
import {
  createCatalogFromStored,
  getDefaultCatalogDefinitionsWithActions,
  mapLegacyDefaultCatalogSelection,
} from "../json-render/catalog";
import { useJsonRenderRegistry } from "aihappey-json-render-registry";

const BUILTIN_REGISTRY_IDS = ["app", "openapi", "adaptive-cards"];

function inferRegistryIdsFromTree(tree: any): string[] {
  const elements = tree?.elements ?? {};
  const types = new Set<string>(
    Object.values(elements)
      .map((el: any) => String(el?.type ?? "").trim())
      .filter(Boolean),
  );

  const inferred: string[] = [];

  if (types.has("Form") || types.has("StringField") || types.has("NumberField") || types.has("EnumField")) {
    inferred.push("openapi");
  }

  const hasAdaptive = Array.from(types).some(
    (t) =>
      t === "AdaptiveCard" ||
      t.startsWith("Input.") ||
      t.startsWith("Action.") ||
      ["TextBlock", "ColumnSet", "FactSet", "RichTextBlock", "ImageSet", "ActionSet"].includes(t),
  );
  if (hasAdaptive) {
    inferred.push("adaptive-cards");
  }

  return Array.from(new Set(inferred));
}

function parseCommaList(value: string | undefined, all: string[]): string[] {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return all;

  const tokens = trimmed
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const includeAll = tokens.some((t) => t.toLowerCase() === "all");
  if (includeAll) return all;

  const allowed = tokens.filter((t) => all.includes(t));
  return allowed.length ? Array.from(new Set(allowed)) : all;
}

export const WebAppDetailPage = () => {
  const { t } = useTranslation();
  const { Text } = useTheme();
  const { appId } = useParams<{ appId: string }>();
  const location = useLocation();
  const apps = useJsonRenderApps();
  const structuredOutputsStore = useStructuredOutputs();
  const mcpServerContent = useAppStore((s) => s.mcpServerContent);
  const mcpServers = useAppStore((s) => s.mcpServers);
  const models = useAppStore((s) => s.models);
  const selectedModel = useAppStore((s) => s.selectedModel);
  const customHeaders = useAppStore((s) => s.customHeaders);
  const maxOutputTokens = useAppStore((s) => s.maxOutputTokens);
  const defaultCatalogs = useAppStore((s) => (s as any).defaultCatalogs as string | undefined);
  const defaultRegistries = useAppStore((s) => (s as any).defaultRegistries as string | undefined);
  const jsonRenderCatalog = useJsonRenderCatalog();
  const jsonRenderRegistry = useJsonRenderRegistry();
  const { config } = useChatContext();
  const [loading, setLoading] = useState(true);
  const [app, setApp] = useState<any | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [dataSourceError, setDataSourceError] = useState<string | undefined>(undefined);
  const [dataRefreshError, setDataRefreshError] = useState<string | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);
  const [streamingTree, setStreamingTree] = useState<any | undefined>(undefined);
  const [streamingError, setStreamingError] = useState<string | undefined>(undefined);
  const [streaming, setStreaming] = useState(false);
  const [chatStreaming, setChatStreaming] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const streamState = (location.state as any)?.stream as
    | {
      prompt: string;
      dataSource?: JsonRenderAppDataSource;
      data?: any;
      catalogs?: string[];
      registries?: string[];
    }
    | undefined;
  const [hasStreamed, setHasStreamed] = useState(false);

  const allRegistryIds = useMemo(() => {
    const ids = new Set<string>(BUILTIN_REGISTRY_IDS);
    for (const item of jsonRenderRegistry.items ?? []) {
      if (item?.registryId) ids.add(item.registryId);
    }
    return Array.from(ids);
  }, [jsonRenderRegistry.items]);

  const defaultSelectedRegistryIds = useMemo(
    () => parseCommaList(mapLegacyDefaultRegistrySelection(defaultRegistries), allRegistryIds),
    [defaultRegistries, allRegistryIds],
  );

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!appId) return;
      setLoading(true);
      setError(undefined);
      try {
        const item = await apps.read(appId);
        if (!cancelled) setApp(item);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [appId, apps]);

  useEffect(() => {
    if (appId) {
      setHasStreamed(false);
      setStreamingTree(undefined);
    }
  }, [appId]);

  const tree = useMemo(() => {
    // Stored as object already, but be defensive.
    const raw = (app as any)?.uiTree;
    if (!raw) return undefined;
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw);
      } catch {
        return undefined;
      }
    }
    return raw;
  }, [app]);

  const effectiveTree = streamingTree ?? tree;

  const effectiveRegistryIds = useMemo(() => {
    const inferred = inferRegistryIdsFromTree(effectiveTree);

    if (streamState?.registries?.length) return streamState.registries;
    if ((app as any)?.registryIds?.length) {
      return Array.from(new Set([...(app as any).registryIds as string[], ...inferred]));
    }
    if (inferred.length) return inferred;
    return defaultSelectedRegistryIds.length ? defaultSelectedRegistryIds : ["app"];
  }, [streamState?.registries, app, defaultSelectedRegistryIds, effectiveTree]);

  const { registry, actionHandlers } = useCombinedComponentRegistryForIds(effectiveRegistryIds);

  const title = app?.name ?? t("webApps");
  const description = app?.description;

  const connectedServerKeys = useMemo(
    () => Object.keys(mcpServerContent ?? {}).filter((key) => !!mcpServerContent[key]),
    [mcpServerContent]
  );

  const resourceOptions = useMemo(() => {
    const entries = Object.entries(mcpServerContent ?? {}).flatMap(([serverKey, content]) =>
      (content.resources ?? []).filter((res) => res?.mimeType === "application/json").map((resource) => ({
        serverKey,
        resource,
      }))
    );
    return buildResourceOptions(entries);
  }, [mcpServerContent]);

  const resourceTemplateOptions = useMemo(() => {
    const entries = Object.entries(mcpServerContent ?? {}).flatMap(([serverKey, content]) =>
      (content.resourceTemplates ?? [])
        .filter((tpl) => tpl?.mimeType === "application/json")
        .map((resourceTemplate) => ({
          serverKey,
          resourceTemplate,
        }))
    );
    return buildResourceTemplateOptions(entries);
  }, [mcpServerContent]);

  const toolOptions = useMemo(() => {
    const all = Object.values(mcpServerContent ?? {}).flatMap((content) => content.tools ?? []);
    const seen = new Set<string>();
    const deduped = all.filter((tool) => {
      if (seen.has(tool.name)) return false;
      seen.add(tool.name);
      return true;
    });
    return buildToolOptions(deduped);
  }, [mcpServerContent]);
  const structuredOutputOptions = useMemo(
    () => buildStructuredOutputOptions(structuredOutputsStore.items ?? []),
    [structuredOutputsStore.items]
  );
  const modelOptions = useMemo(
    () => buildModelOptions(models ?? []),
    [models]
  );

  const effectiveCatalogPrompt = useMemo(() => {
    const fallbackCatalogs = getDefaultCatalogDefinitionsWithActions(
      jsonRenderRegistry.actions,
      "app",
    );
    const fallbackNames = fallbackCatalogs.map((item) => item.name);
    const availableCatalogIds = Array.from(
      new Set([...(jsonRenderCatalog.items ?? []).map((item) => item.name), ...fallbackNames]),
    );

    const defaultSelectedCatalogIds = parseCommaList(
      mapLegacyDefaultCatalogSelection(defaultCatalogs),
      availableCatalogIds,
    );

    const selectedCatalogIds = streamState?.catalogs?.length
      ? streamState.catalogs
      : (app as any)?.catalogIds?.length
        ? ((app as any).catalogIds as string[])
        : defaultSelectedCatalogIds;

    const catalogListWithBuiltin = mapLegacyDefaultCatalogSelection(selectedCatalogIds.join(","));

    const stored = createCatalogFromStored(
      jsonRenderCatalog.items,
      catalogListWithBuiltin,
      fallbackCatalogs,
    );
    return stored.prompt();
  }, [defaultCatalogs, streamState?.catalogs, app, jsonRenderCatalog.items, jsonRenderRegistry.actions]);

  const { spec: streamedTree, send, isStreaming, error: uiStreamError } = useUIStream({
    api: (config?.baseUrl ?? "") + "/api/generate",
    catalogPrompt: effectiveCatalogPrompt,
    model: selectedModel,
    getAccessToken: config?.getAccessToken,
    customHeaders: createChatAuthHeadersForModel(customHeaders, selectedModel, Boolean(config?.getAccessToken)),
    initialTree: tree ?? null,
  });

  useEffect(() => {
    if (streamedTree) {
      setStreamingTree(streamedTree);
    }
  }, [streamedTree]);

  useEffect(() => {
    if (uiStreamError) {
      setStreamingError(uiStreamError.message);
    }
  }, [uiStreamError]);

  useEffect(() => {
    setStreaming(isStreaming);
  }, [isStreaming]);

  useEffect(() => {
    if (!appId || !streamState?.prompt || !app || hasStreamed) return;
    let cancelled = false;
    async function runStream() {
      setStreamingError(undefined);
      setStreamingTree(undefined);

      try {
        if (!streamState || !appId) return;
        const prompt = streamState.prompt.trim();
        const result = await send(
          prompt,
          {
            ...(streamState.data ?? {}),
            _meta: undefined,
          },
          undefined,
          tree ?? null,
          maxOutputTokens
        );
        if (cancelled || !result) return;
        const updated = await apps.update(appId, {
          name: app.name,
          description: app.description,
          uiTree: result,
          data: streamState.data ?? app.data,
          catalogIds: ((app as any).catalogIds ?? streamState.catalogs) as any,
          registryIds: (app.registryIds ?? streamState.registries ?? effectiveRegistryIds) as any,
          dataSource: streamState.dataSource ?? app.dataSource,
        } as any);
        if (!cancelled) {
          setApp(updated);
          setStreamingTree(undefined);
          setHasStreamed(true);
        }
      } catch (e) {
        if (!cancelled) setStreamingError(e instanceof Error ? e.message : String(e));
      }
    }

    runStream();
    return () => {
      cancelled = true;
    };
  }, [appId, app?.id, streamState?.prompt, send, apps, hasStreamed, tree, effectiveRegistryIds]);

  const dataSourceValue = (app?.dataSource ?? null) as JsonRenderAppDataSource | null;

  const handleChatStreamUpdate = useCallback((nextTree: any) => {
    if (!nextTree) return;
    setStreamingError(undefined);
    setStreamingTree(nextTree);
  }, []);

  const handleChatStreamComplete = useCallback(
    async (nextTree: any) => {
      if (!nextTree) return;
      if (!appId || !app) return;
      try {
        const updated = await apps.update(appId, {
          name: app.name,
          description: app.description,
          uiTree: nextTree,
          data: app.data,
          catalogIds: (app as any).catalogIds,
          registryIds: app.registryIds,
          dataSource: app.dataSource,
        } as any);
        setApp(updated);
        setStreamingTree(undefined);
      } catch (e) {
        setStreamingError(e instanceof Error ? e.message : String(e));
      }
    },
    [appId, app, apps]
  );

  const handleChatStreamError = useCallback((err: Error) => {
    setStreamingError(err.message);
  }, []);

  const handleDataSourceChange = useCallback(
    async (next: JsonRenderAppDataSource | null) => {
      if (!appId || !app) return;
      setDataSourceError(undefined);
      try {
        const updated = await apps.update(appId, {
          name: app.name,
          description: app.description,
          uiTree: app.uiTree,
          data: app.data,
          catalogIds: (app as any).catalogIds,
          registryIds: app.registryIds,
          dataSource: next,
        } as any);
        setApp(updated);
      } catch (e) {
        setDataSourceError(e instanceof Error ? e.message : String(e));
      }
    },
    [appId, app, apps]
  );

  const refreshData = useCallback(async () => {
    if (!appId || !app?.dataSource) return;
    setDataRefreshError(undefined);
    setRefreshing(true);
    try {
      const data = await refreshDataSource({
        dataSource: app.dataSource,
        mcpServers: Object.fromEntries(
          Object.keys(mcpServers ?? {}).map((key) => [key, { connected: connectedServerKeys.includes(key) }])
        ),
        mcpServerContent,
        tools: [],
        structuredOutputs: structuredOutputsStore.items ?? [],
        apiBaseUrl: config?.baseUrl,
        customHeaders,
        getAccessToken: config?.getAccessToken,
      });

      const updated = await apps.update(appId, {
        name: app.name,
        description: app.description,
        uiTree: app.uiTree,
        data,
        catalogIds: (app as any).catalogIds,
        registryIds: app.registryIds,
        dataSource: app.dataSource,
      } as any);
      setApp(updated);
    } catch (e) {
      setDataRefreshError(e instanceof Error ? e.message : String(e));
    } finally {
      setRefreshing(false);
    }
  }, [appId, app, apps, mcpServerContent, mcpServers, connectedServerKeys, structuredOutputsStore.items, config, customHeaders]);

  const canRefresh = useMemo(() => {
    const source = app?.dataSource;
    if (!source) return false;
    if (source.type === "resource" || source.type === "resourceTemplate") {
      return connectedServerKeys.length > 0;
    }
    if (source.type === "tool") {
      return Object.values(mcpServerContent ?? {}).some((content) =>
        (content.tools ?? []).some((tool) => tool.name === source.config.name)
      );
    }
    return true;
  }, [app?.dataSource, connectedServerKeys.length, mcpServerContent]);

  return (
    <div
      style={{
        background: "transparent",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        width: "100%",
        height: "100%"
      }}
    >
      <WebAppDetailHeader
        chatOpen={chatOpen}
        onToggleChat={() => setChatOpen((prev) => !prev)}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          width: "100%",
          height: "100%",
          boxSizing: "border-box",
          padding: "0px 12px",
          minHeight: 0,
        }}
      >
        <div
          style={{
            maxWidth: "100%",
            margin: "0 auto",
            display: "flex",
            height: "100%",
            flexDirection: "column",
            flex: 1,
            minWidth: 0,
            width: "100%",
          }}
        >
          <div
            style={{
              maxWidth: "100%",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
            }}
          >
            <OverviewPageHeader title={title} />
            {description ? (
              <Text as="p" align={"center" }>{description}</Text>
            ) : null}
          </div>
          <WebAppDetailAppPreview
            loading={loading}
            error={error}
            app={app}
            effectiveTree={effectiveTree}
            streamingError={streamingError}
            streaming={streaming}
            chatStreaming={chatStreaming}
            registry={registry}
            actionHandlers={actionHandlers}
          />
        </div>
        <WebAppDetailChatDrawer
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          appId={appId}
          app={app}
          tree={effectiveTree}
          catalogPrompt={effectiveCatalogPrompt}
          onStreamUpdate={handleChatStreamUpdate}
          onStreamComplete={handleChatStreamComplete}
          onStreamError={handleChatStreamError}
          onStreamingChange={setChatStreaming}
          dataSourceValue={dataSourceValue}
          canRefresh={canRefresh}
          refreshing={refreshing}
          dataRefreshError={dataRefreshError}
          dataSourceError={dataSourceError}
          connectedServerKeys={connectedServerKeys}
          resourceOptions={resourceOptions}
          resourceTemplateOptions={resourceTemplateOptions}
          toolOptions={toolOptions}
          structuredOutputOptions={structuredOutputOptions}
          modelOptions={modelOptions}
          onRefreshData={refreshData}
          onDataSourceChange={handleDataSourceChange}
        />
      </div>
    </div>
  );
};

