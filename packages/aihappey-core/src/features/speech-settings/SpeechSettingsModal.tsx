import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "aihappey-i18n";
import { SettingsActionButtons, SpeechifySpeechConfig, SpeechifySpeechConfigForm, useTheme } from "aihappey-components";
import { SpeechSettingsGeneralTab } from "./SpeechSettingsGeneralTab";
import { useAppStore } from "aihappey-state";
import { getModelProviderKey } from "aihappey-types";
import {
  DeepInfraSpeechConfigForm,
  DeepgramSpeechConfigForm,
  AudixaSpeechConfigForm,
  FreepikSpeechConfigForm,
  RunwaySpeechConfigForm,
  OpenAISpeechConfigForm,
  GroqSpeechConfigForm,
  NovitaSpeechConfigForm,
  ElevenLabsSpeechConfigForm,
  GoogleSpeechConfigForm,
  StabilityAISpeechConfigForm,
  AsyncSpeechConfigForm,
  TogetherSpeechConfigForm,
  MiniMaxSpeechConfigForm,
  ResembleAISpeechConfigForm,
  MurfAISpeechConfigForm,
  StepFunSpeechConfigForm,
  type DeepInfraSpeechConfig,
  type ElevenLabsSpeechConfig,
  type DeepgramSpeechConfig,
  type AudixaSpeechConfig,
  type FreepikSpeechConfig,
  type RunwaySpeechConfig,
  type OpenAISpeechConfig,
  type GroqSpeechConfig,
  type NovitaSpeechConfig,
  type GoogleSpeechConfig,
  type StabilityAISpeechConfig,
  type AsyncSpeechConfig,
  type MiniMaxSpeechConfig,
  type ResembleAISpeechConfig,
  type MurfAISpeechConfig,
  type StepFunSpeechConfig,
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
  const models = useAppStore((a) => a.models);
  const selectedModelOption = useMemo(
    () => models?.find((model) => model.id === selectedModel),
    [models, selectedModel]
  );
  const activeProviderKey = getModelProviderKey(selectedModel, selectedModelOption);

  const activeProvider = useMemo(() => {
    const update = (providerKey: string, config: unknown) =>
      setProviderMetadata({ ...providerMetadata, [providerKey]: config });

    switch (activeProviderKey) {
      case "async":
        return { title: "Async", form: <AsyncSpeechConfigForm config={providerMetadata.async ?? {}} updateConfig={(config: AsyncSpeechConfig) => update("async", config)} /> };
      case "audixa":
        return { title: "Audixa", form: <AudixaSpeechConfigForm config={providerMetadata.audixa ?? {}} updateConfig={(config: AudixaSpeechConfig) => update("audixa", config)} /> };
      case "deepgram":
        return { title: "Deepgram", form: <DeepgramSpeechConfigForm config={providerMetadata.deepgram ?? {}} updateConfig={(config: DeepgramSpeechConfig) => update("deepgram", config)} /> };
      case "deepinfra":
        return { title: "DeepInfra", form: <DeepInfraSpeechConfigForm config={providerMetadata.deepinfra ?? {}} updateConfig={(config: DeepInfraSpeechConfig) => update("deepinfra", config)} /> };
      case "freepik":
        return { title: "Freepik", form: <FreepikSpeechConfigForm config={providerMetadata.freepik ?? {}} updateConfig={(config: FreepikSpeechConfig) => update("freepik", config)} /> };
      case "runway":
        return { title: "Runway", form: <RunwaySpeechConfigForm config={providerMetadata.runway ?? {}} updateConfig={(config: RunwaySpeechConfig) => update("runway", config)} /> };
      case "elevenlabs":
        return { title: "ElevenLabs", form: <ElevenLabsSpeechConfigForm config={providerMetadata.elevenlabs ?? {}} updateConfig={(config: ElevenLabsSpeechConfig) => update("elevenlabs", config)} /> };
      case "google":
        return { title: "Google", form: <GoogleSpeechConfigForm config={providerMetadata.google ?? {}} updateConfig={(config: GoogleSpeechConfig) => update("google", config)} /> };
      case "groq":
        return { title: "Groq", form: <GroqSpeechConfigForm config={providerMetadata.groq ?? {}} updateConfig={(config: GroqSpeechConfig) => update("groq", config)} /> };
      case "minimax":
        return { title: "MiniMax", form: <MiniMaxSpeechConfigForm config={providerMetadata.minimax ?? {}} updateConfig={(config: MiniMaxSpeechConfig) => update("minimax", config)} /> };
      case "novita":
        return { title: "Novita", form: <NovitaSpeechConfigForm config={providerMetadata.novita ?? {}} updateConfig={(config: NovitaSpeechConfig) => update("novita", config)} /> };
      case "openai":
        return { title: "OpenAI", form: <OpenAISpeechConfigForm config={providerMetadata.openai ?? {}} updateConfig={(config: OpenAISpeechConfig) => update("openai", config)} /> };
      case "speechify":
        return { title: "Speechify", form: <SpeechifySpeechConfigForm config={providerMetadata.speechify ?? {}} updateConfig={(config: SpeechifySpeechConfig) => update("speechify", config)} /> };
      case "stabilityai":
        return { title: "StabilityAI", form: <StabilityAISpeechConfigForm config={providerMetadata.stabilityai ?? {}} updateConfig={(config: StabilityAISpeechConfig) => update("stabilityai", config)} /> };
      case "together":
        return { title: "Together", form: <TogetherSpeechConfigForm config={providerMetadata.together ?? {}} updateConfig={(config: any) => update("together", config)} /> };
      case "resembleai":
        return { title: "ResembleAI", form: <ResembleAISpeechConfigForm config={providerMetadata.resembleai ?? {}} updateConfig={(config: ResembleAISpeechConfig) => update("resembleai", config)} /> };
      case "murfai":
        return { title: "MurfAI", form: <MurfAISpeechConfigForm config={providerMetadata.murfai ?? {}} updateConfig={(config: MurfAISpeechConfig) => update("murfai", config)} /> };
      case "stepfun":
        return { title: "StepFun", form: <StepFunSpeechConfigForm config={providerMetadata.stepfun ?? {}} updateConfig={(config: StepFunSpeechConfig) => update("stepfun", config)} /> };
      default:
        return undefined;
    }
  }, [activeProviderKey, providerMetadata, setProviderMetadata]);

  useEffect(() => {
    if (activeTab === "provider" && !activeProvider) setActiveTab(defaultTab);
  }, [activeProvider, activeTab]);

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


        {activeProvider ? (
          <theme.Tab eventKey="provider" title={activeProvider.title}>
            {activeProvider.form}
          </theme.Tab>
        ) : null}
      </theme.Tabs>
    </theme.Modal>
  );
};



