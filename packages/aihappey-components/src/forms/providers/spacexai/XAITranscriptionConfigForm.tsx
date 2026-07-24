import React, { ChangeEvent } from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../theme/ThemeContext";

const DEFAULT_VALUE = "";

const AUDIO_FORMATS = [
  "pcm",
  "mulaw",
  "alaw",
  "wav",
  "mp3",
  "ogg",
  "opus",
  "flac",
  "aac",
  "mp4",
  "m4a",
  "mkv",
] as const;

const SAMPLE_RATES = ["8000", "16000", "22050", "24000", "44100", "48000"] as const;

type XAIAudioFormat = (typeof AUDIO_FORMATS)[number];
type XAISampleRate = (typeof SAMPLE_RATES)[number];
type XAIStringBoolean = "true" | "false";

/**
 * UI config bucket for xAI transcription metadata: `providerTranscriptionMetadata.xai`.
 * Keys intentionally match the official `/v1/stt` multipart field names.
 */
export type XAITranscriptionConfig = {
  /** Only required for raw/headerless audio. Container formats are auto-detected by xAI. */
  audio_format?: XAIAudioFormat;

  /** Required when `audio_format` is `pcm`, `mulaw`, or `alaw`. */
  sample_rate?: XAISampleRate;

  /** Language code for the audio, for example `en`, `fr`, `de`, or `ja`. */
  language?: string;

  /** Official xAI string boolean field. Requires `language` when set to `true`. */
  format?: XAIStringBoolean;

  /** Official xAI string boolean field for per-channel transcription. */
  multichannel?: XAIStringBoolean;

  /** Required for multichannel raw audio. xAI supports 2 through 8 channels. */
  channels?: number;

  /** Official xAI string boolean field for speaker diarization. */
  diarize?: XAIStringBoolean;

  /** Comma-separated xAI transcription-bias terms. The backend expands this for multipart requests. */
  keyterm?: string;

  /** Official xAI string boolean field for including filler words in the transcript. */
  filler_words?: XAIStringBoolean;

  /** xAI voice-activity detection threshold, from 0 (disabled) through 1. */
  vad_threshold?: number;
};

const rawFormats = new Set<string>(["pcm", "mulaw", "alaw"]);

export const XAITranscriptionConfigForm: React.FC<{
  config: XAITranscriptionConfig;
  updateConfig: (val: XAITranscriptionConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const audioFormatValue = config?.audio_format ?? DEFAULT_VALUE;
  const sampleRateValue = config?.sample_rate ?? DEFAULT_VALUE;
  const isRawAudio = rawFormats.has(audioFormatValue);
  const hasLanguage = !!config?.language?.trim();
  const multichannelEnabled = config?.multichannel === "true";

  const audioFormatOptions = [
    { value: DEFAULT_VALUE, label: t("providerDefault") },
    ...AUDIO_FORMATS.map((value) => ({ value, label: value })),
  ];

  const sampleRateOptions = [
    { value: DEFAULT_VALUE, label: t("providerDefault") },
    ...SAMPLE_RATES.map((value) => ({ value, label: value })),
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card
        size="small"
        title={t("general")}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Input
            label={t("language")}
            placeholder={t("providers:openai.transcriptionLanguagePlaceholder")}
            value={config?.language ?? ""}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const language = String(e.target.value ?? "").trim();
              updateConfig({
                ...config,
                language: language || undefined,
                format: language ? config?.format : undefined,
              });
            }}
          />

          <theme.Switch
            id="xai-transcription-format"
            label={t("providers:spacexai.transcriptionFormat")}
            disabled={!hasLanguage}
            checked={config?.format === "true"}
            onChange={(enabled) =>
              updateConfig({
                ...config,
                format: enabled ? "true" : "false",
              })
            }
          />

          <theme.Switch
            id="xai-transcription-diarize"
            label={t("providers:spacexai.transcriptionDiarize")}
            checked={config?.diarize === "true"}
            onChange={(enabled) =>
              updateConfig({
                ...config,
                diarize: enabled ? "true" : "false",
              })
            }
          />

          <theme.Switch
            id="xai-transcription-filler-words"
            label={t("providers:spacexai.transcriptionFillerWords")}
            checked={config?.filler_words === "true"}
            onChange={(enabled) =>
              updateConfig({
                ...config,
                filler_words: enabled ? "true" : "false",
              })
            }
          />

          <theme.Slider
            label={t("providers:spacexai.transcriptionVadThreshold", {
              value: config?.vad_threshold ?? 0.5,
            })}
            min={0}
            max={1}
            step={0.01}
            value={config?.vad_threshold ?? 0.5}
            onChange={(vad_threshold: number) =>
              updateConfig({
                ...config,
                vad_threshold,
              })
            }
          />

          <theme.TextArea
            rows={3}
            label={t("providers:spacexai.transcriptionKeyterm")}
            placeholder={t("providers:spacexai.transcriptionKeytermPlaceholder")}
            value={config?.keyterm ?? ""}
            onChange={(value: string) => {
              const keyterm = String(value ?? "");
              updateConfig({
                ...config,
                keyterm: keyterm || undefined,
              });
            }}
          />
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={t("providers:spacexai.audioInput")}
        
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Select
            label={t("providers:spacexai.audioFormat")}
            values={[audioFormatValue]}
            valueTitle={
              audioFormatOptions.find((option) => option.value === audioFormatValue)?.label ??
              t("providerDefault")
            }
            options={audioFormatOptions}
            onChange={(value: string) => {
              const audio_format = value ? (value as XAIAudioFormat) : undefined;
              updateConfig({
                ...config,
                audio_format,
                sample_rate: audio_format && rawFormats.has(audio_format)
                  ? config?.sample_rate
                  : undefined,
                channels: audio_format && rawFormats.has(audio_format) && multichannelEnabled
                  ? config?.channels
                  : undefined,
              });
            }}
            style={{ minWidth: 220 }}
          >
            {audioFormatOptions.map((option) => (
              <option key={option.value || "__default__"} value={option.value}>
                {option.label}
              </option>
            ))}
          </theme.Select>

          <theme.Select
            label={t("providers:spacexai.sampleRate")}
            disabled={!isRawAudio}
            values={[sampleRateValue]}
            valueTitle={
              sampleRateOptions.find((option) => option.value === sampleRateValue)?.label ??
              t("providerDefault")
            }
            options={sampleRateOptions}
            onChange={(value: string) =>
              updateConfig({
                ...config,
                sample_rate: value ? (value as XAISampleRate) : undefined,
              })
            }
            style={{ minWidth: 220 }}
          >
            {sampleRateOptions.map((option) => (
              <option key={option.value || "__default__"} value={option.value}>
                {option.label}
              </option>
            ))}
          </theme.Select>
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={t("providers:spacexai.channels")}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Switch
            id="xai-transcription-multichannel"
            label={t("providers:spacexai.transcriptionMultichannel")}
            checked={multichannelEnabled}
            onChange={(enabled) =>
              updateConfig({
                ...config,
                multichannel: enabled ? "true" : "false",
                channels: enabled && isRawAudio ? config?.channels : undefined,
              })
            }
          />

          <theme.Input
            id="xai-transcription-channels"
            type="number"
            min={2}
            max={8}
            step={1}
            disabled={!multichannelEnabled || !isRawAudio}
            label={t("providers:spacexai.channelCount")}
            value={config?.channels ?? ""}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const raw = e.target.value;
              updateConfig({
                ...config,
                channels: raw ? Number(raw) : undefined,
              });
            }}
          />
        </div>
      </theme.Card>
    </div>
  );
};

