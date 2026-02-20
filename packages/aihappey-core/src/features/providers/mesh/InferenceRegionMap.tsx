import { useMemo } from "react";

type Props = {
  regionProviderCounts: Record<string, number>;
  t: (key: string, options?: any) => string;
};

const REGION_BOXES: Array<{
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
  labelKey: string;
}> = [
  { key: "Americas", x: 8, y: 12, width: 32, height: 40, labelKey: "regional:regions.Americas" },
  { key: "Europe", x: 44, y: 10, width: 18, height: 18, labelKey: "regional:regions.Europe" },
  { key: "Africa", x: 45, y: 31, width: 20, height: 24, labelKey: "regional:regions.Africa" },
  { key: "Asia", x: 64, y: 12, width: 28, height: 32, labelKey: "regional:regions.Asia" },
  { key: "Oceania", x: 86, y: 42, width: 12, height: 14, labelKey: "regional:regions.Oceania" },
];

const INACTIVE_FILL = "#E5E7EB";

const getRegionFill = (providerCount: number, maxProviderCount: number) => {
  if (providerCount <= 0) return INACTIVE_FILL;
  const normalized =
    maxProviderCount <= 1
      ? 0.45
      : (providerCount - 1) / (maxProviderCount - 1);
  const ratio = Math.max(0, Math.min(1, normalized));
  const lightness = 76 - ratio * 36;
  return `hsl(153 70% ${lightness}%)`;
};

export const InferenceRegionMap = ({ regionProviderCounts, t }: Props) => {
  const maxProviders = useMemo(() => {
    const values = Object.values(regionProviderCounts);
    return values.length ? Math.max(...values) : 0;
  }, [regionProviderCounts]);

  const lowActiveFill = getRegionFill(1, Math.max(maxProviders, 2));
  const highActiveFill = getRegionFill(Math.max(maxProviders, 1), Math.max(maxProviders, 1));

  const worldCount = regionProviderCounts.World ?? 0;

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
      <svg
        viewBox="0 0 100 62"
        style={{ width: "100%", height: "auto", display: "block", borderRadius: 8 }}
        role="img"
        aria-label={t("ai.mesh.regionCoverageMap")}
      >
        <rect x={0} y={0} width={100} height={62} fill="#0F172A" rx={4} />

        {REGION_BOXES.map((region) => {
          const value = regionProviderCounts[region.key] ?? 0;
          const fill = getRegionFill(value, maxProviders);
          return (
            <g key={region.key}>
              <rect
                x={region.x}
                y={region.y}
                width={region.width}
                height={region.height}
                fill={fill}
                stroke="#CBD5E1"
                strokeWidth={0.5}
                rx={2}
              >
                <title>{`${t(region.labelKey)} · ${value}`}</title>
              </rect>
            </g>
          );
        })}
      </svg>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          fontSize: 12,
          color: "#6B7280",
        }}
      >
        <span>
          {t("ai.mesh.worldProviders", { count: worldCount })}
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 16,
              height: 10,
              borderRadius: 4,
              background: INACTIVE_FILL,
              border: "1px solid #D1D5DB",
            }}
          />
          <span>0</span>

          <div
            style={{
              width: 120,
              height: 10,
              borderRadius: 999,
              background: `linear-gradient(90deg, ${lowActiveFill} 0%, ${highActiveFill} 100%)`,
            }}
          />
          <span>{maxProviders}</span>
        </div>
      </div>
    </div>
  );
};

