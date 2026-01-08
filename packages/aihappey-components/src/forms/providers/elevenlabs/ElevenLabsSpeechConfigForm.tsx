import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

export type ElevenLabsVoiceSettings = {
  stability?: number;
  similarity_boost?: number;
  style?: number;
  use_speaker_boost?: boolean;
};

export type ElevenLabsSpeechConfig = {
  /** Voice ID (path param in ElevenLabs API). */
  voice?: string;

  /** Query-string `output_format` e.g. `mp3_44100_128`. */
  output_format?: string;

  enable_logging?: boolean;
  seed?: number;
  voice_settings?: ElevenLabsVoiceSettings;
  previous_text?: string;
  next_text?: string;

  /** auto | on | off */
  apply_text_normalization?: "auto" | "on" | "off";
  apply_language_text_normalization?: boolean;
};

export const ElevenLabsSpeechConfigForm: React.FC<{
  config: ElevenLabsSpeechConfig;
  updateConfig: (val: ElevenLabsSpeechConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const DEFAULT_VALUE = "__default__";

  // Allowlist from ElevenLabs docs.
  const ALLOWED_OUTPUT_FORMATS = [
    "mp3_22050_32",
    "mp3_24000_48",
    "mp3_44100_32",
    "mp3_44100_64",
    "mp3_44100_96",
    "mp3_44100_128",
    "mp3_44100_192",
    "pcm_8000",
    "pcm_16000",
    "pcm_22050",
    "pcm_24000",
    "pcm_32000",
    "pcm_44100",
    "pcm_48000",
    "ulaw_8000",
    "alaw_8000",
    "opus_48000_32",
    "opus_48000_64",
    "opus_48000_96",
    "opus_48000_128",
    "opus_48000_192",
  ] as const;

  const isAllowedOutputFormat = (v?: string) =>
    !!v && (ALLOWED_OUTPUT_FORMATS as readonly string[]).includes(v);

  // If an unsupported value is already present, keep it in config untouched,
  // but show Provider default in the select until the user changes it.
  const outputFormatSelectValue = !config?.output_format
    ? DEFAULT_VALUE
    : isAllowedOutputFormat(config.output_format)
      ? (config.output_format as string)
      : DEFAULT_VALUE;

  const outputFormatOptions = [
    { value: DEFAULT_VALUE, label: t("providerDefault") },
    ...ALLOWED_OUTPUT_FORMATS.map((v) => ({ value: v, label: v })),
  ];

  const applyTextNormalizationOptions = [
    { value: DEFAULT_VALUE, label: t("providerDefault") },
    { value: "auto", label: "auto" },
    { value: "on", label: "on" },
    { value: "off", label: "off" },
  ];

  const voiceSettings = config?.voice_settings ?? {};
  const updateVoiceSettings = (next: Partial<ElevenLabsVoiceSettings>) =>
    updateConfig({
      ...config,
      voice_settings: {
        ...voiceSettings,
        ...next,
      },
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={t("general")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Input
            label={t("speechSettings.voice")}
            placeholder="ex. JBFqnCBsd6RMkjVDRZzb"
            value={config?.voice ?? ""}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              updateConfig({ ...config, voice: raw ? raw : undefined });
            }}
          />

          <theme.Select
            label={t("speechSettings.outputFormat")}
            values={[outputFormatSelectValue]}
            valueTitle={
              outputFormatOptions.find((o) => o.value === outputFormatSelectValue)?.label
            }
            options={outputFormatOptions}
            onChange={(val: string) => {
              const raw = String(val ?? "");

              if (raw === DEFAULT_VALUE) {
                updateConfig({ ...config, output_format: undefined });
                return;
              }

              updateConfig({ ...config, output_format: raw });
            }}
            style={{ minWidth: 220 }}
          >
            {outputFormatOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>

          <theme.Switch
            id="elevenlabs-speech-enable-logging"
            label={t("providers:elevenlabs.enableLogging")}
            checked={config?.enable_logging ?? true}
            onChange={(enabled) => updateConfig({ ...config, enable_logging: enabled })}
          />

          <theme.Input
            id="elevenlabs-speech-seed"
            type="number"
            min={0}
            max={4294967295}
            step={1}
            label={t("providers:elevenlabs.seed")}
            value={config?.seed ?? ""}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              updateConfig({
                ...config,
                seed: raw.length ? Number(raw) : undefined,
              });
            }}
          />
        </div>
      </theme.Card>

      <theme.Card size="small" title={t("providers:elevenlabs.voiceSettings")}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Slider
            label={t("providers:elevenlabs.stability", {
              value: (voiceSettings?.stability ?? 0.5).toFixed(2),
            })}
            min={0}
            max={1}
            step={0.01}
            value={voiceSettings?.stability ?? 0.5}
            onChange={(value: number) => updateVoiceSettings({ stability: value })}
          />

          <theme.Slider
            label={t("providers:elevenlabs.similarityBoost", {
              value: (voiceSettings?.similarity_boost ?? 0.75).toFixed(2),
            })}
            min={0}
            max={1}
            step={0.01}
            value={voiceSettings?.similarity_boost ?? 0.75}
            onChange={(value: number) => updateVoiceSettings({ similarity_boost: value })}
          />

          <theme.Slider
            label={t("providers:elevenlabs.style", {
              value: (voiceSettings?.style ?? 0).toFixed(2),
            })}
            min={0}
            max={1}
            step={0.01}
            value={voiceSettings?.style ?? 0}
            onChange={(value: number) => updateVoiceSettings({ style: value })}
          />

          <theme.Switch
            id="elevenlabs-speech-use-speaker-boost"
            label={t("providers:elevenlabs.useSpeakerBoost")}
            checked={voiceSettings?.use_speaker_boost ?? false}
            onChange={(enabled) => updateVoiceSettings({ use_speaker_boost: enabled })}
          />
        </div>
      </theme.Card>

      <theme.Card size="small" title={t("providers:elevenlabs.continuity")}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.TextArea
            label={t("providers:elevenlabs.previousText")}
            rows={3}
            value={config?.previous_text ?? ""}
            onChange={(value: string) =>
              updateConfig({
                ...config,
                previous_text: value?.trim()?.length ? value : undefined,
              })
            }
          />

          <theme.TextArea
            label={t("providers:elevenlabs.nextText")}
            rows={3}
            value={config?.next_text ?? ""}
            onChange={(value: string) =>
              updateConfig({
                ...config,
                next_text: value?.trim()?.length ? value : undefined,
              })
            }
          />
        </div>
      </theme.Card>

      <theme.Card size="small" title={t("providers:elevenlabs.textNormalization")}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Select
            label={t("providers:elevenlabs.applyTextNormalization")}
            values={[config?.apply_text_normalization ?? DEFAULT_VALUE]}
            valueTitle={
              applyTextNormalizationOptions.find(
                (o) => o.value === (config?.apply_text_normalization ?? DEFAULT_VALUE)
              )?.label
            }
            options={applyTextNormalizationOptions}
            onChange={(val: string) => {
              const raw = String(val ?? "");
              updateConfig({
                ...config,
                apply_text_normalization:
                  raw === DEFAULT_VALUE ? undefined : (raw as any),
              });
            }}
            style={{ minWidth: 220 }}
          >
            {applyTextNormalizationOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>

          <theme.Switch
            id="elevenlabs-speech-apply-language-text-normalization"
            label={t("providers:elevenlabs.applyLanguageTextNormalization")}
            checked={config?.apply_language_text_normalization ?? false}
            onChange={(enabled) =>
              updateConfig({
                ...config,
                apply_language_text_normalization: enabled,
              })
            }
          />
        </div>
      </theme.Card>
    </div>
  );
};

