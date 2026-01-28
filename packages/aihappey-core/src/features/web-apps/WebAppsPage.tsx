import { useMemo, useState } from "react";
import { JsonRenderAppCard, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { useJsonRenderApps } from "aihappey-json-render-apps";
import { useNavigate } from "react-router";
import { OverviewPageHeader } from "../../ui/layout/OverviewPageHeader";

function normalizeText(v: unknown) {
  return String(v ?? "").trim().toLowerCase();
}

export const WebAppsPage = () => {
  const { SearchBox, Paragraph } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const apps = useJsonRenderApps();

  const [search, setSearch] = useState("");
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
  );
};

