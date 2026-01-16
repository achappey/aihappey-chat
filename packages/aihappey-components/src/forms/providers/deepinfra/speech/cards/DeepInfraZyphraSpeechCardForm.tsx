import React from "react";
import { useTheme } from "../../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type {
  DeepInfraSpeechConfig,
  DeepInfraZyphraSpeechConfig,
} from "../DeepInfraSpeechConfigForm";

const DEFAULT_VALUE = "__default__";

const RESPONSE_FORMATS = ["mp3", "opus", "flac", "wav", "pcm"] as const;

const PRESET_VOICES = [
  "american_female",
  "american_male",
  "british_female",
  "british_male",
  "random",
] as const;

const LANGUAGES = ["en-us", "fr-fr", "de", "ja", "ko", "cmn"] as const;

const isKnownResponseFormat = (v?: string) =>
  !!v && (RESPONSE_FORMATS as readonly string[]).includes(v);

const isKnownPresetVoice = (v?: string) =>
  !!v && (PRESET_VOICES as readonly string[]).includes(v);

const isKnownLanguage = (v?: string) =>
  !!v && (LANGUAGES as readonly string[]).includes(v);

export const DeepInfraZyphraSpeechCardForm: React.FC<{
  config: DeepInfraSpeechConfig;
  updateConfig: (val: DeepInfraSpeechConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const zyphraConfig = config?.zyphra ?? {};

  const updateZyphraConfig = (patch: Partial<DeepInfraZyphraSpeechConfig>) => {
    updateConfig({
      ...config,
      zyphra: {
        ...zyphraConfig,
        ...patch,
      },
    });
  };

  const responseFormatSelectValue = isKnownResponseFormat(zyphraConfig?.output_format)
    ? (zyphraConfig.output_format as string)
    : DEFAULT_VALUE;

  const responseFormatOptions = [
    { value: DEFAULT_VALUE, label: t("providerDefault") },
    ...RESPONSE_FORMATS.map((f) => ({ value: f, label: f })),
  ];

  const presetVoiceSelectValue = isKnownPresetVoice(zyphraConfig?.preset_voice)
    ? (zyphraConfig.preset_voice as string)
    : DEFAULT_VALUE;

  const presetVoiceOptions = [
    { value: DEFAULT_VALUE, label: t("providerDefault") },
    ...PRESET_VOICES.map((v) => ({ value: v, label: v })),
  ];

  const languageSelectValue = isKnownLanguage(zyphraConfig?.language)
    ? (zyphraConfig.language as string)
    : DEFAULT_VALUE;

  const languageOptions = [
    { value: DEFAULT_VALUE, label: t("providerDefault") },
    ...LANGUAGES.map((v) => ({ value: v, label: v })),
  ];

  return (
    <theme.Card size="small" title="Zyphra">
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
            updateZyphraConfig({
              output_format: raw === DEFAULT_VALUE ? undefined : raw,
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
          values={[presetVoiceSelectValue]}
          valueTitle={presetVoiceOptions.find((o) => o.value === presetVoiceSelectValue)?.label}
          options={presetVoiceOptions}
          onChange={(val: string) => {
            const raw = String(val ?? "");
            updateZyphraConfig({
              preset_voice: raw === DEFAULT_VALUE ? undefined : raw,
            });
          }}
          style={{ minWidth: 220 }}
        >
          {presetVoiceOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </theme.Select>

        <theme.Input
          id="deepinfra-speech-zyphra-voice-id"
          label={t("providers:deepinfra.speech.voiceId")}
          placeholder={t("providers:deepinfra.speech.voiceIdPlaceholder")}
          value={zyphraConfig?.voice_id ?? ""}
          onChange={(e: any) => {
            const raw = String(e?.target?.value ?? "").trim();
            updateZyphraConfig({
              voice_id: raw.length ? raw : undefined,
            });
          }}
        />

        <theme.Select
          label={t("language")}
          values={[languageSelectValue]}
          valueTitle={languageOptions.find((o) => o.value === languageSelectValue)?.label}
          options={languageOptions}
          onChange={(val: string) => {
            const raw = String(val ?? "");
            updateZyphraConfig({
              language: raw === DEFAULT_VALUE ? undefined : raw,
            });
          }}
          style={{ minWidth: 220 }}
        >
          {languageOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </theme.Select>

        <div style={{ display: "flex", gap: 12, width: "100%" }}>
          <theme.Input
            id="deepinfra-speech-zyphra-speaker-rate"
            type="number"
            step={0.1}
            min={5}
            max={35}
            style={{ flex: 1 }}
            label={t("providers:deepinfra.speech.speakerRate")}
            value={zyphraConfig?.speaker_rate ?? ""}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              updateZyphraConfig({
                speaker_rate: raw.length ? Number(raw) : undefined,
              });
            }}
          />

          <theme.Input
            id="deepinfra-speech-zyphra-seed"
            type="number"
            step={1}
            min={0}
            max={2147483647}
            style={{ flex: 1 }}
            label={t("providers:deepinfra.speech.seed")}
            value={zyphraConfig?.seed ?? ""}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              updateZyphraConfig({
                seed: raw.length ? Number(raw) : undefined,
              });
            }}
          />
        </div>
      </div>
    </theme.Card>
  );
};
