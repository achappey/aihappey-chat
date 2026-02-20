import { useMemo } from "react";
import { ChartJsBlock, useTheme } from "aihappey-components";
import {
  buildModelTypeDistributionData,
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

  const typeDistributionData = useMemo(
    () => buildModelTypeDistributionData({ models, t }),
    [models, t]
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

      {models.length === 0 || !typeDistributionData?.labels?.length ? (
        <MeshNoDataCard
          title={t("ai.mesh.typeDistribution")}
          description={t("ai.mesh.noDataDescription")}
        />
      ) : (
        <Card title={t("ai.mesh.typeDistribution")}>
          <ChartJsBlock
            type={"bar" as any}
            data={typeDistributionData as any}
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
                  ticks: {
                    autoSkip: false,
                  },
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

