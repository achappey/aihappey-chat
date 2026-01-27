import { useMemo, useState } from "react";

import { useAppStore } from "aihappey-state";
import { ToolCard, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { useLocalTools } from "aihappey-tools";

import { OverviewPageHeader } from "../../ui/layout/OverviewPageHeader";

// Plugin defs (static tool definitions)
import { localFilesPluginDef } from "./toolcalls/useLocalFileToolCall";
import { localAgentsPluginDef } from "./toolcalls/useLocalAgentsToolCall";
import { localConversationsPluginDef } from "./toolcalls/useLocalConversationsToolCall";
import { localCanvasPluginDef } from "./toolcalls/useLocalCanvasToolCall";
import { localSettingsPluginDef } from "./toolcalls/useLocalSettingsToolCall";
import { localToolsPluginDef } from "./toolcalls/useLocalToolsToolCall";
import { localStructuredOutputsPluginDef } from "./toolcalls/useLocalStructuredOutputsToolCall";
import { vercelAIPluginDef } from "./toolcalls/useVercelAIToolCall";
import { parseStoredToolInputSchema } from "./localStoredTools";
import { useOnToolCall } from "./toolcalls/useOnToolCall";
import { useChatContext } from "../chat/context/ChatContext";

type ToolListItem = {
  key: string;
  name: string;
  title?: string;
  description?: string;
  inputSchema?: any;
  executeSource?: string;
  source: "plugin" | "local" | "model-context";
  sourceDetail?: string;
  enabled?: boolean;
  annotations?: any;
};

function normalizeText(v: unknown) {
  return String(v ?? "").trim().toLowerCase();
}

export const ToolsPage = () => {
  const { SearchBox, Paragraph, Tabs, Tab, Header } = useTheme();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");

  const activePlugins = useAppStore(s => s.activePlugins);
  const callTool = useAppStore((a) => a.callTool);
  const config = useChatContext()

  const api = config?.config.baseUrl + config?.config.endpoints.chat;
  const toolUse = useOnToolCall({
    api,
    getAccessToken: config?.config?.getAccessToken,
    conversationId: undefined,
    headers: config?.config.headers,
    customFetch: config?.config.fetch,
    callTool,
    send: undefined
  });

  const enabledLocalTools = useAppStore(s => (s as any).enabledLocalTools as string[]);
  const setEnabledLocalTools = useAppStore(
    s => (s as any).setEnabledLocalTools as (names: string[]) => void
  );
  const mcpServerContent = useAppStore(s => s.mcpServerContent);

  const localTools = useLocalTools();

  const collator = useMemo(
    () => new Intl.Collator(undefined, { sensitivity: "base", numeric: true }),
    []
  );

  const pluginDefs = useMemo(
    () => [
      localFilesPluginDef,
      localAgentsPluginDef,
      localConversationsPluginDef,
      localCanvasPluginDef,
      localSettingsPluginDef,
      localStructuredOutputsPluginDef,
      localToolsPluginDef,
      vercelAIPluginDef,
    ],
    []
  );

  const pluginToolItems = useMemo<ToolListItem[]>(() => {
    const enabledSet = new Set(Array.isArray(activePlugins) ? activePlugins : []);

    const items: ToolListItem[] = [];
    for (const def of pluginDefs) {
      for (const tool of def.tools ?? []) {
        const translatedPluginName = t(`plugins.${def.name}`);
        items.push({
          key: `plugin:${def.name}:${tool.name}`,
          name: tool.name,
          title: (tool as any).title,
          description: (tool as any).description,
          inputSchema: (tool as any).inputSchema,
          annotations: (tool as any).annotations,
          source: "plugin",
          sourceDetail:
            translatedPluginName !== `plugins.${def.name}`
              ? translatedPluginName
              : def.name,
          enabled: enabledSet.has(def.name),
        });
      }
    }

    items.sort((a, b) =>
      collator.compare(
        `${a.sourceDetail ?? ""} ${a.title ?? a.name}`,
        `${b.sourceDetail ?? ""} ${b.title ?? b.name}`
      )
    );
    return items;
  }, [activePlugins, collator, pluginDefs, t]);

  const localToolItems = useMemo<ToolListItem[]>(() => {
    const enabledSet = new Set(Array.isArray(enabledLocalTools) ? enabledLocalTools : []);
    const items = (localTools.items ?? []).map(stored => {
      let schema: any = undefined;
      try {
        schema = parseStoredToolInputSchema(stored);
      } catch {
        schema = undefined;
      }

      return {
        key: `local:${stored.id}`,
        name: stored.id,
        title: stored.title,
        description: stored.description,
        inputSchema: schema,
        executeSource: stored.execute,
        source: "local" as const,
        sourceDetail: t("customTools"),
        enabled: enabledSet.has(stored.id),
      };
    });

    items.sort((a, b) => collator.compare(a.title ?? a.name, b.title ?? b.name));
    return items;
  }, [collator, enabledLocalTools, localTools.items, t]);

  const modelContextToolItemsByServer = useMemo(() => {
    const servers = mcpServerContent ?? {};
    const keys = Object.keys(servers).sort(collator.compare);

    const out: Array<{ serverKey: string; serverTitle: string; tools: ToolListItem[] }> = [];
    for (const serverKey of keys) {
      const server = (servers as any)[serverKey];
      const tools = Array.isArray(server?.tools) ? server.tools : [];

      const items: ToolListItem[] = tools.map((tool: any) => ({
        key: `mcp:${serverKey}:${tool.name}`,
        name: tool.name,
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
        annotations: tool.annotations,
        source: "model-context" as const,
        sourceDetail: serverKey,
        enabled: true,
      }));

      items.sort((a, b) => collator.compare(a.title ?? a.name, b.title ?? b.name));

      out.push({ serverKey, serverTitle: serverKey, tools: items });
    }

    return out;
  }, [collator, mcpServerContent]);

  const modelContextToolItemsFlat = useMemo(
    () => modelContextToolItemsByServer.flatMap(s => s.tools),
    [modelContextToolItemsByServer]
  );

  const allItems = useMemo<ToolListItem[]>(
    () => [...pluginToolItems, ...localToolItems, ...modelContextToolItemsFlat],
    [localToolItems, modelContextToolItemsFlat, pluginToolItems]
  );

  const q = normalizeText(search);

  const filterItems = useMemo(() => {
    const matches = (i: ToolListItem) => {
      if (!q) return true;
      const hay = normalizeText(
        `${i.name} ${i.title ?? ""} ${i.description ?? ""} ${i.source} ${i.sourceDetail ?? ""}`
      );
      return hay.includes(q);
    };

    const sortByLabel = (a: ToolListItem, b: ToolListItem) =>
      collator.compare(a.title ?? a.name, b.title ?? b.name);

    return {
      // ALL tab should be ordered alphabetically by display label (title fallback name), regardless of source.
      all: allItems.filter(matches).slice().sort(sortByLabel),
      plugin: pluginToolItems.filter(matches),
      local: localToolItems.filter(matches),
      modelContext: modelContextToolItemsByServer
        .map(s => ({ ...s, tools: s.tools.filter(matches) }))
        .filter(s => s.tools.length > 0 || !q),
    };
  }, [allItems, collator, localToolItems, modelContextToolItemsByServer, pluginToolItems, q]);

  const renderGrid = (items: ToolListItem[]) => {
    if (items.length === 0) {
      return <div style={{ color: "#888", textAlign: "center" }}>{t("noResults")}</div>;
    }

    const enabledSet = new Set(Array.isArray(enabledLocalTools) ? enabledLocalTools : []);
    const toggleLocalTool = (id: string, checked: boolean) => {
      const current = Array.isArray(enabledLocalTools) ? enabledLocalTools : [];
      const next = checked
        ? current.includes(id)
          ? current
          : [...current, id]
        : current.filter(x => x !== id);
      setEnabledLocalTools(next);
    };

    // NOTE: When working in-repo without rebuilding, newly added props on ToolCard
    // may not exist in the published `aihappey-components` .d.ts yet.
    const ToolCardAny = ToolCard as any;

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          width: "100%",
          maxWidth: 700,
          marginBottom: 24,
          justifyItems: "center",
        }}
      >
        {items.map(item => (
          <div key={item.key} style={{ maxWidth: 320, minWidth: 320, width: "100%" }}>
            <ToolCardAny
              id={item.key}
              name={item.name}
              title={item.title}
              description={item.description}
              inputSchema={item.inputSchema}
              executeSource={item.source === "local" ? item.executeSource : undefined}
              source={item.source}
              sourceDetail={item.sourceDetail}
              enabled={item.enabled}
              annotations={item.annotations}
              onExecute={async (toolName: string, args: any) => {
                // Uses existing tool runtime; result is returned and will be stored by ToolCard.
                return await toolUse.onToolCall({
                  toolCall: {
                    toolName: toolName,
                    input: args
                  }
                });
              }}
              toggleChecked={
                item.source === "local"
                  ? enabledSet.has(item.name)
                  : item.source === "plugin"
                    ? !!item.enabled
                    : undefined
              }
              onToggle={
                item.source === "local"
                  ? (checked: boolean) => toggleLocalTool(item.name, checked)
                  : undefined
              }
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div style={{ background: "transparent" }}>
        <div
          style={{
            width: 700,
            maxWidth: "100%",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <OverviewPageHeader title={t("tools")} />

          <Paragraph style={{ textAlign: "center" }}>{t("toolsPage.description")}</Paragraph>

          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <div style={{ width: 360, maxWidth: "100%" }}>
              <SearchBox value={search} onChange={setSearch} placeholder={t("searchPlaceholder")} />
            </div>
          </div>

          <Tabs activeKey={activeTab} onSelect={(k: string) => setActiveTab(k)}>
            <Tab eventKey="all" icon="cardList" title={`${t("all")} (${filterItems.all.length})`}>
              <div style={{ paddingTop: 12 }}>{renderGrid(filterItems.all)}</div>
            </Tab>

            <Tab
              eventKey="plugin"
              icon="connector"
              title={`${t("pluginTools")} (${filterItems.plugin.length})`}
            >
              <div style={{ paddingTop: 12 }}>{renderGrid(filterItems.plugin)}</div>
            </Tab>

            <Tab eventKey="local"
              icon="tool"
              disabled={filterItems.local.length == 0}
              title={`${t("customTools")} (${filterItems.local.length})`}>
              <div style={{ paddingTop: 12 }}>{renderGrid(filterItems.local)}</div>
            </Tab>

            <Tab
              eventKey="modelContext"
              icon="mcpServer"
              disabled={filterItems.modelContext.length == 0}
              title={`${t("mcpPage.title")} (${modelContextToolItemsFlat.length})`}
            >
              <div style={{ paddingTop: 12, width: "100%", maxWidth: 700 }}>
                {filterItems.modelContext.length === 0 ? (
                  <div style={{ color: "#888", textAlign: "center" }}>{t("noResults")}</div>
                ) : (
                  filterItems.modelContext.map(section => (
                    <div key={section.serverKey} style={{ width: "100%" }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
                        <Header style={{ margin: 0 }}>{section.serverTitle}</Header>
                        <span style={{ color: "#888", fontSize: 12 }}>({section.tools.length})</span>
                      </div>
                      {renderGrid(section.tools)}
                    </div>
                  ))
                )}
              </div>
            </Tab>
          </Tabs>
        </div>
      </div>
    </>
  );
};

