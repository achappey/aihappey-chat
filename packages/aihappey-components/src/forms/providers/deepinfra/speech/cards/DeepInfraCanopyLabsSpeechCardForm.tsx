import React from "react";
import { useTheme } from "../../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type {
  DeepInfraCanopyLabsSpeechConfig,
  DeepInfraSpeechConfig,
} from "../DeepInfraSpeechConfigForm";

const DEFAULT_VALUE = "__default__";

const RESPONSE_FORMATS = ["mp3", "opus", "flac", "wav", "pcm"] as const;

const VOICES = ["tara", "leah", "jess", "leo", "dan", "mia", "zac"] as const;

const isKnownResponseFormat = (v?: string) =>
  !!v && (RESPONSE_FORMATS as readonly string[]).includes(v);

const isKnownVoice = (v?: string) => !!v && (VOICES as readonly string[]).includes(v);

export const DeepInfraCanopyLabsSpeechCardForm: React.FC<{
  config: DeepInfraSpeechConfig;
  updateConfig: (val: DeepInfraSpeechConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const canopyConfig = config?.canopylabs ?? {};

  const updateCanopyConfig = (patch: Partial<DeepInfraCanopyLabsSpeechConfig>) => {
    updateConfig({
      ...config,
      canopylabs: {
        ...canopyConfig,
        ...patch,
      },
    });
  };

  const responseFormatSelectValue = isKnownResponseFormat(canopyConfig?.response_format)
    ? (canopyConfig.response_format as string)
    : DEFAULT_VALUE;

  const responseFormatOptions = [
    { value: DEFAULT_VALUE, label: t("providerDefault") },
    ...RESPONSE_FORMATS.map((f) => ({ value: f, label: f })),
  ];

  const voiceSelectValue = isKnownVoice(canopyConfig?.voice)
    ? (canopyConfig.voice as string)
    : DEFAULT_VALUE;

  const voiceOptions = [
    { value: DEFAULT_VALUE, label: t("providerDefault") },
    ...VOICES.map((voice) => ({ value: voice, label: voice })),
  ];

  return (
    <theme.Card size="small" title="CanopyLabs">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <theme.Select
          label={t("outputFormat")}
          values={[responseFormatSelectValue]}
          valueTitle={
            responseFormatOptions.find((o) => o.value === responseFormatSelectValue)?.label
          }
          options={responseFormatOptions}
          onChange={(val: string) => {
            const raw = String(val ?? "");
            updateCanopyConfig({
              response_format: raw === DEFAULT_VALUE ? undefined : raw,
            });
          }}
          style={{ minWidth: 220 }}
        >
          {responseFormatOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </theme.Select>

        <theme.Select
          label={t("speechSettings.voice")}
          values={[voiceSelectValue]}
          valueTitle={voiceOptions.find((o) => o.value === voiceSelectValue)?.label}
          options={voiceOptions}
          onChange={(val: string) => {
            const raw = String(val ?? "");
            updateCanopyConfig({
              voice: raw === DEFAULT_VALUE ? undefined : raw,
            });
          }}
          style={{ minWidth: 220 }}
        >
          {voiceOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </theme.Select>

        <div style={{ display: "flex", gap: 12, width: "100%" }}>
          <theme.Input
            id="deepinfra-speech-canopylabs-temperature"
            type="number"
            step={0.01}
            style={{ flex: 1 }}
            min={0}
            max={2}
            label={t("temperature", {
              temperature: canopyConfig?.temperature ?? t("providerDefault").toLocaleLowerCase(),
            })}
            value={canopyConfig?.temperature ?? ""}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              updateCanopyConfig({
                temperature: raw.length ? Number(raw) : undefined,
              });
            }}
          />

          <theme.Input
            id="deepinfra-speech-canopylabs-top-p"
            type="number"
            step={0.01}
            style={{ flex: 1 }}
            min={0}
            max={1}
            label={t("providers:deepinfra.speech.topP")}
            value={canopyConfig?.top_p ?? ""}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              updateCanopyConfig({
                top_p: raw.length ? Number(raw) : undefined,
              });
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 12, width: "100%" }}>
          <theme.Input
            id="deepinfra-speech-canopylabs-max-tokens"
            type="number"
            step={1}
            min={1}
            max={4096}
            style={{ flex: 1 }}
            label={t("providers:deepinfra.speech.maxTokens")}
            value={canopyConfig?.max_tokens ?? ""}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              updateCanopyConfig({
                max_tokens: raw.length ? Number(raw) : undefined,
              });
            }}
          />

          <theme.Input
            id="deepinfra-speech-canopylabs-repetition-penalty"
            type="number"
            step={0.1}
            style={{ flex: 1 }}
            min={0}
            label={t("providers:deepinfra.speech.repetitionPenalty")}
            value={canopyConfig?.repetition_penalty ?? ""}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              updateCanopyConfig({
                repetition_penalty: raw.length ? Number(raw) : undefined,
              });
            }}
          />
        </div>
      </div>
    </theme.Card>
  );
};
