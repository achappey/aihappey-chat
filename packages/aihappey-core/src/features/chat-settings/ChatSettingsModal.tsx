import React, { useState } from "react";
import { useTranslation } from "aihappey-i18n";
import { useAppStore } from "aihappey-state";
import { useTheme } from "aihappey-components";
import { GeneralTab } from "./GeneralTab";
import { AnthropicTab } from "../provider-config/AnthropicTab";
import { CohereTab } from "../provider-config/CohereTab";
import { GoogleTab } from "../provider-config/GoogleTab";
import { GroqTab } from "../provider-config/GroqTab";
import { JinaTab } from "../provider-config/JinaTab";
import { MistralTab } from "../provider-config/MistralTab";
import { OpenAITab } from "../provider-config/OpenAITab";
import { PerplexityTab } from "../provider-config/PerplexityTab";
import { PollinationsTab } from "../provider-config/PollinationsTab";
import { TogetherTab } from "../provider-config/TogetherTab";
import { XAITab } from "../provider-config/XAITab";

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
        <>
          <theme.Button variant="subtle" onClick={resetDefaults}>
            {t("resetDefaults")}
          </theme.Button>
          <theme.Button variant="secondary" onClick={close}>
            {t("close")}
          </theme.Button>
        </>
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
            <AnthropicTab
              anthropic={providerMetadata.anthropic ?? {}}
              updateAnthropic={(anthropic) =>
                setProviderMetadata({ ...providerMetadata, anthropic })
              }
            />
          </theme.Tab>
        }
        {enabledProviders.includes("Cohere") &&
          <theme.Tab eventKey="cohere" title="Cohere">
            <CohereTab
              cohere={providerMetadata.cohere ?? {}}
              updateCohere={(cohere) =>
                setProviderMetadata({ ...providerMetadata, cohere })
              }
            />
          </theme.Tab>
        }
        {enabledProviders.includes("Google") &&
          <theme.Tab eventKey="google" title="Google">
            <GoogleTab
              google={providerMetadata.google ?? {}}
              updateGoogle={(google) =>
                setProviderMetadata({ ...providerMetadata, google })
              }
            />
          </theme.Tab>
        }
        {enabledProviders.includes("Groq") &&
          <theme.Tab eventKey="groq" title="Groq">
            <GroqTab
              groq={providerMetadata.groq ?? {}}
              updateGroq={(groq) =>
                setProviderMetadata({ ...providerMetadata, groq })
              }
            />
          </theme.Tab>
        }
        {enabledProviders.includes("Jina") &&
          <theme.Tab eventKey="jina" title="Jina">
            <JinaTab
              jina={providerMetadata.jina ?? {}}
              updateJina={(jina) =>
                setProviderMetadata({ ...providerMetadata, jina })
              }
            />
          </theme.Tab>
        }
        {enabledProviders.includes("Mistral") &&
          <theme.Tab eventKey="mistral" title="Mistral">
            <MistralTab
              mistral={providerMetadata.mistral ?? {}}
              updateMistral={(mistral) =>
                setProviderMetadata({ ...providerMetadata, mistral })
              }
            />
          </theme.Tab>
        }
        {enabledProviders.includes("OpenAI") &&
          <theme.Tab eventKey="openai" title="OpenAI">
            <OpenAITab
              openai={providerMetadata.openai ?? {}}
              updateOpenAI={(openai) =>
                setProviderMetadata({ ...providerMetadata, openai })
              }
            />
          </theme.Tab>
        }
        {enabledProviders.includes("Pollinations") &&
          <theme.Tab eventKey="pollinations" title="Pollinations">
            <PollinationsTab
              pollinations={providerMetadata.pollinations ?? {}}
              updatePollinations={(pollinations) =>
                setProviderMetadata({ ...providerMetadata, pollinations })
              }
            />
          </theme.Tab>
        }
        {enabledProviders.includes("Perplexity") &&
          <theme.Tab eventKey="perplexity" title="Perplexity">
            <PerplexityTab
              perplexity={providerMetadata.perplexity ?? {}}
              updatePerplexity={(perplexity) =>
                setProviderMetadata({ ...providerMetadata, perplexity })
              }
            />
          </theme.Tab>
        }
        {enabledProviders.includes("Together") &&
          <theme.Tab eventKey="together" title="Together">
            <TogetherTab
              together={providerMetadata.together ?? {}}
              updateTogether={(together) =>
                setProviderMetadata({ ...providerMetadata, together })
              }
            />
          </theme.Tab>
        }
        {enabledProviders.includes("xAI") &&
          <theme.Tab eventKey="xai" title="xAI">
            <XAITab
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