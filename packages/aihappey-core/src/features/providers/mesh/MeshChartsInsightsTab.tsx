import { useMemo } from "react";
import { ChartJsBlock, useTheme } from "aihappey-components";
import {
  buildProvidersByRegionBarData,
  buildTopProvidersByUniqueModelCountData,
  type MeshModel,
  type ProviderLocationMeta,
} from "./meshData";
import { MeshNoDataCard } from "./MeshNoDataCard";

type Props = {
  models: MeshModel[];
  providerMetadata: Record<string, ProviderLocationMeta>;
  t: (key: string, options?: any) => string;
};

export const MeshChartsInsightsTab = ({
  models,
  providerMetadata,
  t,
}: Props) => {
  const { Card } = useTheme();

  const providersByRegionData = useMemo(
    () => buildProvidersByRegionBarData({ models, providerMetadata }),
    [models, providerMetadata]
  );

  const topProvidersData = useMemo(
    () => buildTopProvidersByUniqueModelCountData({
      models,
      providerMetadata,
      limit: 16,
    }),
    [models, providerMetadata]
  );

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
      {models.length === 0 || !providersByRegionData?.labels?.length ? (
        <MeshNoDataCard
          title={t("ai.mesh.providersByRegion")}
          description={t("ai.mesh.noDataDescription")}
        />
      ) : (
        <Card title={t("ai.mesh.providersByRegion")}>
          <ChartJsBlock
            type={"bar" as any}
            data={providersByRegionData as any}
            options={{
              plugins: {
                legend: { display: false },
              },
              scales: {
                x: {
                  ticks: {
                    autoSkip: false,
                    maxRotation: 35,
                    minRotation: 0,
                  },
                },
                y: {
                  beginAtZero: true,
                  ticks: { precision: 0 },
                },
              },
            }}
            height={320}
          />
        </Card>
      )}

      {models.length === 0 || !topProvidersData?.labels?.length ? (
        <MeshNoDataCard
          title={t("ai.mesh.topProvidersByUniqueModels")}
          description={t("ai.mesh.noDataDescription")}
        />
      ) : (
        <Card title={t("ai.mesh.topProvidersByUniqueModels")}>
          <ChartJsBlock
            type={"bar" as any}
            data={topProvidersData as any}
            options={{
              indexAxis: "y",
              plugins: {
                legend: { display: false },
              },
              scales: {
                x: {
                  beginAtZero: true,
                  ticks: { precision: 0 },
                },
                y: {
                  ticks: { autoSkip: false },
                },
              },
            }}
            height={360}
          />
        </Card>
      )}
    </div>
  );
};

