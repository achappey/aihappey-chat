import React, { useState } from "react";
import { useTheme } from "aihappey-components";
import { useAppStore } from "aihappey-state";
import { useTranslation } from "aihappey-i18n";
import { ModelContextSettings } from "./ModelContextSettings";
import { GeneralSettings } from "./GeneralSettings";

export interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onClose,
}) => {
  const theme = useTheme();
  const { Modal, Switch } = theme;
  const { t } = useTranslation(); // Uncomment when i18n is ready
  const [activeTab, setActiveTab] = useState("general");
  const remoteStorageConnected = useAppStore((s) => s.remoteStorageConnected);
  const enableUserLocation = useAppStore((s) => s.enableUserLocation);
  const setEnableUserLocation = useAppStore((s) => s.setEnableUserLocation);
  const extractExif = useAppStore((s) => s.extractExif);
  const setRemoteStorageConnected = useAppStore(
    (s) => s.setRemoteStorageConnected
  );
  const setExtractExif = useAppStore(
    (s) => s.setExtractExif
  );

  return (
    <Modal show={open}
      onHide={onClose}
      title={t("settingsModal.title")}>
      <div
        style={{
          borderRadius: 12,
          padding: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "24px 0 0 0",
          }}
        >
          <theme.Tabs
            activeKey={activeTab}
            vertical={true}
            style={{ minHeight: 260 }}
            onSelect={setActiveTab}
          >
            <theme.Tab
              eventKey="general"
              icon={"settings"}
              title={t("settingsModal.tabGeneral")}
            >
              <GeneralSettings />
            </theme.Tab>

            <theme.Tab
              eventKey="mcp"
              icon={"mcpServer"}
              title={t("mcpPage.title")}
            >
              <ModelContextSettings />
            </theme.Tab>
            <theme.Tab
              eventKey="connectors"
              icon={"connector"}
              title={t("settingsModal.tabConnectors")}
            >
              <div>
                <Switch
                  id="location-toggle"
                  checked={enableUserLocation}
                  label={t("settingsModal.userLocation")}
                  onChange={setEnableUserLocation}
                />

                <Switch
                  id="remote-storage-toggle"
                  checked={remoteStorageConnected}
                  label={t("settingsModal.remoteStorage")}
                  onChange={() =>
                    setRemoteStorageConnected(!remoteStorageConnected)
                  }
                />
              </div>
            </theme.Tab>
            <theme.Tab
              eventKey="attachments"
              icon={"attachment"}
              title={t("attachments")}>
              <div>
                <h4>{t("images")}</h4>
                <Switch
                  id="setExtractExif-toggle"
                  checked={extractExif}
                  label={t("settingsModal.extractExif")}
                  onChange={() =>
                    setExtractExif(!extractExif)
                  }
                />
              </div>
            </theme.Tab>
          </theme.Tabs>
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;
