import { useEffect, useState, type CSSProperties } from "react";
import { useTheme } from "aihappey-components";
import type { IconToken } from "aihappey-types";
import { MeshChartsGeoTab } from "./MeshChartsGeoTab";
import { MeshChartsInsightsTab } from "./MeshChartsInsightsTab";
import { MeshChartsModelsTab } from "./MeshChartsModelsTab";
import { MeshChartsOverviewTab } from "./MeshChartsOverviewTab";
import type { MeshModel, ProviderLocationMeta } from "./meshData";

type Props = {
  models: MeshModel[];
  providerMetadata: Record<string, ProviderLocationMeta>;
  filterSignature: string;
  t: (key: string, options?: any) => string;
};

const srOnly: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

const iconTabs: Array<{ key: string; icon: IconToken; titleKey: string }> = [
  { key: "overview", icon: "chart", titleKey: "ai.mesh.tabOverview" },
  { key: "models", icon: "brain", titleKey: "ai.mesh.tabModels" },
  { key: "geo", icon: "globe", titleKey: "ai.mesh.tabGeo" },
  { key: "insights", icon: "trending", titleKey: "ai.mesh.tabInsights" },
];

export const MeshAnalysisTabs = ({
  models,
  providerMetadata,
  filterSignature,
  t,
}: Props) => {
  const { Tabs, Tab } = useTheme();
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<string>(iconTabs[0].key);

  useEffect(() => {
    if (!iconTabs.some((tab) => tab.key === activeAnalysisTab)) {
      setActiveAnalysisTab(iconTabs[0].key);
    }
  }, [activeAnalysisTab]);

  return (
    <Tabs
      activeKey={activeAnalysisTab}
      vertical
      onSelect={(k: string) => setActiveAnalysisTab(k)}
      style={{ width: "100%", minHeight: 420 }}
    >
      <Tab
        eventKey={iconTabs[0].key}
        icon={iconTabs[0].icon as any}
        title={<span style={srOnly}>{t(iconTabs[0].titleKey)}</span>}
      >
        <MeshChartsOverviewTab
          models={models}
          providerMetadata={providerMetadata}
          filterSignature={filterSignature}
          t={t}
        />
      </Tab>

      <Tab
        eventKey={iconTabs[1].key}
        icon={iconTabs[1].icon as any}
        title={<span style={srOnly}>{t(iconTabs[1].titleKey)}</span>}
      >
        <MeshChartsModelsTab models={models} t={t} />
      </Tab>

      <Tab
        eventKey={iconTabs[2].key}
        icon={iconTabs[2].icon as any}
        title={<span style={srOnly}>{t(iconTabs[2].titleKey)}</span>}
      >
        <MeshChartsGeoTab
          models={models}
          providerMetadata={providerMetadata}
          t={t}
        />
      </Tab>

      <Tab
        eventKey={iconTabs[3].key}
        icon={iconTabs[3].icon as any}
        title={<span style={srOnly}>{t(iconTabs[3].titleKey)}</span>}
      >
        <MeshChartsInsightsTab
          models={models}
          providerMetadata={providerMetadata}
          t={t}
        />
      </Tab>
    </Tabs>
  );
};

