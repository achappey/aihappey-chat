import { useState } from "react";
import { useTheme } from "aihappey-components";
import { ModelContextCatalogSettings } from "./ModelContextCatalogSettings";
import { ModelContextClientSettings } from "./ModelContextClientSettings";
import { ModelContextExtensionsSettings } from "./ModelContextExtensionsSettings";
import { useTranslation } from "react-i18next";

export const ModelContextSettings = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState("client");
  const { t } = useTranslation();

  const formStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    padding: "12px 0 0 0",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
        padding: "0 32px 32px 32px",
      }}
    >
      <theme.Tabs activeKey={activeTab} onSelect={setActiveTab}>
        <theme.Tab eventKey="client" title={t('manageServersModal.client')}>
          <div style={formStyle}>
            <ModelContextClientSettings />
          </div>
        </theme.Tab>

        <theme.Tab eventKey="catalog" title={t('manageServersModal.catalog')}>
          <div style={formStyle}>
            <ModelContextCatalogSettings />
          </div>
        </theme.Tab>

        <theme.Tab eventKey="extensions" title={t('manageServersModal.extensions')}>
          <div style={formStyle}>
            <ModelContextExtensionsSettings />
          </div>
        </theme.Tab>
      </theme.Tabs>
    </div>
  );
};
