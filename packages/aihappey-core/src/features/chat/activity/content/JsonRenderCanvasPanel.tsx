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

export type JsonRenderCanvasPanelVersion = {
  tree?: any;
  output?: any;
  label?: string;
  isActive?: boolean;
  onSelect?: () => void;
};

export const JsonRenderCanvasPanel = ({
  title,
  description,
  tree,
  output,
  versions,
  allowSave = true,
}: {
  title: string;
  description?: string;
  tree?: any;
  output?: any;
  versions?: JsonRenderCanvasPanelVersion[];
  allowSave?: boolean;
}) => {
  const { Card, Menu, Tabs, Tab, JsonViewer } = useTheme();
  const { t } = useTranslation();
  const appsStore = useJsonRenderApps();
  const jsonRenderRegistry = useJsonRenderRegistry();
  const defaultRegistries = useAppStore((s) => (s as any).defaultRegistries as string | undefined);
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

  const [selectedRegistryIds, setSelectedRegistryIds] = useState<string[]>(defaultSelectedRegistryIds);
  useEffect(() => {
    setSelectedRegistryIds((prev) => {
      const allowed = new Set(registryIds);
      const next = prev.filter((x) => allowed.has(x));
      return next.length ? next : defaultSelectedRegistryIds;
    });
  }, [registryIds, defaultSelectedRegistryIds]);

  const { registry, actionHandlers } = useCombinedComponentRegistryForIds(selectedRegistryIds);

  const toggleRegistry = (rid: string) => {
    setSelectedRegistryIds((prev) => {
      const exists = prev.includes(rid);
      const next = exists ? prev.filter((x) => x !== rid) : [...prev, rid];
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
    ...(allowSave
      ? [
          {
            key: "save",
            label: t("save"),
            icon: "save" as IconToken,
            onClick: () => setSaveOpen(true),
          },
        ]
      : []),
    {
      key: "registries",
      label: t("registries"),
      icon: "components" as IconToken,
      children: registryMenuChildren,
    },
    ...(versions ?? []).map((v, idx) => ({
      key: `version:${idx}`,
      icon: v.isActive ? ("check" as IconToken) : undefined,
      label: v.label ?? t("version"),
      onClick: v.onSelect,
    })),
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Card
        title={title}
        description={description}
        headerActions={<Menu items={actions} />}
      >
        <div />
      </Card>
      <AppSaveModal
        open={saveOpen}
        defaultName={title}
        defaultIncludeData={false}
        onCancel={() => setSaveOpen(false)}
        onSave={async ({ name, includeData }: AppSaveModalValues) => {
          if (!tree) return;
          await appsStore.create({
            name,
            uiTree: tree,
            data: includeData ? output : undefined,
          });
          setSaveOpen(false);
        }}
      />
      {!tree ? (
        <div style={{ padding: 8 }}>{t("Nothing to render")}</div>
      ) : (
        <Tabs activeKey={activeTab} onSelect={(k: string) => setActiveTab(k)}>
          <Tab eventKey="app" title={t("app")}>
            <ErrorBoundary fallbackRender={(er) => "Something went wrong:" + er.error}>
              <DataProvider initialData={output ?? {}}>
                <VisibilityProvider>
                  <ActionProvider handlers={actionHandlers}>
                    <Renderer tree={tree} registry={registry} />
                  </ActionProvider>
                </VisibilityProvider>
              </DataProvider>
            </ErrorBoundary>
          </Tab>
          <Tab eventKey="structure" title={t("structure")}>
            <JsonViewer value={tree} />
          </Tab>
          <Tab eventKey="data" title={t("data")}>
            <JsonViewer value={output ?? {}} />
          </Tab>
        </Tabs>
      )}
    </div>
  );
};
