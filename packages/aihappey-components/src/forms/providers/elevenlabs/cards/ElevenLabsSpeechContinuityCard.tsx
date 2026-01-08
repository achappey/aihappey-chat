import React from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type { ElevenLabsSpeechConfig } from "../ElevenLabsSpeechConfigForm";

export const ElevenLabsSpeechContinuityCard: React.FC<{
  config: ElevenLabsSpeechConfig;
  updateConfig: (val: ElevenLabsSpeechConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <theme.Card size="small" title={t("providers:elevenlabs.continuity")}>
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
  );
};

