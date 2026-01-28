import { useEffect, useMemo, useState } from "react";
import { AppSaveModal, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { ActionProvider, DataProvider, VisibilityProvider } from "@json-render/react";
import { ErrorBoundary } from "react-error-boundary";
import { Renderer } from "../../../json-render/Renderer";
import { useCombinedComponentRegistryForIds } from "../../../json-render/ComponentRegistry";
import { IconToken } from "aihappey-types";
import { useJsonRenderApps } from "aihappey-json-render-apps";
import type { AppSaveModalValues } from "aihappey-components";
import { useJsonRenderRegistry } from "aihappey-json-render-registry";
import { useAppStore } from "aihappey-state";

function getFileName(uri: string): string {
  try {
    const path = new URL(uri).pathname;
    const file = path.substring(path.lastIndexOf("/") + 1);
    return file.replace(/\.[^/.]+$/, ""); // strip extension
  } catch {
    const file = (uri.split("/").pop() || uri).trim();
    return file.replace(/\.[^/.]+$/, "");
  }
}

function formatShort(ts?: string) {
  if (!ts) return "-";
  const safe = ts.replace(/(\.\d{3})\d+Z$/, "$1Z");
  const d = new Date(safe);
  if (isNaN(d.getTime())) return ts; // fallback raw
  return d.toLocaleString([], { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function parseTree(text?: string) {
  if (!text) return { tree: undefined, error: "Missing UI tree JSON." };
  try {
    return { tree: JSON.parse(text), error: undefined };
  } catch (e) {
    return { tree: undefined, error: e instanceof Error ? e.message : String(e) };
  }
}

export const VercelAppCanvasBlock = ({ uri, versions }: { uri: string; versions: any[] }) => {
  const { Card, Menu, Tabs, Tab, JsonViewer } = useTheme();
  const { t } = useTranslation();
  const appsStore = useJsonRenderApps();
  const jsonRenderRegistry = useJsonRenderRegistry();
  const defaultRegistries = useAppStore((s) => (s as any).defaultRegistries as string | undefined);
  // const activeData = useAppStore(s => s.activeData);
  const [current, setCurrent] = useState(versions[0]);
  const [activeTab, setActiveTab] = useState("app");
  const [saveOpen, setSaveOpen] = useState(false);

  const registryIds = useMemo(() => {
    const ids = new Set<string>();
    ids.add("app");
    for (const item of jsonRenderRegistry.items ?? []) {
      if (item?.registryId) ids.add(item.registryId);
    }
    return Array.from(ids).sort();
  }, [jsonRenderRegistry.items]);

  const defaultSelectedRegistryIds = useMemo(() => {
    const raw = String(defaultRegistries ?? "").trim();
    if (!raw) return registryIds;
    const tokens = raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const includeAll = tokens.some((t) => t.toLowerCase() === "all");
    if (includeAll) return registryIds;
    const allowed = tokens.filter((t) => registryIds.includes(t));
    return allowed.length ? allowed : registryIds;
  }, [defaultRegistries, registryIds]);

  // Session-only selection of registries used for rendering.
  // Default it from user settings; if those are undefined, this becomes ALL available.
  const [selectedRegistryIds, setSelectedRegistryIds] = useState<string[]>(defaultSelectedRegistryIds);
  useEffect(() => {
    // If registries list changes:
    // - keep selected ids that still exist
    // - if none remain, fall back to user's defaults (or all)
    setSelectedRegistryIds((prev) => {
      const allowed = new Set(registryIds);
      const next = prev.filter((x) => allowed.has(x));
      return next.length ? next : defaultSelectedRegistryIds;
    });
  }, [registryIds]);

  const { registry, actionHandlers } = useCombinedComponentRegistryForIds(selectedRegistryIds);

  useEffect(() => {
    if (!versions?.length) return;
    setCurrent(versions[0]);
  }, [versions]);

  const toggleRegistry = (rid: string) => {
    setSelectedRegistryIds((prev) => {
      const exists = prev.includes(rid);
      const next = exists ? prev.filter((x) => x !== rid) : [...prev, rid];
      // Ensure at least one registry is selected.
      return next.length ? next : ["app"];
    });
  };

  const registryMenuChildren = registryIds.map((rid) => ({
    key: `registry:${rid}`,
    label: rid,
    icon: (selectedRegistryIds.includes(rid) ? ("check" as IconToken) : undefined),
    onClick: () => toggleRegistry(rid),
  }));

  const actions = [
    {
      key: "save",
      label: t("save"),
      icon: "save" as IconToken,
      onClick: () => setSaveOpen(true),
    },
    {
      key: "registries",
      label: t("registries"),
      icon: "components" as IconToken,
      children: registryMenuChildren,
    },
    ...versions.map((v) => ({
      key: v._msgId + ":" + v._partIndex,
      icon: v._ts == current?._ts ? "check" as IconToken : undefined,
      label: formatShort(v._ts),
      onClick: () => setCurrent(v),
    })),
  ];

  const parsed = useMemo(() => parseTree(current?.text), [current?.text]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Card
        title={getFileName(uri)}
        description={formatShort(current?._ts)}
        headerActions={<Menu items={actions} />}
      >
        <div />
      </Card>
      <AppSaveModal
        open={saveOpen}
        defaultName={getFileName(uri)}
        defaultIncludeData={false}
        onCancel={() => setSaveOpen(false)}
        onSave={async ({ name, includeData }: AppSaveModalValues) => {
          if (!parsed.tree) return;
          await appsStore.create({
            name,
            uiTree: parsed.tree,
            data: includeData ? current?.output : undefined,
          });
          setSaveOpen(false);
        }}
      />
      {parsed.error ? (
        <div style={{ padding: 8 }}>
          {t("Something went wrong")}: {parsed.error}
        </div>
      ) : (
        <Tabs activeKey={activeTab} onSelect={(k: string) => setActiveTab(k)}>
          {/* GENERAL */}
          <Tab eventKey="app" title={t("app")}>
            <ErrorBoundary fallbackRender={(er) => "Something went wrong:" + er.error}>
              <DataProvider
                initialData={current?.output}>
                <VisibilityProvider>
                  <ActionProvider handlers={actionHandlers}>
                    <Renderer tree={parsed.tree} registry={registry} />
                  </ActionProvider>
                </VisibilityProvider>
              </DataProvider>
            </ErrorBoundary>
          </Tab>
          <Tab eventKey="structure" title={t("structure")}>
            <JsonViewer value={parsed.tree} />
          </Tab>
          <Tab eventKey="data" title={t("data")}>
            <JsonViewer value={current?.output ?? {}} />
          </Tab>
        </Tabs>
      )}
    </div>
  );
};
