import React, { useEffect, useState } from "react";
import { useTranslation } from "aihappey-i18n";
import { SettingsActionButtons } from "../buttons";
import { OpenAIRealtimeConversationConfigForm } from "../forms";
import { useTheme } from "../theme/ThemeContext";

const getDefaultProviderTab = (enabledProviders?: string[]): string => {
  const firstProvider = enabledProviders?.[0];
  return typeof firstProvider === "string" ? firstProvider.toLocaleLowerCase() : "openai";
};

export interface RealtimeSettingsModalProps {
  open: boolean;
  providerMetadata: Record<string, any>;
  setProviderMetadata: (meta: Record<string, any>) => void;
  enabledProviders?: string[];
  resetDefaults?: () => void;
  onClose: () => void;
}

export const RealtimeSettingsModal: React.FC<RealtimeSettingsModalProps> = ({
  open,
  providerMetadata,
  setProviderMetadata,
  enabledProviders = ["OpenAI"],
  resetDefaults,
  onClose,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const normalizedEnabledProviders = enabledProviders.length ? enabledProviders : ["OpenAI"];
  const defaultTab = getDefaultProviderTab(normalizedEnabledProviders);
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    setActiveTab(getDefaultProviderTab(normalizedEnabledProviders));
  }, [normalizedEnabledProviders.join("|")]);

  const close = () => {
    onClose();
    setTimeout(() => setActiveTab(defaultTab), 200);
  };

  return (
    <theme.Modal
      show={open}
      onHide={close}
      title={t("realtime")}
      actions={(
        <SettingsActionButtons
          onClose={close}
          onRestoreDefaults={resetDefaults}
        />
      )}
    >
      <theme.Tabs activeKey={activeTab} onSelect={setActiveTab}>
        {normalizedEnabledProviders.includes("OpenAI") && (
          <theme.Tab eventKey="openai" title="OpenAI">
            <OpenAIRealtimeConversationConfigForm
              config={providerMetadata.openai ?? {}}
              updateConfig={(openai) => setProviderMetadata({
                ...providerMetadata,
                openai,
              })}
            />
          </theme.Tab>
        )}
      </theme.Tabs>
    </theme.Modal>
  );
};

