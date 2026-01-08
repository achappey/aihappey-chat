import React, { useState } from "react";
import { useTranslation } from "aihappey-i18n";
import { useAppStore } from "aihappey-state";
import {
  OpenAIImageConfigForm, PollinationsImageConfigForm,
  RunwayImageConfigForm, SettingsActionButtons,
  StabilityAIImageForm, TogetherImageConfigForm, HyperbolicImageConfigForm, useTheme
} from "aihappey-components";
import { ImageSettingsGeneralTab } from "./ImageSettingsGeneralTab";

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
        />
      }
    >
      <theme.Tabs activeKey={activeTab}
        onSelect={setActiveTab}>
        <theme.Tab eventKey="general"
          title={t("general")}>
          <ImageSettingsGeneralTab
            temperature={temperature}
            onEditProviderKeys={onEditProviderKeys}
            setTemperature={setTemperature}
          />
        </theme.Tab>

        {enabledProviders.includes("OpenAI") &&
          <theme.Tab eventKey="openai"
            title="OpenAI">
            <OpenAIImageConfigForm
              config={providerMetadata.openai ?? {}}
              updateConfig={(openai) =>
                setProviderMetadata({ ...providerMetadata, openai })
              }
            />
          </theme.Tab>
        }

        {enabledProviders.includes("Pollinations") &&
          <theme.Tab eventKey="pollinations"
            title="Pollinations">
            <PollinationsImageConfigForm
              config={providerMetadata.pollinations ?? {}}
              updateConfig={(pollinations) =>
                setProviderMetadata({ ...providerMetadata, pollinations })
              }
            />
          </theme.Tab>
        }

        {enabledProviders.includes("Runway") &&
          <theme.Tab eventKey="Runway"
            title="Runway">
            <RunwayImageConfigForm
              config={providerMetadata.runway ?? {}}
              updateConfig={(runway) =>
                setProviderMetadata({ ...providerMetadata, runway })
              }
            />
          </theme.Tab>
        }

        {enabledProviders.includes("StabilityAI") &&
          <theme.Tab eventKey="stabilityai"
            title="StabilityAI">
            <StabilityAIImageForm
              config={providerMetadata.stabilityai ?? {}}
              updateConfig={(stabilityai) =>
                setProviderMetadata({ ...providerMetadata, stabilityai })
              }
            />
          </theme.Tab>
        }

        {enabledProviders.includes("Together") &&
          <theme.Tab eventKey="together"
            title="Together">
            <TogetherImageConfigForm
              config={providerMetadata.together ?? {}}
              updateConfig={(together) =>
                setProviderMetadata({ ...providerMetadata, together })
              }
            />
          </theme.Tab>
        }

        {enabledProviders.includes("Hyperbolic") &&
          <theme.Tab eventKey="hyperbolic"
            title="Hyperbolic">
            <HyperbolicImageConfigForm
              config={providerMetadata.hyperbolic ?? {}}
              updateConfig={(hyperbolic) =>
                setProviderMetadata({ ...providerMetadata, hyperbolic })
              }
            />
          </theme.Tab>
        }

      </theme.Tabs>
    </theme.Modal>
  );
};
