import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import { TemperatureField } from "../../../fields";
import { TimestampGranularitiesForm } from "../../settings/transcriptions/TimestampGranularitiesForm";

export type MistralTranscriptionConfig = {
  /** Optional override of detected language (ISO-639-1). */
  language?: string;

  /** Optional prompt to guide transcription style. */
  prompt?: string;

  /** Controls sampling randomness for transcription (provider default when undefined). */
  temperature?: number;

  /** Mistral supports timestamps at segment granularity only. */
  timestamp_granularities?: Array<"segment">;
};

/**
 * Mistral constraint (per docs): `timestamp_granularities` is not compatible with `language`.
 * This form auto-resolves the conflict:
 * - enabling timestamps clears `language`
 * - setting `language` clears `timestamp_granularities`
 */
export const MistralTranscriptionConfigForm: React.FC<{
  config: MistralTranscriptionConfig;
  updateConfig: (val: MistralTranscriptionConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const timestampsEnabled = config?.timestamp_granularities != null;
  const languageEnabled = (config?.language ?? "").trim().length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={t("general")}>
        <div>
          <theme.Input
            label={t("language")}
            disabled={config.timestamp_granularities != undefined}
            placeholder={t("providers:openai.transcriptionLanguagePlaceholder")}
            value={config?.language ?? ""}
            onChange={(val) => {
              const nextLanguage = val.target.value?.trim();
              updateConfig({
                ...config,
                language: nextLanguage && nextLanguage.length > 0 ? nextLanguage : undefined,
                // Auto-resolve: language is not compatible with timestamps.
                timestamp_granularities:
                  nextLanguage && nextLanguage.length > 0 ? undefined : config?.timestamp_granularities,
              });
            }}
          />
        </div>
      </theme.Card>

      <TimestampGranularitiesForm
        idPrefix="mistral-transcription-timestamp"
        // Mistral only supports `segment` timestamps.
        supportedGranularities={["segment"]}
        value={timestampsEnabled ? (["segment"] as Array<"segment">) : undefined}
        enabled={timestampsEnabled}
        selected={timestampsEnabled ? (["segment"] as Array<"segment">) : []}
        // We keep the segment toggle locked on (only enable/disable timestamps overall).
        disableSegmentToggle={true}
        onChange={(timestamp_granularities) => {
          const enabled = timestamp_granularities != null;
          updateConfig({
            ...config,
            // Auto-resolve: enabling timestamps clears language.
            language: enabled ? undefined : config?.language,
            timestamp_granularities: enabled ? (["segment"] as Array<"segment">) : undefined,
          });
        }}
        onToggleEnabled={(enabled) => {
          updateConfig({
            ...config,
            language: enabled ? undefined : config?.language,
            timestamp_granularities: enabled ? (["segment"] as Array<"segment">) : undefined,
          });
        }}
        onToggleGranularity={() => {
          // No-op: only `segment` supported and it is locked on.
        }}
      />
    </div>
  );
};

