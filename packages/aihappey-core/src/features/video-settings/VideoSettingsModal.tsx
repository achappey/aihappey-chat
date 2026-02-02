import React, { useState } from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme, SettingsActionButtons } from "aihappey-components";
import { VideoSettingsGeneralTab } from "./VideoSettingsGeneralTab";

export interface VideoSettingsModalProps {
  open: boolean;
  providerMetadata: any;
  resetDefaults?: any;
  setProviderMetadata: (meta: any) => void;
  onEditProviderKeys?: () => void;
  onClose: () => void;
}

export const VideoSettingsModal: React.FC<VideoSettingsModalProps> = ({
  open,
  providerMetadata,
  resetDefaults,
  setProviderMetadata,
  onEditProviderKeys,
  onClose,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const defaultTab = "general";
  const [activeTab, setActiveTab] = useState(defaultTab);

  const close = () => {
    onClose();
    setTimeout(() => {
      setActiveTab(defaultTab);
    }, 200);
  };

  return (
    <theme.Modal
      show={open}
      onHide={close}
      title={t("videoSettings.title")}
      actions={
        <SettingsActionButtons onClose={close} onRestoreDefaults={resetDefaults} />
      }
    >
      <theme.Tabs activeKey={activeTab} onSelect={setActiveTab}>
        <theme.Tab eventKey="general" title={t("general")}>
          <VideoSettingsGeneralTab onEditProviderKeys={onEditProviderKeys} />
        </theme.Tab>
      </theme.Tabs>
    </theme.Modal>
  );
};
