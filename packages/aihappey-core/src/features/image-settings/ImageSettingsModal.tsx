import React, { useState } from "react";
import { useTranslation } from "aihappey-i18n";
import { useAppStore } from "aihappey-state";
import { SettingsActionButtons, useTheme } from "aihappey-components";
import { ImageSettingsGeneralTab } from "./ImageSettingsGeneralTab";
import { PollinationsImageConfig } from "../provider-config/pollinations/PollinationsImageConfig";
import { OpenAIImageConfig } from "../provider-config/openai/OpenAIImageConfig";
import { TogetherImageConfig } from "../provider-config/together/TogetherImageConfig";
import { RunwayImageConfig } from "../provider-config/runway/TogetherImageConfig";

export interface ImageSettingsModalProps {
  open: boolean;
  setTemperature?: any;
  temperature?: any;
  providerMetadata: any;
  resetDefaults?: any;
  setProviderMetadata: (meta: any) => void;
  onEditProviderKeys?: () => void
  onClose: () => void;
}

export const ImageSettingsModal: React.FC<ImageSettingsModalProps> = ({
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
      title={t("imageSettings.title")}
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
          <ImageSettingsGeneralTab
            temperature={temperature}
            onEditProviderKeys={onEditProviderKeys}
            setTemperature={setTemperature}
          />
        </theme.Tab>

        {enabledProviders.includes("OpenAI") &&
          <theme.Tab eventKey="openai" title="OpenAI">
            <OpenAIImageConfig
              openai={providerMetadata.openai ?? {}}
              updateOpenAI={(openai) =>
                setProviderMetadata({ ...providerMetadata, openai })
              }
            />
          </theme.Tab>
        }

        {enabledProviders.includes("Pollinations") &&
          <theme.Tab eventKey="pollinations" title="Pollinations">
            <PollinationsImageConfig
              pollinations={providerMetadata.pollinations ?? {}}
              updatePollinations={(pollinations: any) =>
                setProviderMetadata({ ...providerMetadata, pollinations })
              }
            />
          </theme.Tab>
        }

        {enabledProviders.includes("Runway") &&
          <theme.Tab eventKey="Runway" title="Runway">
            <RunwayImageConfig
              runway={providerMetadata.runway ?? {}}
              updateRunway={(runway: any) =>
                setProviderMetadata({ ...providerMetadata, runway })
              }
            />
          </theme.Tab>
        }

        {enabledProviders.includes("Together") &&
          <theme.Tab eventKey="together" title="Together">
            <TogetherImageConfig
              together={providerMetadata.together ?? {}}
              updateTogether={(together: any) =>
                setProviderMetadata({ ...providerMetadata, together })
              }
            />
          </theme.Tab>
        }

      </theme.Tabs>
    </theme.Modal>
  );
};