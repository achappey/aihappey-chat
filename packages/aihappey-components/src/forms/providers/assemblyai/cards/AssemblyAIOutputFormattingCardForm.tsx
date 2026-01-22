import React from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type { AssemblyAITranscriptionConfig } from "../types";

export const AssemblyAIOutputFormattingCardForm: React.FC<{
  config: AssemblyAITranscriptionConfig;
  updateConfig: (val: AssemblyAITranscriptionConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <theme.Card size="small" title={t("providers:assemblyai.outputFormatting")}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <theme.Switch
          id="assemblyai-punctuate"
          label={t("providers:assemblyai.punctuate")}
          checked={config?.punctuate ?? true}
          onChange={(enabled) => updateConfig({ ...config, punctuate: !!enabled })}
        />
        <theme.Switch
          id="assemblyai-format-text"
          label={t("providers:assemblyai.formatText")}
          checked={config?.format_text ?? true}
          onChange={(enabled) => updateConfig({ ...config, format_text: !!enabled })}
        />
        <theme.Switch
          id="assemblyai-disfluencies"
          label={t("providers:assemblyai.disfluencies")}
          checked={config?.disfluencies ?? false}
          onChange={(enabled) => updateConfig({ ...config, disfluencies: !!enabled })}
        />
      </div>
    </theme.Card>
  );
};

