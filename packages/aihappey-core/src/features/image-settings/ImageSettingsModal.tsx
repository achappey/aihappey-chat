import React, { useMemo, useState } from "react";
import { useTranslation } from "aihappey-i18n";
import { useAppStore } from "aihappey-state";
import {
  OpenAIImageConfigForm, PollinationsImageConfigForm,
  RunwayImageConfigForm, SettingsActionButtons,
  StabilityAIImageForm, TogetherImageConfigForm, HyperbolicImageConfigForm, NebiusImageConfigForm, useTheme,
  FireworksImageConfigForm, VerdaImageConfigForm, FreepikImageConfigForm, ErrorAlerts,
  MiniMaxImageConfigForm, XAIImageConfigForm
} from "aihappey-components";
import { ImageSettingsGeneralTab } from "./ImageSettingsGeneralTab";
import { PROVIDERS } from "../../runtime/providers/providerMetadata";

export interface ImageSettingsModalProps {
  open: boolean;
  selectedModel?: string;
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
  selectedModel,
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
  const [errors, setErrors] = useState<{ id: string; message: string }[]>([]);
  const models = useAppStore((a) => a.models);
  const selectedModelOption = useMemo(
    () => models?.find((model) => model.id === selectedModel),
    [models, selectedModel]
  );
  const activeProviderKey = useMemo(() => {
    const key = (
      (selectedModelOption as any)?.sourceProviderKey
      ?? (selectedModelOption as any)?.providerKey
      ?? selectedModel?.split("/")[0]
    )?.trim().toLowerCase();

    return key || undefined;
  }, [selectedModel, selectedModelOption]);

  const updateProviderConfig = (providerKey: string, config: any) => {
    setProviderMetadata({ ...providerMetadata, [providerKey]: config });
  };

  const activeProviderForm = useMemo(() => {
    switch (activeProviderKey) {
      case "fireworks":
        return <FireworksImageConfigForm config={providerMetadata.fireworks ?? {}} updateConfig={(config) => updateProviderConfig("fireworks", config)} />;
      case "hyperbolic":
        return <HyperbolicImageConfigForm config={providerMetadata.hyperbolic ?? {}} updateConfig={(config) => updateProviderConfig("hyperbolic", config)} />;
      case "nebius":
        return <NebiusImageConfigForm config={providerMetadata.nebius ?? {}} updateConfig={(config) => updateProviderConfig("nebius", config)} />;
      case "minimax":
        return <MiniMaxImageConfigForm config={providerMetadata.minimax ?? { prompt_optimizer: false }} updateConfig={(config) => updateProviderConfig("minimax", config)} />;
      case "openai":
        return <OpenAIImageConfigForm config={providerMetadata.openai ?? {}} updateConfig={(config) => updateProviderConfig("openai", config)} />;
      case "spacexai":
        return <XAIImageConfigForm config={providerMetadata.spacexai ?? { quality: "auto" }} updateConfig={(config) => updateProviderConfig("spacexai", config)} />;
      case "pollinations":
        return <PollinationsImageConfigForm config={providerMetadata.pollinations ?? {}} updateConfig={(config) => updateProviderConfig("pollinations", config)} />;
      case "runway":
        return <RunwayImageConfigForm config={providerMetadata.runway ?? {}} updateConfig={(config) => updateProviderConfig("runway", config)} />;
      case "stabilityai":
        return <StabilityAIImageForm config={providerMetadata.stabilityai ?? {}} updateConfig={(config) => updateProviderConfig("stabilityai", config)} />;
      case "together":
        return <TogetherImageConfigForm config={providerMetadata.together ?? {}} updateConfig={(config) => updateProviderConfig("together", config)} />;
      case "verda":
        return <VerdaImageConfigForm config={providerMetadata.verda ?? {}} updateConfig={(config) => updateProviderConfig("verda", config)} />;
      case "freepik":
        return <FreepikImageConfigForm config={providerMetadata.freepik ?? {}} updateConfig={(config) => updateProviderConfig("freepik", config)} />;
      default:
        return null;
    }
  }, [activeProviderKey, providerMetadata]);

  const activeProviderTitle = activeProviderKey
    ? (PROVIDERS as Record<string, { name?: string }>)[activeProviderKey]?.name ?? activeProviderKey
    : undefined;

  const addError = (message: string) => {
    setErrors((prev) => [...prev, { id: crypto.randomUUID(), message }]);
  };

  const dismissError = (id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id));
  };

  const close = () => {
    onClose();
    setErrors([]);
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
      <ErrorAlerts errors={errors} dismissError={dismissError} />

      <theme.Tabs activeKey={activeTab}
        onSelect={setActiveTab}>
        <theme.Tab eventKey="general"
          title={t("general")}>
          {activeTab === "general" ? (
            <ImageSettingsGeneralTab
              onErrorAlert={addError}
              temperature={temperature}
              onEditProviderKeys={onEditProviderKeys}
              setTemperature={setTemperature}
            />
          ) : null}
        </theme.Tab>
        {activeProviderForm && activeProviderTitle ? (
          <theme.Tab eventKey="provider" title={activeProviderTitle}>
            {activeTab === "provider" ? activeProviderForm : null}
          </theme.Tab>
        ) : null}
      </theme.Tabs>
    </theme.Modal>
  );
};
