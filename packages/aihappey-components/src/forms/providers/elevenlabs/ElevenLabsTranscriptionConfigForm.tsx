import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

export type ElevenLabsTranscriptionConfig = {
  enable_logging?: boolean;
  language_code?: string;
  tag_audio_events?: boolean;
  num_speakers?: number;

  /** none | word | character */
  timestamps_granularity?: "none" | "word" | "character";

  diarize?: boolean;
  diarization_threshold?: number;

  /** pcm_s16le_16 | other */
  file_format?: "pcm_s16le_16" | "other";

  temperature?: number;
  seed?: number;
  use_multi_channel?: boolean;
};

export type ElevenLabsRealtimeTranscriptionConfig = {
  /** Single-use token for authentication (client-side). If provided, xi-api-key is not required. */
  token?: string;

  /** Whether to receive committed_transcript_with_timestamps. */
  include_timestamps?: boolean;

  /** Whether to include detected language in committed_transcript_with_timestamps. */
  include_language_detection?: boolean;

  /** Audio encoding format for speech-to-text. */
  audio_format?:
  | "pcm_8000"
  | "pcm_16000"
  | "pcm_22050"
  | "pcm_24000"
  | "pcm_44100"
  | "pcm_48000"
  | "ulaw_8000";

  /** Language code in ISO 639-1 or ISO 639-3 format. */
  language_code?: string;

  /** Strategy for committing transcriptions. */
  commit_strategy?: "manual" | "vad";

  /** Silence threshold in seconds for VAD (0.3-3). */
  vad_silence_threshold_secs?: number;

  /** Threshold for voice activity detection (0.1-0.9). */
  vad_threshold?: number;

  /** Minimum speech duration in ms (50-2000). */
  min_speech_duration_ms?: number;

  /** Minimum silence duration in ms (50-2000). */
  min_silence_duration_ms?: number;

  /** When false, zero-retention mode is used (enterprise only). */
  enable_logging?: boolean;
};

