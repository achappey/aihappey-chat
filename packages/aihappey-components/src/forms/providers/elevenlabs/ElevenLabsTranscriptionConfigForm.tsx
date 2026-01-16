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

export const ElevenLabsTranscriptionConfigForm: React.FC<{
  config: ElevenLabsTranscriptionConfig;
  updateConfig: (val: ElevenLabsTranscriptionConfig) => void;
}> = ({ config, updateConfig }) => {
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
    </div>
  );
};

