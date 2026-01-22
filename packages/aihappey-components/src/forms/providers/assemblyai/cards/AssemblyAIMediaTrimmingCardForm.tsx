import React from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type { AssemblyAITranscriptionConfig } from "../types";
import { parseOptionalInt } from "../fields/shared";

export const AssemblyAIMediaTrimmingCardForm: React.FC<{
  config: AssemblyAITranscriptionConfig;
  updateConfig: (val: AssemblyAITranscriptionConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <theme.Card size="small" title={t("providers:assemblyai.mediaTrimming")}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <theme.Input
          id="assemblyai-audio-start-from"
          type="number"
          min={0}
          step={1}
          label={t("providers:assemblyai.audioStartFrom")}
          value={config?.audio_start_from ?? ""}
          onChange={(e: any) =>
            updateConfig({
              ...config,
              audio_start_from: parseOptionalInt(e?.target?.value),
            })
          }
        />

        <theme.Input
          id="assemblyai-audio-end-at"
          type="number"
          min={0}
          step={1}
          label={t("providers:assemblyai.audioEndAt")}
          value={config?.audio_end_at ?? ""}
          onChange={(e: any) =>
            updateConfig({
              ...config,
              audio_end_at: parseOptionalInt(e?.target?.value),
            })
          }
        />
      </div>
    </theme.Card>
  );
};

