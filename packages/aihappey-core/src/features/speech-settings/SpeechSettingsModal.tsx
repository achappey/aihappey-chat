import React, { useState } from "react";
import { useTranslation } from "aihappey-i18n";
import { SettingsActionButtons, useTheme } from "aihappey-components";
import { SpeechSettingsGeneralTab } from "./SpeechSettingsGeneralTab";
import { useAppStore } from "aihappey-state";
import {
  OpenAISpeechConfigForm,
  GroqSpeechConfigForm,
  NovitaSpeechConfigForm,
  type OpenAISpeechConfig,
  type GroqSpeechConfig,
  type NovitaSpeechConfig,
} from "aihappey-components";

export interface SpeechSettingsModalProps {
  open: boolean;
  providerMetadata: any;
  setProviderMetadata: (meta: any) => void;
  selectedModel: string;
  resetDefaults?: () => void;
  onEditProviderKeys?: () => void;
  onClose: () => void;
}

export const SpeechSettingsModal: React.FC<SpeechSettingsModalProps> = ({
  open,
  providerMetadata,
  setProviderMetadata,
  selectedModel,
  resetDefaults,
  onEditProviderKeys,
  onClose,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const defaultTab = "general";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const enabledProviders = useAppStore((a) => a.enabledProviders);

  const close = () => {
    onClose();
    setTimeout(() => setActiveTab(defaultTab), 200);
  };

  return (
    <theme.Modal
      show={open}
      onHide={close}
      title={t("speechSettings.title")}
      actions={
        <SettingsActionButtons onClose={close} onRestoreDefaults={resetDefaults} />
      }
    >
      <theme.Tabs activeKey={activeTab} onSelect={setActiveTab}>
        <theme.Tab eventKey="general" title={t("general")}> 
          <SpeechSettingsGeneralTab onEditProviderKeys={onEditProviderKeys} />
        </theme.Tab>

        {enabledProviders.includes("OpenAI") && (
          <theme.Tab eventKey="openai" title="OpenAI">
            <OpenAISpeechConfigForm
              config={providerMetadata.openai ?? {}}
              updateConfig={(openai: OpenAISpeechConfig) =>
                setProviderMetadata({ ...providerMetadata, openai })
              }
            />
          </theme.Tab>
        )}

        {enabledProviders.includes("Groq") && (
          <theme.Tab eventKey="groq" title="Groq">
            <GroqSpeechConfigForm
              config={providerMetadata.groq ?? {}}
              updateConfig={(groq: GroqSpeechConfig) =>
                setProviderMetadata({ ...providerMetadata, groq })
              }
            />
          </theme.Tab>
        )}

        {enabledProviders.includes("Novita") && (
          <theme.Tab eventKey="novita" title="Novita">
            <NovitaSpeechConfigForm
              config={providerMetadata.novita ?? {}}
              updateConfig={(novita: NovitaSpeechConfig) =>
                setProviderMetadata({ ...providerMetadata, novita })
              }
            />
          </theme.Tab>
        )}
      </theme.Tabs>
    </theme.Modal>
  );
};

