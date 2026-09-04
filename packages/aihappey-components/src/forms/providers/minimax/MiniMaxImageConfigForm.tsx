import React from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../theme/ThemeContext";

/**
 * MiniMax image provider options.
 * Keys intentionally match the native MiniMax image generation request shape.
 */
export type MiniMaxImageConfig = {
  prompt_optimizer?: boolean;
};

export const MiniMaxImageConfigForm: React.FC<{
  config: MiniMaxImageConfig;
  updateConfig: (value: MiniMaxImageConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={t("general")}>
        <theme.Switch
          id="minimax-image-prompt-optimizer"
          checked={config.prompt_optimizer ?? false}
          label={t("providers:minimax.promptOptimizer")}
          hint={t("providers:minimax.promptOptimizerHint")}
          onChange={(prompt_optimizer: boolean) =>
            updateConfig({
              ...config,
              prompt_optimizer,
            })
          }
        />
      </theme.Card>
    </div>
  );
};
