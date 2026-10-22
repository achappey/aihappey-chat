import { ChartJsBlock, useTheme } from "aihappey-components";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { color } from "chart.js/helpers";

export const formatNumber = (value: number) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value || 0);

export const formatCompact = (value: number) =>
  new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(value || 0);

// Conversation costs do not currently establish a currency. Do not invent one.
export const formatCost = (value: number) =>
  new Intl.NumberFormat(undefined, {
    maximumFractionDigits: value < 1 ? 4 : 2,
  }).format(value || 0);

export const formatMetric = (value: number | undefined, unit = "") => value === undefined ? "—" :
  `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value)}${unit ? ` ${unit}` : ""}`;

export const chartGridColor = (foreground: string) => {
  // The browser can paint modern CSS colors (e.g. oklch) that Chart.js's parser
  // cannot parse. Never call alpha() on an invalid parsed color.
  const parsed = color(foreground);
  return parsed.valid ? parsed.alpha(0.14).rgbString() : "rgba(127, 127, 127, 0.2)";
};

export const palette = [
  "#4f8cff",
  "#22b8cf",
  "#51cf66",
  "#fcc419",
  "#ff922b",
  "#ff6b6b",
  "#cc5de8",
  "#845ef7",
  "#339af0",
  "#20c997",
  "#94d82d",
  "#ffd43b",
];

export const chartOptions = (title?: string) => ({
  plugins: {
    legend: { position: "bottom", labels: { boxWidth: 12, usePointStyle: true } },
    title: title ? { display: true, text: title } : undefined,
    datalabels: { display: false },
  },
  scales: {
    x: { ticks: { maxRotation: 45, minRotation: 0, maxTicksLimit: 8 } },
    y: { beginAtZero: true },
  },
});

export const horizontalBarOptions = (title?: string) => ({
  ...chartOptions(title),
  indexAxis: "y",
  plugins: { ...chartOptions(title).plugins, legend: { display: false } },
  scales: {
    x: { beginAtZero: true, ticks: { maxTicksLimit: 5 } },
    y: {
      ticks: {
        autoSkip: false,
        callback: function (this: any, value: number) {
          const label = String(this.getLabelForValue(value));
          return label.length > 26 ? `${label.slice(0, 25)}…` : label;
        },
      },
    },
  },
});

export const Grid = ({ children, compact = false }: { children: ReactNode; compact?: boolean }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${compact ? 160 : 300}px), 1fr))`,
      alignItems: "start",
      gap: 12,
      width: "100%",
    }}
  >
    {children}
  </div>
);

export const Section = ({ children }: { children: ReactNode }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
    {children}
  </div>
);

export const KpiCard = ({
  title,
  value,
}: {
  title: string;
  value: string;
}) => {
  const { Card } = useTheme();
  return (
    <Card title={title} size="small">
      <div style={{ fontSize: 28, fontWeight: 700, fontVariantNumeric: "tabular-nums", overflowWrap: "anywhere" }}>{value}</div>
    </Card>
  );
};

export const NoDataCard = ({ title, description }: { title: string; description: string }) => {
  const { Card, Text } = useTheme();
  return (
    <Card title={title} size="small">
      <Text as="p" style={{ color: "inherit", margin: 0 }}>{description}</Text>
    </Card>
  );
};

/** Resolve inherited CSS colors inside the actual themed card, including live preset changes. */
const useChartColors = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [colors, setColors] = useState({ foreground: "#666666", background: "#ffffff" });
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const read = () => {
      const foreground = getComputedStyle(element).color;
      let background = "#ffffff";
      for (let parent: HTMLElement | null = element; parent; parent = parent.parentElement) {
        const candidate = getComputedStyle(parent).backgroundColor;
        if (candidate && candidate !== "transparent" && candidate !== "rgba(0, 0, 0, 0)") {
          background = candidate;
          break;
        }
      }
      setColors((previous) => previous.foreground === foreground && previous.background === background ? previous : { foreground, background });
    };
    read();
    const observer = new MutationObserver(read);
    for (let parent: HTMLElement | null = element; parent; parent = parent.parentElement) {
      observer.observe(parent, { attributes: true });
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", read);
    return () => { observer.disconnect(); media.removeEventListener("change", read); };
  }, []);
  return { ref, ...colors };
};

export const ChartCard = ({
  title,
  type,
  data,
  options,
  height = 320,
  noDataDescription,
}: {
  title: string;
  type: any;
  data: any;
  options?: any;
  height?: number;
  noDataDescription: string;
}) => {
  const { Card } = useTheme();
  const { ref, foreground, background } = useChartColors();
  const labels = data?.labels ?? [];
  const hasDatasetData = (data?.datasets ?? []).some((dataset: any) =>
    Array.isArray(dataset?.data) && dataset.data.some((value: any) => value != null &&
      (typeof value === "object" || (Number.isFinite(Number(value)) && (type !== "doughnut" || Number(value) > 0))))
  );
  const defaults = chartOptions();
  const merged = { ...defaults, ...options, plugins: { ...defaults.plugins, ...options?.plugins } };
  const gridColor = chartGridColor(foreground);
  const scales = type === "doughnut" ? undefined : Object.fromEntries(
    Object.entries(merged.scales ?? {}).map(([key, scale]: [string, any]) => [key, {
      ...scale,
      ticks: { ...scale.ticks, color: foreground },
      title: { ...scale.title, color: foreground },
      grid: { ...scale.grid, color: gridColor },
      border: { ...scale.border, color: gridColor },
    }])
  );
  const themedOptions = {
    ...merged,
    color: foreground,
    scales,
    plugins: {
      ...merged.plugins,
      legend: { ...merged.plugins.legend, labels: { ...merged.plugins.legend?.labels, color: foreground } },
      title: { ...merged.plugins.title, color: foreground },
      tooltip: { ...merged.plugins.tooltip, backgroundColor: foreground, titleColor: background, bodyColor: background },
      datalabels: { display: false },
    },
  };

  return (
    <Card title={title} size="small">
      <div ref={ref} style={{ minWidth: 0 }}>
        {!labels.length || !hasDatasetData ? <p style={{ margin: 0 }}>{noDataDescription}</p> : (
          <div role="img" aria-label={title}>
            <ChartJsBlock type={type} data={data} options={themedOptions} height={height} />
          </div>
        )}
      </div>
    </Card>
  );
};

export const tableStyle = {
  width: "100%",
  borderCollapse: "collapse" as const,
  fontSize: 13,
};

export const thStyle = {
  textAlign: "left" as const,
  borderBottom: "1px solid rgba(127,127,127,0.25)",
  padding: "8px 6px",
};

export const tdStyle = {
  borderBottom: "1px solid rgba(127,127,127,0.15)",
  padding: "8px 6px",
  verticalAlign: "top" as const,
};

