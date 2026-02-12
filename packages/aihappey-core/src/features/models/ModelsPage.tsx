import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "aihappey-state";
import { ModelCard, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { OverviewPageHeader } from "../../ui/layout/OverviewPageHeader";
import { useDarkMode } from "usehooks-ts";
import { PROVIDERS } from "../../runtime/providers/providerMetadata";
import { useNavigate } from "react-router";
import type { GenericDataGridColumn, ModelOption } from "aihappey-types";
import { useIsDesktop } from "../../shell/responsive/useIsDesktop";

export const ModelsPage = () => {
  const PAGE_SIZE = 50;
  const { SearchBox, Text, Tabs, Tab, ToggleButton, DataGrid, Button, Image } = useTheme();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const { isDarkMode } = useDarkMode();
  const navigate = useNavigate()
  const models = useAppStore((s) => s.models);
  // unique types
  const types = Array.from(new Set(models?.map(m => m.type))).sort();
  // default tab = first type
  const [activeTab, setActiveTab] = useState<string>(types[0]);
  const isDesktop = useIsDesktop()

  const [viewMode, setViewMode] = useState<"cards" | "grid">("cards");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeTab, search]);

  const collator = useMemo(
    () => new Intl.Collator(undefined, { sensitivity: "base", numeric: true }),
    []
  );

  const money = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 10,
      }),
    []
  );

  const formatPrice = (v?: string) => {
    if (!v) return "";
    const n = Number(v);
    if (!Number.isFinite(n)) return String(v);
    return money.format(n);
  };

  const gridColumns: GenericDataGridColumn<ModelOption>[] = useMemo(
    () => [
      {
        key: "provider",
        header: "",
        render: (row) => {
          const providerId = row.id.split("/")[0].toLowerCase();
          const icons = (PROVIDERS as any)[providerId]?.icons as
            | { src: string; theme?: "light" | "dark" }[]
            | undefined;
          const image =
            icons?.find((i) => i.theme === (isDarkMode ? "dark" : "light"))
              ?.src ?? icons?.[0]?.src;

          if (!image) return null;

          return (
            <div style={{ width: 24, height: 24, display: "flex", alignItems: "center" }}>
              <Image src={image} width={24} height={24} />
            </div>
          );
        },
      },
      {
        key: "name",
        header: "Name",
        sortable: true,
        sortFn: (a, b) => collator.compare(a.name ?? "", b.name ?? ""),
        render: (row) => row.name || row.id,
      },
      {
        key: "owned_by",
        header: "Owned by",
        sortable: true,
        sortFn: (a, b) => collator.compare(a.owned_by ?? "", b.owned_by ?? ""),
        render: (row) => row.owned_by,
      },
      {
        key: "pricing_input",
        header: "Input",
        sortable: true,
        sortFn: (a, b) =>
          (Number(a.pricing?.input ?? NaN) || 0) - (Number(b.pricing?.input ?? NaN) || 0),
        render: (row) => formatPrice(row.pricing?.input),
      },
      {
        key: "pricing_output",
        header: "Output",
        sortable: true,
        sortFn: (a, b) =>
          (Number(a.pricing?.output ?? NaN) || 0) - (Number(b.pricing?.output ?? NaN) || 0),
        render: (row) => formatPrice(row.pricing?.output),
      },
      {
        key: "chat",
        header: "",
        render: (row) => (
          <Button
            variant="subtle"
            icon="chat"
            onClick={() => navigate(`/?model=${row.id}`)}
          />
        ),
      },
    ],
    [Button, collator, navigate]
  );

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
            paddingLeft: 8,
            paddingRight: 8,
            boxSizing: "border-box",
            alignItems: "center",
          }}
        >
          <OverviewPageHeader
            title={t("ai.title")}
          />

          <Text as="p" align={"center"}>
            {t("ai.description", { total: models?.length })}
          </Text>

          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <div style={{
              //  width: 360,
              display: "flex",
              justifyContent: "center",
              width: "100%",
              maxWidth: "100%"
            }}>
              <SearchBox
                value={search}
                onChange={setSearch}
                placeholder={t("searchPlaceholder")}
              />
            </div>
          </div>

          {false && <div
            style={{
              width: "100%",
              maxWidth: 700,
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <ToggleButton
              checked={false}
              size="small"
              variant="informative"
              icon={viewMode === "cards" ? "cardList" : "table"}
              onClick={() => setViewMode(viewMode === "cards" ? "grid" : "cards")}
              title={viewMode === "cards" ? "Card view" : "Table view"}
              style={{ opacity: 0.85 }}
            />
          </div>}

          <Tabs activeKey={activeTab}
            style={{ width: "100%" }}
            onSelect={(k: string) => setActiveTab(k)}>
            {types.map(type => (
              <Tab key={type}
                eventKey={type}
                title={t(type)
                  + " (" + models?.filter(a => a.type == type)?.length + ")"}>
                {(() => {
                  const tabFiltered = models
                    ?.filter(m =>
                      m.type === type &&
                      (!search ||
                        m.id.includes(search) ||
                        m.name?.includes(search))
                    ) as ModelOption[] | undefined;

                  if (viewMode === "grid") {
                    return (
                      <div style={{ width: "100%", maxWidth: 700, marginBottom: 24 }}>
                        <DataGrid
                          columns={gridColumns}
                          data={tabFiltered ?? []}
                          rowKey={(row) => row.id}
                          selectionMode="none"
                        />
                      </div>
                    );
                  }

                  return (
                    <div style={{ width: "100%", maxWidth: 700, marginBottom: 24 }}>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr",
                          gap: 16,
                          paddingTop: 12,
                          width: "100%",
                          justifyItems: "center",
                        }}
                      >
                        {tabFiltered?.slice(0, visibleCount).map(r => {
                          const providerId = r.id.split("/")[0].toLowerCase();
                          const provider = PROVIDERS[providerId];

                          return (
                            <div key={r.id}
                              style={{
                                width: "100%"
                              }}>
                              <ModelCard
                                model={r}
                                provider={provider}
                                onChat={() => navigate(`/?model=${r.id}`)}
                              />
                            </div>
                          );
                        })}
                      </div>

                      {!!tabFiltered && tabFiltered.length > visibleCount && (
                        <div
                          style={{
                            width: "100%",
                            display: "flex",
                            justifyContent: "center",
                            marginTop: 16,
                          }}
                        >
                          <Button
                            variant="subtle"
                            onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                          >
                            {t('showMore')}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </Tab>
            ))}
          </Tabs>
        </div>
      </div>
    </>
  );
};
