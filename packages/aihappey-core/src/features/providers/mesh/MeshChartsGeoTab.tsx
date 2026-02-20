import { useMemo } from "react";
import { useTheme } from "aihappey-components";
import WorldMap from "../WorldMap";
import {
  buildCountryProviderCounts,
  buildRegionProviderCounts,
  type MeshModel,
  type ProviderLocationMeta,
} from "./meshData";
import { InferenceRegionMap } from "./InferenceRegionMap";
import { MeshNoDataCard } from "./MeshNoDataCard";

type Props = {
  models: MeshModel[];
  providerMetadata: Record<string, ProviderLocationMeta>;
  t: (key: string, options?: any) => string;
};

export const MeshChartsGeoTab = ({ models, providerMetadata, t }: Props) => {
  const { Card } = useTheme();

  const countryProviderCounts = useMemo(
    () => buildCountryProviderCounts({ models, providerMetadata }),
    [models, providerMetadata]
  );

  const regionProviderCounts = useMemo(
    () => buildRegionProviderCounts({ models, providerMetadata }),
    [models, providerMetadata]
  );

  const hasCountryData = Object.keys(countryProviderCounts).length > 0;
  const hasRegionData = Object.keys(regionProviderCounts).length > 0;

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
      {models.length === 0 || !hasCountryData ? (
        <MeshNoDataCard
          title={t("ai.mesh.countryCoverage")}
          description={t("ai.mesh.noDataDescription")}
        />
      ) : (
        <Card title={t("ai.mesh.countryCoverage")}>
          <WorldMap countryProviderCounts={countryProviderCounts} />
        </Card>
      )}

      {models.length === 0 || !hasRegionData ? (
        <MeshNoDataCard
          title={t("ai.mesh.regionCoverage")}
          description={t("ai.mesh.noDataDescription")}
        />
      ) : (
        <Card title={t("ai.mesh.regionCoverage")}>
          <InferenceRegionMap regionProviderCounts={regionProviderCounts} t={t} />
        </Card>
      )}
    </div>
  );
};

