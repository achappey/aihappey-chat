import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import { KnownSpeakersCard } from "./known-speakers";
import type { KnownSpeakerSampleHandlers } from "./known-speakers/KnownSpeakersCard";
import { TemperatureField } from "../../../fields";
import { TimestampGranularitiesForm } from "../../settings/transcriptions/TimestampGranularitiesForm";

export type OpenAIITranscriptionConfig = {
  language?: string;
  prompt?: string;

  /**
   * Controls sampling randomness for transcription.
   * When undefined, provider default is used.
   */
  temperature?: number;

  /**
   * Timestamp granularities to populate.
   * OpenAI requires response_format=verbose_json for these to have effect.
   * When undefined, provider default is used.
   */
  timestamp_granularities?: Array<"word" | "segment">;

  /**
   * Optional list of speaker names used for known speaker diarization.
   * Samples are stored in FILES by name mapping (no IDs stored here).
   */
  known_speaker_names?: string[];

};

export const OpenAIITranscriptionConfigForm: React.FC<{
  config: OpenAIITranscriptionConfig;
  updateConfig: (val: OpenAIITranscriptionConfig) => void;
} & KnownSpeakerSampleHandlers> = ({
  config,
  updateConfig,
  getSampleInfo,
  onUploadSample,
  onClearSample,
  onRenameSample,
  onPreviewSample,
}) => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <theme.Card size="small" title={t("general")}>
          <div>
            <theme.Input
              label={t("language")}
              placeholder={t("providers:openai.transcriptionLanguagePlaceholder")}
              value={config?.language ?? ""}
              onChange={(val) =>
                updateConfig({
                  ...config,
                  language: val.target.value && val.target.value.length > 0 ? val.target.value : undefined,
                })
              }
            >
            </theme.Input>

            <TemperatureField
              value={config?.temperature ?? 0}
              onChange={(temperature) =>
                updateConfig({
                  ...config,
                  temperature,
                })
              }
            />

            <theme.TextArea
              label={t("providers:openai.prompt")}
              placeholder={t(
                "providers:openai.speechPromptPlaceholder"
              )}
              rows={5}
              value={config?.prompt ?? ""}
              onChange={(value) =>
                updateConfig({
                  ...config,
                  prompt: value,
                })
              }
            />


          </div>
        </theme.Card>

        <TimestampGranularitiesForm
          idPrefix="openai-transcription-timestamp"
          value={config?.timestamp_granularities}
          onChange={(timestamp_granularities) =>
            updateConfig({
              ...config,
              timestamp_granularities,
            })
          }
        />

        <KnownSpeakersCard
          config={config}
          updateConfig={updateConfig}
          getSampleInfo={getSampleInfo}
          onUploadSample={onUploadSample}
          onClearSample={onClearSample}
          onRenameSample={onRenameSample}
          onPreviewSample={onPreviewSample}
        />
      </div>
    );
  };
