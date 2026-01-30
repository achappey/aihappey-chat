import { useEffect, useMemo, useState } from "react";
import {
  DataSourceForm,
  JsonRenderAppCard,
  LocalToolsSettingsForm,
  StickyHeaderActionBar,
  WizardModal,
  WizardStepHeader,
  useTheme,
} from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { useJsonRenderApps } from "aihappey-json-render-apps";
import type { DataSourceFormValue } from "aihappey-components";
import { useAppStore } from "aihappey-state";
import { useStructuredOutputs } from "aihappey-structured-outputs";
import { useJsonRenderCatalog } from "aihappey-json-render-catalog";
import { useNavigate } from "react-router";
import { OverviewPageHeader } from "../../ui/layout/OverviewPageHeader";
import { resolveCatalogSelection } from "aihappey-json-render-catalog";
import {
  buildModelOptions,
  buildResourceOptions,
  buildResourceTemplateOptions,
  buildStructuredOutputOptions,
  buildToolOptions,
  refreshDataSource,
} from "./dataSources";
import { useChatContext } from "../chat/context/ChatContext";

function normalizeText(v: unknown) {
  return String(v ?? "").trim().toLowerCase();
}

const BUILTIN_CATALOG_ID = "__default__";

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

export const WebAppsPage = () => {
  const { SearchBox, Paragraph, TextArea, Button, Alert, Spinner, Input } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const apps = useJsonRenderApps();
  const structuredOutputsStore = useStructuredOutputs();
  const { config } = useChatContext();
  const mcpServerContent = useAppStore((s) => s.mcpServerContent);
  const mcpServers = useAppStore((s) => s.mcpServers);
  const models = useAppStore((s) => s.models);
  const customHeaders = useAppStore((s) => s.customHeaders);
  const defaultCatalogs = useAppStore((s) => (s as any).defaultCatalogs as string | undefined);
  const catalogsStore = useJsonRenderCatalog();

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dataSource, setDataSource] = useState<DataSourceFormValue | null>(null);
  const [prefetchedData, setPrefetchedData] = useState<any | undefined>(undefined);
  const [prefetchError, setPrefetchError] = useState<string | undefined>(undefined);
  const [prefetching, setPrefetching] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);
  const q = normalizeText(search);

  const collator = useMemo(
    () => new Intl.Collator(undefined, { sensitivity: "base", numeric: true }),
    []
  );

  const filtered = useMemo(() => {
    const items = Array.isArray(apps.items) ? apps.items : [];
    const out = q
      ? items.filter((a) => {
          const hay = normalizeText(`${a.name} ${a.id}`);
          return hay.includes(q);
        })
      : items;

    return out
      .slice()
      .sort((a, b) => collator.compare(a.name ?? "", b.name ?? ""));
  }, [apps.items, collator, q]);

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

  const catalogItems = useMemo(() => {
    const stored = (catalogsStore.items ?? []).map((c) => ({
      id: c.name,
      label: c.name,
    }));
    const builtIn = {
      id: BUILTIN_CATALOG_ID,
      label: t("default") ?? "Default",
    };
    return [builtIn, ...stored].sort((a, b) => a.label.localeCompare(b.label));
  }, [catalogsStore.items, t]);

  const allCatalogIds = useMemo(() => catalogItems.map((x) => x.id), [catalogItems]);
  const defaultSelectedCatalogIds = useMemo(
    () => parseCommaList(defaultCatalogs, allCatalogIds),
    [defaultCatalogs, allCatalogIds]
  );
  const [selectedCatalogIds, setSelectedCatalogIds] = useState<string[]>(defaultSelectedCatalogIds);

  useEffect(() => {
    setSelectedCatalogIds(defaultSelectedCatalogIds);
  }, [defaultSelectedCatalogIds]);

  const resetWizard = () => {
    setStep(1);
    setName("");
    setDescription("");
    setDataSource(null);
    setPrefetchedData(undefined);
    setPrefetchError(undefined);
    setPrefetching(false);
    setPrompt("");
    setSubmitError(undefined);
    setSelectedCatalogIds(defaultSelectedCatalogIds);
  };

  const closeWizard = () => {
    setCreateOpen(false);
    resetWizard();
  };

  const handlePrefetch = async () => {
    if (!dataSource) return;
    setPrefetching(true);
    setPrefetchError(undefined);
    setSubmitError(undefined);
    try {
      const data = await refreshDataSource({
        dataSource,
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
      setPrefetchedData(data);
      setStep(3);
    } catch (e) {
      setPrefetchError(e instanceof Error ? e.message : String(e));
    } finally {
      setPrefetching(false);
    }
  };

  const handleSubmit = async () => {
    if (!dataSource) return;
    setSubmitError(undefined);
    try {
      const trimmedName = name.trim();
      if (!trimmedName) return;
      const trimmedPrompt = prompt.trim();
      const effectiveCatalogs = resolveCatalogSelection(
        selectedCatalogIds.length ? selectedCatalogIds.join(",") : undefined,
        allCatalogIds,
        ["app"]
      );
      const trimmedDescription = description.trim();
      const created = await apps.create({
        name: trimmedName,
        description: trimmedDescription.length ? trimmedDescription : undefined,
        uiTree: { root: "", elements: {} },
        data: prefetchedData,
        dataSource,
      });

      closeWizard();
      navigate(`/apps/${created.id}`, {
        state: {
          stream: {
            prompt: trimmedPrompt,
            dataSource,
            data: prefetchedData,
            catalogs: effectiveCatalogs,
          },
        },
      });
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <>
      <StickyHeaderActionBar
        actionLabel={t("add")}
        onAction={() => setCreateOpen(true)}
      />
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
        <OverviewPageHeader title={t("webApps")} />

        <Paragraph style={{ textAlign: "center" }}>
          {t("webAppsPage.description")}
        </Paragraph>

        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <div style={{ width: 360, maxWidth: "100%" }}>
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder={t("searchPlaceholder")}
            />
          </div>
        </div>

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
          {filtered.length === 0 ? (
            <div style={{ color: "#888", gridColumn: "1 / -1", textAlign: "center" }}>
              {t("noResults")}
            </div>
          ) : (
            filtered.map((item) => (
              <div key={item.id} style={{ maxWidth: 320, minWidth: 320, width: "100%" }}>
                <JsonRenderAppCard
                  item={{ id: item.id, name: item.name, updatedAt: item.updatedAt }}
                  onOpen={() => navigate(`/apps/${item.id}`)}
                  onDelete={async () => {
                    await apps.delete(item.id);
                    // Provider updates state; no need to refresh.
                  }}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
      <WizardModal
        open={createOpen}
        title={t("newApp")}
        size="large"
        onClose={closeWizard}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            {step > 1 ? (
              <Button variant="secondary" onClick={() => setStep((prev) => (prev - 1) as 1 | 2 | 3)}>
                {t("back")}
              </Button>
            ) : null}
            {step === 1 ? (
              <Button
                variant="primary"
                disabled={!name.trim()}
                onClick={() => setStep(2)}
              >
                {t("ok")}
              </Button>
            ) : step === 2 ? (
              <Button
                variant="primary"
                disabled={!dataSource || prefetching}
                onClick={handlePrefetch}
              >
                {prefetching ? t("loading") : t("ok")}
              </Button>
            ) : (
              <Button
                variant="primary"
                disabled={!prompt.trim() || !name.trim()}
                onClick={handleSubmit}
              >
                {t("save")}
              </Button>
            )}
            <Button variant="secondary" onClick={closeWizard}>
              {t("cancel")}
            </Button>
          </div>
        }
      >
        {step === 1 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <WizardStepHeader
              title={t("newApp")}
              step={1}
              totalSteps={3}
            />
            <Input
              label={t("name")}
              value={name}
              onChange={(next) => setName(String(next.target.value ?? ""))}
            />
            <TextArea
              label={t("description")}
              value={description}
              onChange={(next: string) => setDescription(String(next ?? ""))}
            />
          </div>
        ) : step === 2 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <WizardStepHeader
              title={t("dataSource.title")}
              step={2}
              totalSteps={3}
            />
            {connectedServerKeys.length === 0 ? (
              <Alert variant="warning">{t("dataSource.mcpDisconnected")}</Alert>
            ) : null}
            {prefetchError ? <Alert variant="warning">{prefetchError}</Alert> : null}
            <DataSourceForm
              value={dataSource}
              onChange={setDataSource}
              disabled={prefetching}
              resourceOptions={resourceOptions}
              resourceTemplateOptions={resourceTemplateOptions}
              toolOptions={toolOptions}
              structuredOutputOptions={structuredOutputOptions}
              modelOptions={modelOptions}
            />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {submitError ? <Alert variant="warning">{submitError}</Alert> : null}
            <TextArea
              label={t("prompt")}
              value={prompt}
              onChange={(next: string) => setPrompt(String(next ?? ""))}
            />
            <LocalToolsSettingsForm
              formTitle={t("catalogs")}
              items={catalogItems}
              value={selectedCatalogIds}
              onChange={setSelectedCatalogIds}
              columns={2}
            />
            {prefetching ? <Spinner label={t("loading")} /> : null}
          </div>
        )}
      </WizardModal>
    </>
  );
};

