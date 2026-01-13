import React, { useState } from "react";
import { useTranslation } from "aihappey-i18n";
import { SettingsActionButtons, useTheme } from "aihappey-components";
import { SpeechSettingsGeneralTab } from "./SpeechSettingsGeneralTab";
import { useAppStore } from "aihappey-state";
import {
  DeepgramSpeechConfigForm,
  OpenAISpeechConfigForm,
  GroqSpeechConfigForm,
  NovitaSpeechConfigForm,
  ElevenLabsSpeechConfigForm,
  GoogleSpeechConfigForm,
  StabilityAISpeechConfigForm,
  AsyncAISpeechConfigForm,
  TogetherSpeechConfigForm,
  MiniMaxSpeechConfigForm,
  type ElevenLabsSpeechConfig,
  type DeepgramSpeechConfig,
  type OpenAISpeechConfig,
  type GroqSpeechConfig,
  type NovitaSpeechConfig,
  type GoogleSpeechConfig,
  type StabilityAISpeechConfig,
  type AsyncAISpeechConfig,
  type MiniMaxSpeechConfig,
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


        {enabledProviders.includes("AsyncAI") && (
          <theme.Tab eventKey="asyncai" title="AsyncAI">
            <AsyncAISpeechConfigForm
              config={providerMetadata.asyncai ?? {}}
              updateConfig={(asyncai: AsyncAISpeechConfig) =>
                setProviderMetadata({ ...providerMetadata, asyncai })
              }
            />
          </theme.Tab>
        )}

        {enabledProviders.includes("Deepgram") && (
          <theme.Tab eventKey="deepgram" title="Deepgram">
            <DeepgramSpeechConfigForm
              config={providerMetadata.deepgram ?? {}}
              updateConfig={(deepgram: DeepgramSpeechConfig) =>
                setProviderMetadata({ ...providerMetadata, deepgram })
              }
            />
          </theme.Tab>
        )}

        {enabledProviders.includes("ElevenLabs") && (
          <theme.Tab eventKey="elevenlabs" title="ElevenLabs">
            <ElevenLabsSpeechConfigForm
              config={providerMetadata.elevenlabs ?? {}}
              updateConfig={(elevenlabs: ElevenLabsSpeechConfig) =>
                setProviderMetadata({ ...providerMetadata, elevenlabs })
              }
            />
          </theme.Tab>
        )}

        {enabledProviders.includes("Google") && (
          <theme.Tab eventKey="google" title="Google">
            <GoogleSpeechConfigForm
              config={providerMetadata.google ?? {}}
              updateConfig={(google: GoogleSpeechConfig) =>
                setProviderMetadata({ ...providerMetadata, google })
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

        {enabledProviders.includes("MiniMax") && (
          <theme.Tab eventKey="minimax" title="MiniMax">
            <MiniMaxSpeechConfigForm
              config={providerMetadata.minimax ?? {}}
              updateConfig={(minimax: MiniMaxSpeechConfig) =>
                setProviderMetadata({ ...providerMetadata, minimax })
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

        {enabledProviders.includes("StabilityAI") && (
          <theme.Tab eventKey="stabilityai" title="StabilityAI">
            <StabilityAISpeechConfigForm
              config={providerMetadata.stabilityai ?? {}}
              updateConfig={(stabilityai: StabilityAISpeechConfig) =>
                setProviderMetadata({ ...providerMetadata, stabilityai })
              }
            />
          </theme.Tab>
        )}

        {enabledProviders.includes("Together") && (
          <theme.Tab eventKey="together" title="Together">
            <TogetherSpeechConfigForm
              config={providerMetadata.together ?? {}}
              updateConfig={(together: any) =>
                setProviderMetadata({ ...providerMetadata, together })
              }
            />
          </theme.Tab>
        )}




      </theme.Tabs>
    </theme.Modal>
  );
};


