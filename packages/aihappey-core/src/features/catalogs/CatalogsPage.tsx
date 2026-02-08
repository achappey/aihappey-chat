import { useMemo, useState } from "react";
import {
  JsonRenderCatalogActionCard,
  JsonRenderCatalogComponentCard,
  useTheme,
} from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { useJsonRenderCatalog } from "aihappey-json-render-catalog";
import { builtInCatalogDefinitions } from "aihappey-ai-components-default";
import { z } from "zod";
import { OverviewPageHeader } from "../../ui/layout/OverviewPageHeader";
import {
  builtInCatalogLabels,
} from "../json-render/catalog";

function normalizeText(v: unknown) {
  return String(v ?? "").trim().toLowerCase();
}

function toJsonSchemaString(maybeSchema: any) {
  try {
    if (maybeSchema?.toJSONSchema) {
      return JSON.stringify(maybeSchema.toJSONSchema(), null, 2);
    }
  } catch {
    // fall through
  }
  try {
    const converted = (z as any)?.toJSONSchema?.(maybeSchema);
    return JSON.stringify(converted ?? {}, null, 2);
  } catch {
    return JSON.stringify({}, null, 2);
  }
}

export const CatalogsPage = () => {
  const { Tabs, Tab, Text, SearchBox, Modal, Button, JsonViewer } = useTheme();
  const { t } = useTranslation();
  const catalogs = useJsonRenderCatalog();

  const BUILT_IN_TAB_IDS = ["app", "openapi", "adaptive-cards"] as const;
  const DEFAULT_TAB_KEY = "app";

  const [activeTab, setActiveTab] = useState<string>("");
  const [search, setSearch] = useState("");
  const q = normalizeText(search);

  const [openItem, setOpenItem] = useState<
    | { kind: "component"; title: string; schema?: any; raw?: string }
    | { kind: "action"; title: string; schema?: any; raw?: string }
    | null
  >(null);

  const collator = useMemo(
    () => new Intl.Collator(undefined, { sensitivity: "base", numeric: true }),
    []
  );

  const customItems = useMemo(() => {
    const list = Array.isArray(catalogs.items) ? catalogs.items : [];
    const builtInIds = new Set<string>(BUILT_IN_TAB_IDS as readonly string[]);
    const sorted = list
      .filter((c) => !builtInIds.has(String(c.id ?? "")))
      .slice()
      .sort((a, b) => collator.compare(a.name ?? "", b.name ?? ""));
    return sorted;
  }, [catalogs.items, collator]);

  // Ensure a stable default tab.
  // We always start on the built-in app tab.
  const effectiveActiveTab = activeTab || DEFAULT_TAB_KEY;

  const tabs = useMemo(() => {
    const builtInTabs: Array<{
      id: string;
      title: string;
      manageable: boolean;
      components: Array<any>;
      actions: Array<any>;
      original?: any;
    }> = BUILT_IN_TAB_IDS.map((id) => {
      const builtInDefinition: any = (builtInCatalogDefinitions as any[]).find((d) => d?.name === id);
      const components = Object.entries(builtInDefinition?.components ?? {}).map(([name, definition]) => {
        const def: any = definition;
        const propsSchema: string | undefined = toJsonSchemaString(def?.props);
        return {
          id: `${id}:component:${String(name)}`,
          name: String(name),
          updatedAt: undefined as string | undefined,
          description: def?.description,
          propsSchema,
        };
      });

      const actions = Object.entries(builtInDefinition?.actions ?? {}).map(([name, definition]) => {
        const def: any = definition;
        const paramsSchema: string | undefined = toJsonSchemaString(def?.params);
        return {
          id: `${id}:action:${String(name)}`,
          name: String(name),
          title: String(name),
          updatedAt: undefined as string | undefined,
          description: def?.description,
          paramsSchema,
        };
      });

      return {
        id,
        title: builtInCatalogLabels[id] ?? id,
        manageable: false,
        components,
        actions,
        original: undefined,
      };
    });

    const customTabs: Array<{
      id: string;
      title: string;
      manageable: boolean;
      components: Array<any>;
      actions: Array<any>;
      original?: any;
    }> = customItems.map((catalog) => ({
      id: catalog.id,
      title: catalog.name,
      manageable: !!catalog.manageable,
      components: catalog.components ?? [],
      actions: catalog.actions ?? [],
      original: catalog,
    }));

    return [...builtInTabs, ...customTabs];
  }, [customItems]);

  const filteredByTab = useMemo(() => {
    const out: Record<
      string,
      {
        components: Array<any>;
        actions: Array<any>;
      }
    > = {};

    for (const tab of tabs) {
      const components = (tab.components ?? [])
        .filter((c: any) =>
          q ? normalizeText(`${c.name} ${c.description ?? ""}`).includes(q) : true
        )
        .slice()
        .sort((a: any, b: any) => collator.compare(a.name ?? "", b.name ?? ""));

      const actions = (tab.actions ?? [])
        .filter((a: any) =>
          q
            ? normalizeText(`${a.name} ${a.title ?? ""} ${a.description ?? ""}`).includes(q)
            : true
        )
        .slice()
        .sort((a: any, b: any) => collator.compare(a.title ?? a.name ?? "", b.title ?? b.name ?? ""));

      out[String(tab.id)] = { components, actions };
    }

    return out;
  }, [tabs, q, collator]);

  const renderGrid = (children: any) => (
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
      {children}
    </div>
  );

  function parseMaybeJson(raw?: string) {
    if (!raw) return undefined;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  return (
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
        <OverviewPageHeader title={t("catalogs")} />

        <Text as="p" align={"center"}>{t("catalogsPage.description")}</Text>

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

        <Tabs
          activeKey={effectiveActiveTab}
          onSelect={(k: string) => setActiveTab(k)}
        >
          {tabs.map((catalogTab) => {
            const eventKey = String(catalogTab.id);
            const filteredComponents = filteredByTab[eventKey]?.components ?? [];
            const filteredActions = filteredByTab[eventKey]?.actions ?? [];
            return (
              <Tab
                key={eventKey}
                eventKey={eventKey}
                title={catalogTab.title}
              >
                <div style={{ paddingTop: 12, width: "100%" }}>
                  <Text as="p" align={"start"}>
                    {t("components")}
                  </Text>
                  {renderGrid(
                    filteredComponents.length === 0 ? (
                      <div
                        style={{
                          color: "#888",
                          gridColumn: "1 / -1",
                          textAlign: "center",
                        }}
                      >
                        {t("noResults")}
                      </div>
                    ) : (
                      filteredComponents.map((c) => (
                        <div
                          key={`${eventKey}:component:${c.name}`}
                          style={{ maxWidth: 320, minWidth: 320, width: "100%" }}
                        >
                          <JsonRenderCatalogComponentCard
                            item={{
                              id: `${eventKey}:${c.name}`,
                              name: c.name,
                              updatedAt: c.updatedAt,
                              description: c.description,
                              propsSchema: c.propsSchema,
                            }}
                            onOpen={() =>
                              setOpenItem({
                                kind: "component",
                                title: c.name,
                                schema: parseMaybeJson(c.propsSchema),
                                raw: c.propsSchema,
                              })
                            }
                            onDelete={catalogTab.manageable ? async () => {
                              const source = catalogTab.original;
                              if (!source) return;
                              const next = {
                                ...source,
                                components: (source.components ?? []).filter((x: any) => x.name !== c.name),
                              };
                              await catalogs.update(source.id, {
                                name: next.name,
                                manageable: next.manageable,
                                components: next.components,
                                actions: next.actions,
                                validationFunctions: next.validationFunctions,
                              });
                            } : undefined}
                          />
                        </div>
                      ))
                    )
                  )}

                  <Text as="p" align={"start"}>
                    {t("actions")}
                  </Text>
                  {renderGrid(
                    filteredActions.length === 0 ? (
                      <div
                        style={{
                          color: "#888",
                          gridColumn: "1 / -1",
                          textAlign: "center",
                        }}
                      >
                        {t("noResults")}
                      </div>
                    ) : (
                      filteredActions.map((a) => (
                        <div
                          key={`${eventKey}:action:${a.name}`}
                          style={{ maxWidth: 320, minWidth: 320, width: "100%" }}
                        >
                          <JsonRenderCatalogActionCard
                            item={{
                              id: `${eventKey}:${a.name}`,
                              name: a.name,
                              title: a.title,
                              updatedAt: a.updatedAt,
                              description: a.description,
                              paramsSchema: a.paramsSchema,
                            }}
                            onOpen={() =>
                              setOpenItem({
                                kind: "action",
                                title: a.title ?? a.name,
                                schema: parseMaybeJson(a.paramsSchema),
                                raw: a.paramsSchema,
                              })
                            }
                            onDelete={catalogTab.manageable ? async () => {
                              const source = catalogTab.original;
                              if (!source) return;
                              const next = {
                                ...source,
                                actions: (source.actions ?? []).filter((x: any) => x.name !== a.name),
                              };
                              await catalogs.update(source.id, {
                                name: next.name,
                                manageable: next.manageable,
                                components: next.components,
                                actions: next.actions,
                                validationFunctions: next.validationFunctions,
                              });
                            } : undefined}
                          />
                        </div>
                      ))
                    )
                  )}
                </div>
              </Tab>
            );
          })}
        </Tabs>
      </div>

      <Modal
        show={!!openItem}
        onHide={() => setOpenItem(null)}
        title={openItem?.title ?? ""}
        actions={<Button onClick={() => setOpenItem(null)}>{t("close")}</Button>}
      >
        <JsonViewer value={openItem?.schema ?? openItem?.raw ?? {}} />
      </Modal>
    </div>
  );
};

