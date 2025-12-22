import { useState } from "react";
import { useTheme } from "aihappey-components";
import { ModelContextCatalogSettings } from "./ModelContextCatalogSettings";
import { ModelContextClientSettings } from "./ModelContextClientSettings";
import { ModelContextExtensionsSettings } from "./ModelContextExtensionsSettings";
import { useTranslation } from "react-i18next";

export const ModelContextSettings = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState("client");
const {t} = useTranslation();
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
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 32,
              padding: "24px 0 0 0",
            }}
          >
            <ModelContextClientSettings />
          </div>
        </theme.Tab>

        <theme.Tab eventKey="catalog"  title={t('manageServersModal.catalog')}>
          <ModelContextCatalogSettings />
        </theme.Tab>

        <theme.Tab eventKey="extensions"  title={t('manageServersModal.extensions')}>
          <ModelContextExtensionsSettings />
        </theme.Tab>
      </theme.Tabs>
    </div>
  );
};
