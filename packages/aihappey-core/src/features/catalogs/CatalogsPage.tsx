import { useMemo, useState } from "react";
import {
  JsonRenderCatalogActionCard,
  JsonRenderCatalogComponentCard,
  useTheme,
} from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { useJsonRenderCatalog } from "aihappey-json-render-catalog";
import { OverviewPageHeader } from "../../ui/layout/OverviewPageHeader";
import { catalog as builtInCatalog } from "../json-render/catalog";

function normalizeText(v: unknown) {
  return String(v ?? "").trim().toLowerCase();
}

export const CatalogsPage = () => {
  const { Tabs, Tab, Text, SearchBox, Modal, Button, JsonViewer } = useTheme();
  const { t } = useTranslation();
  const catalogs = useJsonRenderCatalog();

  const DEFAULT_TAB_KEY = "__default__";

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

  const items = useMemo(() => {
    const list = Array.isArray(catalogs.items) ? catalogs.items : [];
    const sorted = list
      .slice()
      .sort((a, b) => collator.compare(a.name ?? "", b.name ?? ""));
    return sorted;
  }, [catalogs.items, collator]);

  // Ensure a stable default tab.
  // We always start on the built-in catalog tab.
  const effectiveActiveTab = activeTab || DEFAULT_TAB_KEY;

  const activeCatalog = useMemo(
    () => items.find((c) => c.id === effectiveActiveTab),
    [items, effectiveActiveTab]
  );

  const builtInComponents = useMemo(() => {
    const list = (builtInCatalog.componentNames ?? []).map((name) => {
      const def: any = (builtInCatalog as any)?.data?.components?.[name];
      let propsSchema: string | undefined;
      try {
        propsSchema = JSON.stringify(def?.props?.toJSONSchema?.() ?? {}, null, 2);
      } catch {
        propsSchema = JSON.stringify({}, null, 2);
      }
      return {
        id: `${DEFAULT_TAB_KEY}:component:${String(name)}`,
        name: String(name),
        updatedAt: undefined as string | undefined,
        description: def?.description,
        propsSchema,
      };
    });
    return list
      .filter((c) => (q ? normalizeText(`${c.name} ${c.description ?? ""}`).includes(q) : true))
      .sort((a, b) => collator.compare(a.name ?? "", b.name ?? ""));
  }, [collator, q, DEFAULT_TAB_KEY]);

  const builtInActions = useMemo(() => {
    const list = (builtInCatalog.actionNames ?? []).map((name) => {
      const def: any = (builtInCatalog as any)?.data?.actions?.[name];
      let paramsSchema: string | undefined;
      try {
        paramsSchema = JSON.stringify(def?.params?.toJSONSchema?.() ?? {}, null, 2);
      } catch {
        paramsSchema = JSON.stringify({}, null, 2);
      }
      return {
        id: `${DEFAULT_TAB_KEY}:action:${String(name)}`,
        name: String(name),
        title: String(name),
        updatedAt: undefined as string | undefined,
        description: def?.description,
        paramsSchema,
      };
    });
    return list
      .filter((a) =>
        q
          ? normalizeText(`${a.name} ${a.title ?? ""} ${a.description ?? ""}`).includes(q)
          : true
      )
      .sort((a, b) => collator.compare(a.title ?? a.name ?? "", b.title ?? b.name ?? ""));
  }, [collator, q, DEFAULT_TAB_KEY]);

  const filteredComponents = useMemo(() => {
    const comps = activeCatalog?.components ?? [];
    const out = q
      ? comps.filter((c) => normalizeText(`${c.name} ${c.description ?? ""}`).includes(q))
      : comps;
    return out
      .slice()
      .sort((a, b) => collator.compare(a.name ?? "", b.name ?? ""));
  }, [activeCatalog, collator, q]);

  const filteredActions = useMemo(() => {
    const acts = activeCatalog?.actions ?? [];
    const out = q
      ? acts.filter((a) =>
        normalizeText(`${a.name} ${a.title ?? ""} ${a.description ?? ""}`).includes(q)
      )
      : acts;
    return out
      .slice()
      .sort((a, b) => collator.compare(a.title ?? a.name ?? "", b.title ?? b.name ?? ""));
  }, [activeCatalog, collator, q]);

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
          <Tab key={DEFAULT_TAB_KEY} eventKey={DEFAULT_TAB_KEY} title={t("providerDefault")}>
            <div style={{ paddingTop: 12, width: "100%" }}>
              <Text as="p" align={"start"}>
                {t("componentsPage.title")}
              </Text>
              {renderGrid(
                builtInComponents.length === 0 ? (
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
                  builtInComponents.map((c) => (
                    <div
                      key={c.id}
                      style={{ maxWidth: 320, minWidth: 320, width: "100%" }}
                    >
                      <JsonRenderCatalogComponentCard
                        item={c}
                        onOpen={() =>
                          setOpenItem({
                            kind: "component",
                            title: c.name,
                            schema: parseMaybeJson(c.propsSchema),
                            raw: c.propsSchema,
                          })
                        }
                      />
                    </div>
                  ))
                )
              )}

              <Text as="p" align={"start"}>
                {t("actions")}
              </Text>
              {renderGrid(
                builtInActions.length === 0 ? (
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
                  builtInActions.map((a) => (
                    <div
                      key={a.id}
                      style={{ maxWidth: 320, minWidth: 320, width: "100%" }}
                    >
                      <JsonRenderCatalogActionCard
                        item={a}
                        onOpen={() =>
                          setOpenItem({
                            kind: "action",
                            title: a.title ?? a.name,
                            schema: parseMaybeJson(a.paramsSchema),
                            raw: a.paramsSchema,
                          })
                        }
                      />
                    </div>
                  ))
                )
              )}
            </div>
          </Tab>

          {items.map((catalog) => {
            const eventKey = catalog.id;
            return (
              <Tab
                key={eventKey}
                eventKey={eventKey}
                title={catalog.name}
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
                          key={`${catalog.id}:component:${c.name}`}
                          style={{ maxWidth: 320, minWidth: 320, width: "100%" }}
                        >
                          <JsonRenderCatalogComponentCard
                            item={{
                              id: `${catalog.id}:${c.name}`,
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
                            onDelete={catalog.manageable ? async () => {
                              const next = {
                                ...catalog,
                                components: (catalog.components ?? []).filter((x) => x.name !== c.name),
                              };
                              await catalogs.update(catalog.id, {
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
                          key={`${catalog.id}:action:${a.name}`}
                          style={{ maxWidth: 320, minWidth: 320, width: "100%" }}
                        >
                          <JsonRenderCatalogActionCard
                            item={{
                              id: `${catalog.id}:${a.name}`,
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
                            onDelete={catalog.manageable ? async () => {
                              const next = {
                                ...catalog,
                                actions: (catalog.actions ?? []).filter((x) => x.name !== a.name),
                              };
                              await catalogs.update(catalog.id, {
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

