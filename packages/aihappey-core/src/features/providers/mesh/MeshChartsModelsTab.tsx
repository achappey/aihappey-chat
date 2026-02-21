import { useMemo } from "react";
import { ChartJsBlock, useTheme } from "aihappey-components";
import {
  buildProviderCoverageHistogramData,
  buildProvidersPerModelBarData,
  type MeshModel,
} from "./meshData";
import { MeshNoDataCard } from "./MeshNoDataCard";

type Props = {
  models: MeshModel[];
  t: (key: string, options?: any) => string;
};

export const MeshChartsModelsTab = ({ models, t }: Props) => {
  const { Card } = useTheme();

  const providersPerModelBarData = useMemo(
    () => buildProvidersPerModelBarData(models, 20),
    [models]
  );

  const providerCoverageHistogramData = useMemo(
    () => buildProviderCoverageHistogramData({ models }),
    [models]
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
      {models.length === 0 || !providersPerModelBarData?.labels?.length ? (
        <MeshNoDataCard
          title={t("ai.mesh.providersPerModel")}
          description={t("ai.mesh.noDataDescription")}
        />
      ) : (
        <Card title={t("ai.mesh.providersPerModel")}>
          <ChartJsBlock
            type={"bar" as any}
            data={providersPerModelBarData as any}
            options={{
              plugins: {
                legend: { display: false },
              },
              scales: {
                x: {
                  ticks: {
                    autoSkip: true,
                    maxRotation: 55,
                    minRotation: 0,
                  },
                },
                y: {
                  beginAtZero: true,
                  ticks: { precision: 0 },
                },
              },
            }}
            height={340}
          />
        </Card>
      )}

      {models.length === 0 || !providerCoverageHistogramData?.labels?.length ? (
        <MeshNoDataCard
          title={t("ai.mesh.providerCoverageDistribution")}
          description={t("ai.mesh.noDataDescription")}
        />
      ) : (
        <Card title={t("ai.mesh.providerCoverageDistribution")}>
          <ChartJsBlock
            type={"bar" as any}
            data={providerCoverageHistogramData as any}
            options={{
              plugins: {
                legend: { display: false },
              },
              scales: {
                x: {
                  title: {
                    display: true,
                    text: t("ai.mesh.providersPerNormalizedModel"),
                  },
                  ticks: {
                    autoSkip: false,
                  },
                },
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: t("ai.mesh.normalizedModelsInBucket"),
                  },
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

