import React, { useState } from "react";
import { useTranslation } from "aihappey-i18n";
import { useAppStore } from "aihappey-state";
import {
  AnthropicChatConfigForm,
  CohereChatConfigForm, GroqChatConfigForm,
  JinaChatConfigForm,
  MistralChatConfigForm, OpenAIChatConfigForm,
  PerplexityChatConfigForm,
  PollinationsChatConfigForm,
  SambanovaChatConfigForm,
  SettingsActionButtons, TogetherChatConfigForm,
  useTheme, XAIChatConfigForm
} from "aihappey-components";
import { GeneralTab } from "./GeneralTab";
import { ToolsTab } from "./ToolsTab";
import { GoogleChatConfig } from "../provider-config/google/GoogleChatConfig";

export interface ProviderSettingsModalProps {
  open: boolean;
  setTemperature?: any;
  temperature?: any;
  providerMetadata: any;
  resetDefaults?: any;
  setProviderMetadata: (meta: any) => void;
  onEditProviderKeys?: () => void
  onClose: () => void;
}

export const ChatSettingsModal: React.FC<ProviderSettingsModalProps> = ({
  open,
  providerMetadata,
  temperature,
  resetDefaults,
  setTemperature,
  setProviderMetadata,
  onEditProviderKeys,
  onClose,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const defaultTab = "general";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const enabledProviders = useAppStore((a) => a.enabledProvidersByType?.language ?? [])

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
      title={t("chatSettings")}
      actions={
        <SettingsActionButtons
          onClose={close}
          onRestoreDefaults={resetDefaults}
        />
      }
    >
      <theme.Tabs activeKey={activeTab} onSelect={setActiveTab}>
        <theme.Tab eventKey="general" title={t("general")}>
          <GeneralTab
            temperature={temperature}
            onEditProviderKeys={onEditProviderKeys}
            setTemperature={setTemperature}
          />
        </theme.Tab>
        <theme.Tab eventKey="tools" title={t("tools") ?? "Tools"}>
          <ToolsTab />
        </theme.Tab>
        {enabledProviders.includes("Anthropic") &&
          <theme.Tab eventKey="anthropic" title="Anthropic">
            <AnthropicChatConfigForm
              config={providerMetadata.anthropic ?? {}}
              updateConfig={(anthropic) =>
                setProviderMetadata({ ...providerMetadata, anthropic })
              }
            />
          </theme.Tab>
        }
        {enabledProviders.includes("Cohere") &&
          <theme.Tab eventKey="cohere" title="Cohere">
            <CohereChatConfigForm
              config={providerMetadata.cohere ?? {}}
              updateConfig={(cohere) =>
                setProviderMetadata({ ...providerMetadata, cohere })
              }
            />
          </theme.Tab>
        }
        {enabledProviders.includes("Google") &&
          <theme.Tab eventKey="google" title="Google">
            <GoogleChatConfig
              google={providerMetadata.google ?? {}}
              updateGoogle={(google) =>
                setProviderMetadata({ ...providerMetadata, google })
              }
            />
          </theme.Tab>
        }
        {enabledProviders.includes("Groq") &&
          <theme.Tab eventKey="groq" title="Groq">
            <GroqChatConfigForm
              config={providerMetadata.groq ?? {}}
              updateConfig={(groq) =>
                setProviderMetadata({ ...providerMetadata, groq })
              }
            />
          </theme.Tab>
        }
        {enabledProviders.includes("Jina") &&
          <theme.Tab eventKey="jina" title="Jina">
            <JinaChatConfigForm
              config={providerMetadata.jina ?? {}}
              updateConfig={(jina) =>
                setProviderMetadata({ ...providerMetadata, jina })
              }
            />
          </theme.Tab>
        }
        {enabledProviders.includes("Mistral") &&
          <theme.Tab eventKey="mistral" title="Mistral">
            <MistralChatConfigForm
              config={providerMetadata.mistral ?? {}}
              updateConfig={(mistral) =>
                setProviderMetadata({ ...providerMetadata, mistral })
              }
            />
          </theme.Tab>
        }
        {enabledProviders.includes("OpenAI") &&
          <theme.Tab eventKey="openai" title="OpenAI">
            <OpenAIChatConfigForm
              config={providerMetadata.openai ?? {}}
              updateConfig={(openai) =>
                setProviderMetadata({ ...providerMetadata, openai })}
            />

          </theme.Tab>
        }
        {enabledProviders.includes("Pollinations") &&
          <theme.Tab eventKey="pollinations" title="Pollinations">
            <PollinationsChatConfigForm
              config={providerMetadata.pollinations ?? {}}
              updateConfig={(pollinations) =>
                setProviderMetadata({ ...providerMetadata, pollinations })
              } />

          </theme.Tab>
        }
        {enabledProviders.includes("Perplexity") &&
          <theme.Tab eventKey="perplexity"
            title="Perplexity">
            <PerplexityChatConfigForm
              config={providerMetadata.perplexity ?? {}}
              updateConfig={(perplexity) =>
                setProviderMetadata({ ...providerMetadata, perplexity })
              }
            />
          </theme.Tab>
        }
        {enabledProviders.includes("Together") &&
          <theme.Tab eventKey="together"
            title="Together">
            <TogetherChatConfigForm
              config={providerMetadata.together ?? {}}
              updateConfig={(together) =>
                setProviderMetadata({ ...providerMetadata, together })
              }
            />
          </theme.Tab>
        }
        {enabledProviders.includes("SambaNova") &&
          <theme.Tab eventKey="sambanova" title="SambaNova">
            <SambanovaChatConfigForm
              config={providerMetadata.sambanova ?? {}}
              updateConfig={(sambanova) =>
                setProviderMetadata({ ...providerMetadata, sambanova })
              }
            />
          </theme.Tab>
        }
        {enabledProviders.includes("xAI") &&
          <theme.Tab eventKey="xai"
            title="xAI">
            <XAIChatConfigForm
              config={providerMetadata.xai ?? {}}
              updateConfig={(xai) =>
                setProviderMetadata({ ...providerMetadata, xai })
              }
            />
          </theme.Tab>
        }
      </theme.Tabs>
    </theme.Modal>
  );
};