export const ElevenLabsTranscriptionConfigForm: React.FC<{
  config: ElevenLabsTranscriptionConfig;
  updateConfig: (val: ElevenLabsTranscriptionConfig) => void;
  realtimeConfig?: ElevenLabsRealtimeTranscriptionConfig;
  updateRealtimeConfig?: (val: ElevenLabsRealtimeTranscriptionConfig) => void;
}> = ({ config, updateConfig, realtimeConfig, updateRealtimeConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const diarizeEnabled = config?.diarize === true;

  const timestampsGranularityOptions = [
    { value: "", label: t("providerDefault") },
    { value: "none", label: "none" },
    { value: "word", label: "word" },
    { value: "character", label: "character" },
  ];

  const fileFormatOptions = [
    { value: "", label: t("providerDefault") },
    { value: "pcm_s16le_16", label: "pcm_s16le_16" },
    { value: "other", label: "other" },
  ];

  const rt = (realtimeConfig ?? {}) as ElevenLabsRealtimeTranscriptionConfig;
  const updateRt = (patch: Partial<ElevenLabsRealtimeTranscriptionConfig>) => {
    if (!updateRealtimeConfig) return;
    updateRealtimeConfig({
      ...rt,
      ...patch,
    });
  };

  const realtimeAudioFormatOptions = [
    { value: "", label: t("providerDefault") },
    { value: "pcm_8000", label: "pcm_8000" },
    { value: "pcm_16000", label: "pcm_16000" },
    { value: "pcm_22050", label: "pcm_22050" },
    { value: "pcm_24000", label: "pcm_24000" },
    { value: "pcm_44100", label: "pcm_44100" },
    { value: "pcm_48000", label: "pcm_48000" },
    { value: "ulaw_8000", label: "ulaw_8000" },
  ];

  const commitStrategyOptions = [
    { value: "", label: t("providerDefault") },
    { value: "manual", label: "manual" },
    { value: "vad", label: "vad" },
  ];

  const setDiarize = (enabled: boolean) => {
    if (enabled) {
      updateConfig({
        ...config,
        diarize: true,
      });
      return;
    }

    // When diarization is disabled, also clear diarization-only parameters.
    updateConfig({
      ...config,
      diarize: undefined,
      diarization_threshold: undefined,
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      <theme.Card size="small" title={t("general")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Switch
            id="elevenlabs-transcription-enable-logging"
            label={t("providers:elevenlabs.enableLogging")}
            checked={config?.enable_logging ?? true}
            onChange={(enabled) => updateConfig({ ...config, enable_logging: enabled })}
          />

          <theme.Input
            label={t("language")}
            placeholder="ex. en"
            value={config?.language_code ?? ""}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              updateConfig({ ...config, language_code: raw ? raw : undefined });
            }}
          />

          <theme.Select
            label={t("providers:elevenlabs.fileFormat")}
            values={[config?.file_format ?? ""]}
            valueTitle={
              fileFormatOptions.find((o) => o.value === (config?.file_format ?? ""))?.label
            }
            options={fileFormatOptions}
            onChange={(val: string) =>
              updateConfig({
                ...config,
                file_format: (val?.trim() ? val : undefined) as any,
              })
            }
            style={{ minWidth: 220 }}
          >
            {fileFormatOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>

          {/* ElevenLabs temperature range is 0-2 (OpenAI TemperatureField is 0-1), so use slider. */}
          <theme.Slider
            label={t("temperature", {
              temperature: (config?.temperature ?? 0).toFixed(2),
            })}
            min={0}
            max={2}
            step={0.01}
            value={config?.temperature ?? 0}
            onChange={(temperature: number) =>
              updateConfig({
                ...config,
                temperature,
              })
            }
          />

          <theme.Input
            id="elevenlabs-transcription-seed"
            type="number"
            min={0}
            max={2147483647}
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

          <theme.Switch
            id="elevenlabs-transcription-tag-audio-events"
            label={t("providers:elevenlabs.tagAudioEvents")}
            checked={config?.tag_audio_events ?? true}
            onChange={(enabled) => updateConfig({ ...config, tag_audio_events: enabled })}
          />

          <theme.Switch
            id="elevenlabs-transcription-use-multi-channel"
            label={t("providers:elevenlabs.useMultiChannel")}
            checked={config?.use_multi_channel ?? false}
            onChange={(enabled) => updateConfig({ ...config, use_multi_channel: enabled })}
          />
        </div>
      </theme.Card>

      <theme.Card size="small" title={t("providers:elevenlabs.timestamps")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Select
            label={t("providers:elevenlabs.timestampsGranularity")}
            values={[config?.timestamps_granularity ?? ""]}
            valueTitle={
              timestampsGranularityOptions.find(
                (o) => o.value === (config?.timestamps_granularity ?? "")
              )?.label
            }
            options={timestampsGranularityOptions}
            onChange={(val: string) =>
              updateConfig({
                ...config,
                timestamps_granularity: (val?.trim() ? val : undefined) as any,
              })
            }
            style={{ minWidth: 220 }}
          >
            {timestampsGranularityOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={t("providers:elevenlabs.diarization")}
        headerActions={
          <theme.Switch
            id="elevenlabs-transcription-diarize"
            checked={diarizeEnabled}
            onChange={setDiarize}
          />
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Input
            id="elevenlabs-transcription-num-speakers"
            type="number"
            min={1}
            max={32}
            step={1}
            disabled={!diarizeEnabled}
            label={t("providers:elevenlabs.numSpeakers")}
            value={config?.num_speakers ?? ""}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              updateConfig({
                ...config,
                num_speakers: raw.length ? Number(raw) : undefined,
              });
            }}
          />

          <theme.Slider
            label={t("providers:elevenlabs.diarizationThreshold", {
              value: (config?.diarization_threshold ?? 0.22).toFixed(2),
            })}
            min={0.1}
            max={0.4}
            step={0.01}
            value={config?.diarization_threshold ?? 0.22}
            onChange={(value: number) =>
              updateConfig({
                ...config,
                diarization_threshold: value,
              })
            }
            disabled={!diarizeEnabled}
          />
        </div>
      </theme.Card>


      <theme.Card size="small" title={t("realtime")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Switch
            id="elevenlabs-realtime-include-timestamps"
            label={t("providers:elevenlabs.realtimeIncludeTimestamps")}
            checked={rt?.include_timestamps ?? false}
            onChange={(enabled) => updateRt({ include_timestamps: !!enabled })}
          />

          <theme.Switch
            id="elevenlabs-realtime-include-language-detection"
            label={t("providers:elevenlabs.realtimeIncludeLanguageDetection")}
            checked={rt?.include_language_detection ?? false}
            onChange={(enabled) => updateRt({ include_language_detection: !!enabled })}
          />

          <theme.Select
            label={t("providers:elevenlabs.realtimeAudioFormat")}
            values={[rt?.audio_format ?? ""]}
            valueTitle={
              realtimeAudioFormatOptions.find((o) => o.value === (rt?.audio_format ?? ""))?.label
            }
            options={realtimeAudioFormatOptions}
            onChange={(val: string) => {
              const raw = String(val ?? "").trim();
              updateRt({ audio_format: (raw.length ? raw : undefined) as any });
            }}
            style={{ minWidth: 220 }}
          >
            {realtimeAudioFormatOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>

          <theme.Input
            id="elevenlabs-realtime-language-code"
            label={t("language")}
            placeholder="ex. en"
            value={rt?.language_code ?? ""}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              updateRt({ language_code: raw.length ? raw : undefined });
            }}
          />

          <theme.Select
            label={t("providers:elevenlabs.realtimeCommitStrategy")}
            values={[rt?.commit_strategy ?? ""]}
            valueTitle={
              commitStrategyOptions.find((o) => o.value === (rt?.commit_strategy ?? ""))?.label
            }
            options={commitStrategyOptions}
            onChange={(val: string) => {
              const raw = String(val ?? "").trim();
              updateRt({ commit_strategy: (raw.length ? raw : undefined) as any });
            }}
            style={{ minWidth: 220 }}
          >
            {commitStrategyOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>

          <theme.Input
            id="elevenlabs-realtime-vad-silence-threshold-secs"
            type="number"
            min={0.3}
            max={3}
            step={0.1}
            label={t("providers:elevenlabs.realtimeVadSilenceThresholdSecs")}
            value={rt?.vad_silence_threshold_secs ?? ""}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              updateRt({ vad_silence_threshold_secs: raw.length ? Number(raw) : undefined });
            }}
          />

          <theme.Input
            id="elevenlabs-realtime-vad-threshold"
            type="number"
            min={0.1}
            max={0.9}
            step={0.05}
            label={t("providers:elevenlabs.realtimeVadThreshold")}
            value={rt?.vad_threshold ?? ""}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              updateRt({ vad_threshold: raw.length ? Number(raw) : undefined });
            }}
          />

          <theme.Input
            id="elevenlabs-realtime-min-speech-duration-ms"
            type="number"
            min={50}
            max={2000}
            step={50}
            label={t("providers:elevenlabs.realtimeMinSpeechDurationMs")}
            value={rt?.min_speech_duration_ms ?? ""}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              updateRt({ min_speech_duration_ms: raw.length ? Number(raw) : undefined });
            }}
          />

          <theme.Input
            id="elevenlabs-realtime-min-silence-duration-ms"
            type="number"
            min={50}
            max={2000}
            step={50}
            label={t("providers:elevenlabs.realtimeMinSilenceDurationMs")}
            value={rt?.min_silence_duration_ms ?? ""}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              updateRt({ min_silence_duration_ms: raw.length ? Number(raw) : undefined });
            }}
          />

          <theme.Switch
            id="elevenlabs-realtime-enable-logging"
            label={t("providers:elevenlabs.enableLogging")}
            checked={rt?.enable_logging ?? true}
            onChange={(enabled) => updateRt({ enable_logging: !!enabled })}
          />
        </div>
      </theme.Card>


    </div>
  );
};

