import { useMemo } from "react";
import { ChartJsBlock, useTheme } from "aihappey-components";
import {
  buildProviderModelGraphData,
  buildStackedByProviderTypeData,
  type MeshModel,
  type ProviderLocationMeta,
} from "./meshData";
import { MeshNoDataCard } from "./MeshNoDataCard";

type Props = {
  models: MeshModel[];
  providerMetadata: Record<string, ProviderLocationMeta>;
  filterSignature: string;
  t: (key: string, options?: any) => string;
};

export const MeshChartsOverviewTab = ({
  models,
  providerMetadata,
  filterSignature,
  t,
}: Props) => {
  const { Card } = useTheme();

  const graphData = useMemo(
    () => buildProviderModelGraphData({ models, providerMetadata, t }),
    [models, providerMetadata, t]
  );

  const graphRenderKey = useMemo(() => {
    const dataset = graphData?.datasets?.[0] as any;
    const nodes = dataset?.data?.length ?? 0;
    const edges = dataset?.edges?.length ?? 0;
    return `${filterSignature}|overview|${nodes}|${edges}`;
  }, [graphData, filterSignature]);

  const stackedBarData = useMemo(
    () => buildStackedByProviderTypeData({ models, providerMetadata, t }),
    [models, providerMetadata, t]
  );

  const dataset = graphData?.datasets?.[0] as any;
  const providerNodes = dataset?.data?.filter((d: any) => d.group === "provider")?.length ?? 0;
  const modelNodes = dataset?.data?.filter((d: any) => d.group === "model")?.length ?? 0;
  const linkCount = dataset?.edges?.length ?? 0;

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        paddingTop: 8,
        marginBottom: 24,
      }}
    >
      {models.length === 0 ? (
        <MeshNoDataCard
          title={t("ai.mesh.network")}
          description={t("ai.mesh.noDataDescription")}
        />
      ) : (
        <Card
          title={t("ai.mesh.networkSummary", {
            providers: providerNodes,
            models: modelNodes,
            links: linkCount,
          })}
        >
          <ChartJsBlock
            key={graphRenderKey}
            type={"forceDirectedGraph" as any}
            data={graphData as any}
            options={{
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (ctx: any) => ctx?.raw?.label ?? "",
                  },
                },
              },
              scales: {
                x: { display: false },
                y: { display: false },
              },
            }}
            height={420}
          />
        </Card>
      )}

      {models.length === 0 || !stackedBarData?.labels?.length ? (
        <MeshNoDataCard
          title={t("ai.mesh.stackedByProvider")}
          description={t("ai.mesh.noDataDescription")}
        />
      ) : (
        <Card title={t("ai.mesh.stackedByProvider")}>
          <ChartJsBlock
            type={"bar" as any}
            data={stackedBarData as any}
            options={{
              plugins: {
                legend: {
                  display: true,
                  position: "bottom",
                },
              },
              scales: {
                x: {
                  stacked: true,
                  ticks: {
                    autoSkip: true,
                    maxRotation: 45,
                    minRotation: 0,
                  },
                },
                y: {
                  stacked: true,
                  beginAtZero: true,
                  ticks: { precision: 0 },
                },
              },
            }}
            height={340}
          />
        </Card>
      )}
    </div>
  );
};

