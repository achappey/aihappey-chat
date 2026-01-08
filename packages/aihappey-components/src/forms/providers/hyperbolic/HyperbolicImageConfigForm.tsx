import React, { ChangeEvent } from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

export type HyperbolicImageConfig = {
  steps?: number;
  cfg_scale?: number;
  negative_prompt?: string;
};

export const HyperbolicImageConfigForm: React.FC<{
  config: HyperbolicImageConfig;
  updateConfig: (val: HyperbolicImageConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={t("general")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Input
            id="hyperbolic-steps"
            type="number"
            max={100}
            value={config?.steps}
            label={t("providers:hyperbolic.steps")}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updateConfig({
                ...config,
                steps: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />

          <theme.Input
            id="hyperbolic-guidance-scale"
            type="number"
            step={0.5}
            max={10}
            value={config?.cfg_scale}
            label={t("providers:hyperbolic.guidanceScale")}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updateConfig({
                ...config,
                cfg_scale: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />

          <theme.TextArea
            value={config?.negative_prompt ?? ""}
            label={t("providers:hyperbolic.negativePrompt")}
            onChange={(val: string) =>
              updateConfig({
                ...config,
                negative_prompt: val,
              })
            }
          />
        </div>
      </theme.Card>
    </div>
  );
};

