import { useEffect, useMemo, useState } from "react";
import {
  JsonRenderRegistryComponentCard,
  ToolForm,
  useTheme,
} from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { useJsonRenderRegistry } from "aihappey-json-render-registry";
import type { JsonRenderRegistryItem } from "aihappey-json-render-registry";
import { OverviewPageHeader } from "../../ui/layout/OverviewPageHeader";
import { ErrorBoundary } from "react-error-boundary";
import { ActionProvider, StateProvider, VisibilityProvider, useActions } from "@json-render/react";
import { defaultRegistryBundles } from "aihappey-ai-components-default";
import { builtInRegistryLabels, useCombinedComponentRegistryForIds } from "../json-render/ComponentRegistry";

function normalizeText(v: unknown) {
  return String(v ?? "").trim().toLowerCase();
}

export const RegistriesPage = () => {
  const { Tabs, Tab, SearchBox, Text,
    Modal, Button, Alert, JsonViewer } = useTheme();
  const { t } = useTranslation();
  const registryStore = useJsonRenderRegistry();

  const DEFAULT_TAB_KEY = "app";

  const [viewItem, setViewItem] = useState<JsonRenderRegistryItem | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  // Used to force preview remounts (workaround for renderer-level caching keyed by element id/key).
  const [previewRevision, setPreviewRevision] = useState(0);

  const propsSchemaObject = useMemo(() => {
    const raw = viewItem?.propsSchema;
    if (!raw) return { schema: { type: "object", properties: {} }, error: undefined as string | undefined };
    try {
      const parsed = JSON.parse(raw);
      return { schema: parsed, error: undefined as string | undefined };
    } catch (e) {
      return {
        schema: { type: "object", properties: {} },
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }, [viewItem?.propsSchema]);

  useEffect(() => {
    if (!viewItem) return;
    setFormValues({});
    setPreviewRevision(0);
  }, [viewItem?.id]);

  const previewRegistryIds = useMemo(
    () => (viewItem?.registryId ? [viewItem.registryId] : ["app"]),
    [viewItem?.registryId],
  );
  const { registry, errors: registryErrors, actionHandlers, actionErrors } =
    useCombinedComponentRegistryForIds(previewRegistryIds);

  const previewElement = useMemo(() => {
    if (!viewItem) return null;
    return {
      key: `preview-${String(viewItem.id ?? viewItem.name ?? "")}-${previewRevision}`,
      type: viewItem.name,
      props: formValues,
      children: [],
    };
  }, [viewItem, formValues, previewRevision]);

  const PreviewHost = ({ componentName }: { componentName: string }) => {
    const { execute } = useActions();
    const Component = (registry as any)?.[componentName] as any;
    if (!Component) return null;

    // Support BOTH conventions:
    // 1) runtime registry components expecting direct props (e.g. props.text)
    // 2) json-render component renderers expecting ComponentRenderProps (props.element.props)
    return (
      <Component
        {...formValues}
        element={previewElement as any}
        onAction={execute}
        loading={false}
      />
    );
  };

  const [activeTab, setActiveTab] = useState<string>("");
  const [search, setSearch] = useState("");
  const q = normalizeText(search);

  const collator = useMemo(
    () => new Intl.Collator(undefined, { sensitivity: "base", numeric: true }),
    []
  );

  const registryIds = useMemo(() => {
    const ids = new Set<string>();
    for (const bundle of defaultRegistryBundles) {
      ids.add(bundle.id);
    }
    for (const item of registryStore.items ?? []) {
      if (item?.registryId) ids.add(item.registryId);
    }
    return Array.from(ids)//.sort((a, b) => collator.compare(a, b));
  }, [registryStore.items, collator]);

  // Default tab is always the initial selection.
  const effectiveActiveTab = activeTab || DEFAULT_TAB_KEY;

  const itemsByRegistryId = useMemo(() => {
    const out = new Map<string, JsonRenderRegistryItem[]>();

    for (const bundle of defaultRegistryBundles) {
      out.set(bundle.id, [...((bundle.items ?? []) as JsonRenderRegistryItem[])]);
    }

    for (const item of registryStore.items ?? []) {
      const rid = item?.registryId;
      if (!rid) continue;
      const next = out.get(rid) ?? [];
      next.push(item);
      out.set(rid, next);
    }

    for (const [rid, items] of out.entries()) {
      const filtered = q
        ? items.filter((i) => normalizeText(`${i.name} ${i.id}`).includes(q))
        : items;
      out.set(
        rid,
        filtered
          .slice()
          .sort((a, b) => collator.compare(a.name ?? "", b.name ?? "")),
      );
    }

    return out;
  }, [registryStore.items, q, collator]);

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
        <OverviewPageHeader title={t("registries")} />

        <Text as="p" align={"center" }>{t("registriesPage.description")}</Text>

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

        <Tabs activeKey={effectiveActiveTab} onSelect={(k: string) => setActiveTab(k)}>
          {registryIds.length === 0 ? null : (
            registryIds.map((rid) => {
              const activeItems = itemsByRegistryId.get(rid) ?? [];
              return (
                <Tab
                  key={rid}
                  eventKey={rid}
                  title={builtInRegistryLabels[rid as keyof typeof builtInRegistryLabels] ?? rid}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 16,
                      width: "100%",
                      maxWidth: 700,
                      marginBottom: 24,
                      paddingTop: 12,
                      justifyItems: "center",
                    }}
                  >
                    {activeItems.length === 0 ? (
                      <div style={{ color: "#888", gridColumn: "1 / -1", textAlign: "center" }}>
                        {t("noResults")}
                      </div>
                    ) : (
                      activeItems.map((item) => (
                        <div key={item.id} style={{ maxWidth: 320, minWidth: 320, width: "100%" }}>
                          <JsonRenderRegistryComponentCard
                            item={{
                              id: item.id,
                              registryId: item.registryId,
                              name: item.name,
                              updatedAt: item.updatedAt,
                            }}
                            onOpen={() => setViewItem(item)}
                            onDelete={item.id?.startsWith("built-in:") ? undefined : async () => {
                              await registryStore.delete(item.id);
                            }}
                          />
                        </div>
                      ))
                    )}
                  </div>
                </Tab>
              );
            })
          )}
        </Tabs>

        <Modal
          show={!!viewItem}
          size="large"
          title={viewItem?.name ?? ""}
          onHide={() => setViewItem(null)}
          actions={
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button variant="secondary" onClick={() => setViewItem(null)}>
                {t("close")}
              </Button>
            </div>
          }
        >
          {!viewItem ? null : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
                <Text as="strong">{t("properties")}</Text>

                {propsSchemaObject.error ? (
                  <Alert variant="warning">
                    {t("structuredOutputsPlaceholder")}: {propsSchemaObject.error}
                  </Alert>
                ) : null}

                <ToolForm
                  inputSchema={propsSchemaObject.schema}
                  values={formValues}
                  onChange={(next) => {
                    setFormValues(next);
                    setPreviewRevision((r) => r + 1);
                  }}
                />

                {(registryErrors?.length ?? 0) > 0 ? (
                  <div>
                    <strong>{t("error")}</strong>
                    <JsonViewer value={registryErrors} />
                  </div>
                ) : null}

                {(actionErrors?.length ?? 0) > 0 ? (
                  <div>
                    <strong>{t("error")}</strong>
                    <JsonViewer value={actionErrors} />
                  </div>
                ) : null}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
                <strong>{t("preview")}</strong>

                <div style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 8, padding: 12 }}>
                  <ErrorBoundary
                    fallbackRender={({ error }: any) => (
                      <Alert variant="error">
                        {t("Something went wrong")}: {String(error?.message ?? error)}
                      </Alert>
                    )}
                  >
                    <StateProvider initialState={{}}>
                      <VisibilityProvider>
                        <ActionProvider handlers={actionHandlers}>
                          {viewItem ? (
                            (registry as any)?.[viewItem.name] ? (
                              <PreviewHost componentName={viewItem.name} />
                            ) : (
                              <Alert variant="warning">
                                {t("error")}: {t("Something went wrong")}: No renderer for component type: {viewItem.name}
                              </Alert>
                            )
                          ) : null}
                        </ActionProvider>
                      </VisibilityProvider>
                    </StateProvider>
                  </ErrorBoundary>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

