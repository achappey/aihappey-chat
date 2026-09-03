import { ChartJsBlock } from "aihappey-components";
import { useStorageUsage } from "./useStorageUsage";
import { useTranslation } from "aihappey-i18n";
import { formatBytes } from "./storageSize";

const COLORS = [
  "#7c3aed", "#2563eb", "#0891b2", "#059669", "#65a30d", "#ca8a04", "#ea580c",
  "#dc2626", "#db2777", "#9333ea", "#4f46e5", "#0d9488", "#84cc16", "#d97706",
];

export const StorageSettings = () => {
  const { storage, loading } = useStorageUsage();
  const { t, i18n } = useTranslation();
  const categories = storage?.categories.filter((category) => category.bytes > 0) ?? [];
  const locale = i18n.language;

  if (loading && !storage) {
    return <div role="status" style={{ padding: 24, textAlign: "center", opacity: 0.75 }}>{t("storage.calculating")}</div>;
  }

  if (!storage) {
    return <div style={{ padding: 24 }}>{t("storage.unavailable")}.</div>;
  }

  const chart = {
    type: "doughnut",
    data: {
      labels: categories.map(({ id }) => t(`settingsModal.exportItems.${id}`) ?? id),
      datasets: [{
        data: categories.map(({ bytes }) => bytes),
        backgroundColor: categories.map((_, index) => COLORS[index % COLORS.length]),
        borderColor: "transparent",
        borderWidth: 0,
        hoverOffset: 5,
      }],
    },
    options: {
      layout: { padding: 7 },
      plugins: {
        legend: { display: false },
        // The global data-labels plugin otherwise draws raw byte counts over
        // narrow slices. Values remain available in the legend and tooltip.
        datalabels: { display: false },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const percentage = storage.total ? (Number(context.raw) / storage.total) * 100 : 0;
              return `${context.label}: ${formatBytes(Number(context.raw), locale)} (${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(percentage)}%)`;
            },
          },
        },
      },
      cutout: "72%",
    },
  };

  return (
    <section style={{ padding: "8px 4px 4px", maxWidth: 680, margin: "0 auto" }} aria-labelledby="storage-breakdown-title">
      <div style={{ marginBottom: 12 }}>
        <h3 id="storage-breakdown-title" style={{ fontSize: 17, margin: "0 0 4px" }}>{t("storage.breakdownTitle")}</h3>
        <p style={{ fontSize: 13, lineHeight: 1.45, margin: 0, opacity: 0.72 }}>{t("storage.breakdownDescription")}</p>
      </div>

      {categories.length ? (
        <>
          <div style={{ position: "relative", maxWidth: 360, margin: "0 auto" }}>
            <ChartJsBlock type={chart.type} data={chart.data} options={chart.options} height={260} />
            <div
              aria-hidden="true"
              style={{
                position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                justifyContent: "center", alignItems: "center", pointerEvents: "none",
              }}
            >
              <span style={{ fontSize: 12, opacity: 0.68 }}>{t("storage.estimatedTotal")}</span>
              <strong style={{ fontSize: 22, lineHeight: 1.25 }}>{formatBytes(storage.total, locale)}</strong>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "6px 20px", marginTop: 10 }}>
            {categories.map((category, index) => (
              <div key={category.id} style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, fontSize: 13 }}>
                <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 3, flex: "0 0 auto", background: COLORS[index % COLORS.length] }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t(`settingsModal.exportItems.${category.id}`) ?? category.id}</span>
                <strong style={{ marginLeft: "auto", whiteSpace: "nowrap" }}>{formatBytes(category.bytes, locale)}</strong>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ padding: "36px 12px", textAlign: "center", opacity: 0.72 }}>{t("storage.empty")}</div>
      )}

      {!!storage.failedCategories.length && (
        <p role="status" style={{ fontSize: 12, margin: "14px 0 0", opacity: 0.68 }}>{t("storage.partial")}</p>
      )}
    </section>
  );
};
