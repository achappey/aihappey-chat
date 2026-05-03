import { ChartJsBlock, useTheme } from "aihappey-components";
import type { ReactNode } from "react";

export const srOnly = {
  position: "absolute" as const,
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap" as const,
  border: 0,
};

export const formatNumber = (value: number) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value || 0);

export const formatCompact = (value: number) =>
  new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(value || 0);

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value < 1 ? 4 : 2,
  }).format(value || 0);

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
    legend: { position: "bottom" },
    title: title ? { display: true, text: title } : undefined,
  },
  scales: {
    x: { ticks: { maxRotation: 45, minRotation: 0 } },
    y: { beginAtZero: true },
  },
});

export const horizontalBarOptions = (title?: string) => ({
  ...chartOptions(title),
  indexAxis: "y",
});

export const Grid = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
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
  description,
}: {
  title: string;
  value: string;
  description?: string;
}) => {
  const { Card, Text } = useTheme();
  return (
    <Card title={title} size="small">
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
        {description ? <Text as="span" style={{ color: "#777" }}>{description}</Text> : null}
      </div>
    </Card>
  );
};

export const NoDataCard = ({ title, description }: { title: string; description: string }) => {
  const { Card, Text } = useTheme();
  return (
    <Card title={title} size="small">
      <Text as="p" style={{ color: "#777", margin: 0 }}>{description}</Text>
    </Card>
  );
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
  const labels = data?.labels ?? [];
  const hasDatasetData = (data?.datasets ?? []).some((dataset: any) =>
    Array.isArray(dataset?.data) && dataset.data.some((value: any) => Number(value) !== 0 || typeof value === "object")
  );

  if (!labels.length || !hasDatasetData) {
    return <NoDataCard title={title} description={noDataDescription} />;
  }

  return (
    <Card title={title} size="small">
      <ChartJsBlock type={type} data={data} options={options} height={height} />
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

