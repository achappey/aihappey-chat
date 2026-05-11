import React from "react";

import { TemperatureField } from "../../../fields";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

/**
 * IMPORTANT: keys must match Cohere `/v2/audio/transcriptions` multipart field names.
 * `model` and `file` are supplied outside of provider metadata.
 */
export type CohereTranscriptionConfig = {
  /** ISO-639-1 language code expected by Cohere, e.g. `en`. */
  language?: string;

  /** Sampling temperature between 0 and 1. */
  temperature?: number;
};

export const CohereTranscriptionConfigForm: React.FC<{
  config: CohereTranscriptionConfig;
  updateConfig: (val: CohereTranscriptionConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={t("general") ?? "General"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Input
            required
            label={t("language")}
            placeholder={t("providers:openai.transcriptionLanguagePlaceholder")}
            value={config?.language ?? ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const language = e.target.value.trim();
              updateConfig({
                ...config,
                language: language.length > 0 ? language : undefined,
              });
            }}
          />

          <TemperatureField
            value={config?.temperature ?? 0}
            onChange={(temperature) =>
              updateConfig({
                ...config,
                temperature,
              })
            }
          />
        </div>
      </theme.Card>
    </div>
  );
};

