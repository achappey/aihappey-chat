import { useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "aihappey-components";
import type { JsonRenderAppDataSource } from "aihappey-json-render-apps";
import { WebAppDetailChatTab } from "./WebAppDetailChatTab";
import { WebAppDetailStructureTab } from "./WebAppDetailStructureTab";
import { WebAppDetailDataTab } from "./WebAppDetailDataTab";
import { WebAppDetailDataSourceTab } from "./WebAppDetailDataSourceTab";

type WebAppDetailDrawerTabsProps = {
  app?: {
    data?: any;
    dataSource?: JsonRenderAppDataSource | null;
  } | null;
  effectiveTree?: any;
  dataSourceValue: JsonRenderAppDataSource | null;
  canRefresh: boolean;
  refreshing: boolean;
  dataRefreshError?: string;
  dataSourceError?: string;
  connectedServerKeys: string[];
  resourceOptions: any[];
  resourceTemplateOptions: any[];
  toolOptions: any[];
  structuredOutputOptions: any[];
  modelOptions: any[];
  onRefreshData: () => void;
  onDataSourceChange: (next: JsonRenderAppDataSource | null) => void;
  chatContent: ReactNode;
  chatOpen: boolean;
  initialTab?: string;
};

export const WebAppDetailDrawerTabs = ({
  app,
  effectiveTree,
  dataSourceValue,
  canRefresh,
  refreshing,
  dataRefreshError,
  dataSourceError,
  connectedServerKeys,
  resourceOptions,
  resourceTemplateOptions,
  toolOptions,
  structuredOutputOptions,
  modelOptions,
  onRefreshData,
  onDataSourceChange,
  chatContent,
  chatOpen,
  initialTab = "chat",
}: WebAppDetailDrawerTabsProps) => {
  const { t } = useTranslation();
  const { Tabs, Tab } = useTheme();
  const [activeTab, setActiveTab] = useState(initialTab);

  if (!chatOpen) {
    return null;
  }

  return (
    <Tabs
      activeKey={activeTab}
      onSelect={(k: string) => setActiveTab(k)}
      fill
      style={{
        display: "grid",
        gridTemplateRows: "auto 1fr",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <Tab eventKey="chat" title={t("chat")}>
        <div style={{ height: "100%", minHeight: 0, overflow: "hidden" }}>
          <WebAppDetailChatTab>{chatContent}</WebAppDetailChatTab>
        </div>
      </Tab>
      <Tab eventKey="structure" title={t("structure")}>
        <div style={{ height: "100%", minHeight: 0, overflow: "auto" }}>
          <WebAppDetailStructureTab effectiveTree={effectiveTree} />
        </div>
      </Tab>
      <Tab eventKey="data" title={t("data")}>
        <div style={{ height: "100%", minHeight: 0, overflow: "auto" }}>
          <WebAppDetailDataTab
            app={app}
            canRefresh={canRefresh}
            refreshing={refreshing}
            dataRefreshError={dataRefreshError}
            onRefreshData={onRefreshData}
          />
        </div>
      </Tab>
      <Tab eventKey="dataSource" title={t("dataSource.title")}
      >
        <div style={{ height: "100%", minHeight: 0, overflow: "auto" }}>
          <WebAppDetailDataSourceTab
            dataSourceValue={dataSourceValue}
            dataSourceError={dataSourceError}
            connectedServerKeys={connectedServerKeys}
            resourceOptions={resourceOptions}
            resourceTemplateOptions={resourceTemplateOptions}
            toolOptions={toolOptions}
            structuredOutputOptions={structuredOutputOptions}
            modelOptions={modelOptions}
            onDataSourceChange={onDataSourceChange}
          />
        </div>
      </Tab>
    </Tabs>
  );
};
