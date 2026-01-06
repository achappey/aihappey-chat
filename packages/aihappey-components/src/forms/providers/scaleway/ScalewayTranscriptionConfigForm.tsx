import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import { TemperatureField } from "../../../fields";

export type ScalewayTranscriptionConfig = {
  language?: string;
  prompt?: string;

  /**
   * Controls sampling randomness for transcription.
   * When undefined, provider default is used.
   */
  temperature?: number;


};

export const ScalewayTranscriptionConfigForm: React.FC<{
  config: ScalewayTranscriptionConfig;
  updateConfig: (val: ScalewayTranscriptionConfig) => void;
}> = ({
  config,
  updateConfig,
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
      </div>
    );
  };
