import React from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type { MiniMaxSpeechConfig } from "../MiniMaxSpeechConfigForm";

export const MiniMaxSpeechMusicCard: React.FC<{
  config: MiniMaxSpeechConfig;
  updateConfig: (val: MiniMaxSpeechConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <theme.Card size="small" title={t("providers:minimax.music")}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <theme.TextArea
          label={t("providers:minimax.lyrics")}
          rows={5}
          value={config?.lyrics ?? ""}
          onChange={(value: string) => {
            const next = String(value ?? "");
            updateConfig({
              ...config,
              lyrics: next.trim().length ? next : undefined,
            });
          }}
        />
      </div>
    </theme.Card>
  );
};

