import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import { TemperatureField } from "../../../fields";

export type GroqTranscriptionConfig = {
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

};

export const GroqTranscriptionConfigForm: React.FC<{
  config: GroqTranscriptionConfig;
  updateConfig: (val: GroqTranscriptionConfig) => void;
}> = ({
  config,
  updateConfig,
}) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const timestampGranularitiesEnabled = config?.timestamp_granularities != null;

    const normalizeGranularities = (val: unknown): Array<"segment" | "word"> => {
      const raw = Array.isArray(val) ? val : [];
      const set = new Set<"segment" | "word">();
      for (const v of raw) {
        if (v === "segment" || v === "word") set.add(v);
      }
      // keep a stable order in UI + persisted config
      const ordered: Array<"segment" | "word"> = [];
      if (set.has("segment")) ordered.push("segment");
      if (set.has("word")) ordered.push("word");
      return ordered;
    };

    const effectiveGranularities: Array<"segment" | "word"> = timestampGranularitiesEnabled
      ? (() => {
        const normalized = normalizeGranularities(config?.timestamp_granularities);
        return normalized.length ? normalized : ["segment"];
      })()
      : [];

    const toggleGranularity = (g: "segment" | "word", enabled: boolean) => {
      const current = normalizeGranularities(config?.timestamp_granularities);
      const next = enabled
        ? normalizeGranularities([...current, g])
        : normalizeGranularities(current.filter((x) => x !== g));

      // enforce at least one selection when custom is enabled
      updateConfig({
        ...config,
        timestamp_granularities: (next.length ? next : ["segment"]) as Array<
          "segment" | "word"
        >,
      });
    };

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

        <theme.Card title={t("providers:openai.timestampGranularities")}
          headerActions={<theme.Switch
            id="openai-transcription-timestamp-granularities"
            checked={timestampGranularitiesEnabled}
            onChange={(enabled) =>
              updateConfig({
                ...config,
                timestamp_granularities: enabled
                  ? ((normalizeGranularities(config?.timestamp_granularities)
                    .length
                    ? normalizeGranularities(config?.timestamp_granularities)
                    : ["segment"]) as Array<"segment" | "word">)
                  : undefined,
              })
            }
          />}>

          <div>
            <theme.Switch
              id="openai-transcription-timestamp-segment"
              disabled={!timestampGranularitiesEnabled}
              checked={effectiveGranularities.includes("segment")}
              label={t("providers:openai.timestampGranularitiesSegment")}
              onChange={(enabled) => toggleGranularity("segment", enabled)}
            />

            <theme.Switch
              id="openai-transcription-timestamp-word"
              disabled={!timestampGranularitiesEnabled}
              checked={effectiveGranularities.includes("word")}
              label={t("providers:openai.timestampGranularitiesWord")}
              onChange={(enabled) => toggleGranularity("word", enabled)}
            />
          </div>

        </theme.Card>
      </div>
    );
  };
