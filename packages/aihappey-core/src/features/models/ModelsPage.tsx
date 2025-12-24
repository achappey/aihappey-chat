import { useState } from "react";
import { useAppStore } from "aihappey-state";
import { ModelCard, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { OverviewPageHeader } from "../../ui/layout/OverviewPageHeader";
import { useDarkMode } from "usehooks-ts";
import { PROVIDERS } from "../../runtime/providers/providerMetadata";
import { useNavigate } from "react-router";

export const ModelsPage = () => {
  const { SearchBox, Paragraph, Tabs, Tab } = useTheme();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const { isDarkMode } = useDarkMode();
  const navigate = useNavigate()
  const models = useAppStore((s) => s.models);
  // unique types
  const types = Array.from(new Set(models?.map(m => m.type))).sort();
  // default tab = first type
  const [activeTab, setActiveTab] = useState<string>(types[0]);

  const filtered = models
    ?.filter(m =>
      m.type === activeTab &&
      (!search ||
        m.id.includes(search) ||
        m.name?.includes(search))
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
            alignItems: "center",
          }}
        >
          <OverviewPageHeader
            title={t("ai.title")}
          />

          <Paragraph style={{ textAlign: "center" }}>
            {t("ai.description")}
          </Paragraph>

          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <div style={{
              width: 360,
              maxWidth: "100%"
            }}>
              <SearchBox
                value={search}
                onChange={setSearch}
                placeholder={t("searchPlaceholder")}
              />
            </div>
          </div>

          <Tabs activeKey={activeTab}
            onSelect={(k: string) => setActiveTab(k)}>
            {types.map(type => (
              <Tab key={type}
                eventKey={type}
                title={t(type)
                  + " (" + models?.filter(a => a.type == type)?.length + ")"}>
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
                  {filtered?.map(r => {
                    const providerId = r.id.split("/")[0].toLowerCase();
                    const icons = (PROVIDERS as any)[providerId]?.icons as
                      | { src: string; theme?: "light" | "dark" }[]
                      | undefined;

                    const image =
                      icons?.find(i => i.theme === (isDarkMode ? "dark" : "light"))?.src ??
                      icons?.[0]?.src;

                    return (
                      <div key={r.id}
                        style={{
                          maxWidth: 320,
                          minWidth: 320,
                          width: "100%"
                        }}>
                        <ModelCard
                          model={r}
                          image={image}
                          onChat={() => navigate(`/?model=${r.id}`)}
                        />
                      </div>
                    );
                  })}
                </div>
              </Tab>
            ))}
          </Tabs>
        </div>
      </div>
    </>
  );
};