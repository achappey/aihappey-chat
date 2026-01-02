import React, { useState } from "react";
import { useTranslation } from "aihappey-i18n";
import { useAppStore } from "aihappey-state";
import { OpenAIChatConfigForm, PollinationsChatConfigForm, SettingsActionButtons, useTheme } from "aihappey-components";
import { GeneralTab } from "./GeneralTab";
import { GroqChatConfig } from "../provider-config/groq/GroqChatConfig";
import { XAIChatConfig } from "../provider-config/xai/XAIChatConfig";
import { TogetherChatConfig } from "../provider-config/together/TogetherChatConfig";
import { MistralChatConfig } from "../provider-config/mistral/MistralChatConfig";
import { JinaChatConfig } from "../provider-config/jina/JinaChatConfig";
import { CohereChatConfig } from "../provider-config/cohere/CohereChatConfig";
import { PerplexityChatConfig } from "../provider-config/perplexity/PerplexityChatConfig";
import { GoogleChatConfig } from "../provider-config/google/GoogleChatConfig";
import { AnthropicChatConfig } from "../provider-config/anthropic/AnthropicChatConfig";

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
  const enabledProviders = useAppStore(a => a.enabledProviders)

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
          translations={{
            close: t("close"),
            restoreDefaults: t("resetDefaults")
          }}
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
        {enabledProviders.includes("Anthropic") &&
          <theme.Tab eventKey="anthropic" title="Anthropic">
            <AnthropicChatConfig
              anthropic={providerMetadata.anthropic ?? {}}
              updateAnthropic={(anthropic) =>
                setProviderMetadata({ ...providerMetadata, anthropic })
              }
            />
          </theme.Tab>
        }
        {enabledProviders.includes("Cohere") &&
          <theme.Tab eventKey="cohere" title="Cohere">
            <CohereChatConfig
              cohere={providerMetadata.cohere ?? {}}
              updateCohere={(cohere) =>
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
            <GroqChatConfig
              groq={providerMetadata.groq ?? {}}
              updateGroq={(groq) =>
                setProviderMetadata({ ...providerMetadata, groq })
              }
            />
          </theme.Tab>
        }
        {enabledProviders.includes("Jina") &&
          <theme.Tab eventKey="jina" title="Jina">
            <JinaChatConfig
              jina={providerMetadata.jina ?? {}}
              updateJina={(jina) =>
                setProviderMetadata({ ...providerMetadata, jina })
              }
            />
          </theme.Tab>
        }
        {enabledProviders.includes("Mistral") &&
          <theme.Tab eventKey="mistral" title="Mistral">
            <MistralChatConfig
              mistral={providerMetadata.mistral ?? {}}
              updateMistral={(mistral) =>
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
          <theme.Tab eventKey="perplexity" title="Perplexity">
            <PerplexityChatConfig
              perplexity={providerMetadata.perplexity ?? {}}
              updatePerplexity={(perplexity) =>
                setProviderMetadata({ ...providerMetadata, perplexity })
              }
            />
          </theme.Tab>
        }
        {enabledProviders.includes("Together") &&
          <theme.Tab eventKey="together" title="Together">
            <TogetherChatConfig
              together={providerMetadata.together ?? {}}
              updateTogether={(together) =>
                setProviderMetadata({ ...providerMetadata, together })
              }
            />
          </theme.Tab>
        }
        {enabledProviders.includes("xAI") &&
          <theme.Tab eventKey="xai" title="xAI">
            <XAIChatConfig
              xAI={providerMetadata.xai ?? {}}
              updateXAI={(xai) =>
                setProviderMetadata({ ...providerMetadata, xai })
              }
            />
          </theme.Tab>
        }
      </theme.Tabs>
    </theme.Modal>
  );
};