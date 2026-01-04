import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { languageNames, useTranslation } from "aihappey-i18n";

export type OpenAIITranscriptionConfig = {
  language?: string;
  prompt?: string;

};

export const OpenAIITranscriptionConfigForm: React.FC<{
  config: OpenAIITranscriptionConfig;
  updateConfig: (val: OpenAIITranscriptionConfig) => void;
}> = ({ config, updateConfig }) => {
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
