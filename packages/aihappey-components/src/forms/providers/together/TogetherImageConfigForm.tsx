import React, { ChangeEvent } from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

export type TogetherImageConfig = {
  steps?: number;
  guidance_scale?: number;
  disable_safety_checker?: boolean;
  negative_prompt?: string;
};

export const TogetherImageConfigForm: React.FC<{
  config: TogetherImageConfig;
  updateConfig: (val: TogetherImageConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={t("general")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Input
            id="together-steps"
            type="number"
            max={100}
            value={config?.steps}
            label={t("providers:together.steps")}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updateConfig({
                ...config,
                steps: e.target.value
                  ? Number(e.target.value)
                  : undefined,
              })
            }
          />

          <theme.Input
            id="together-guidance-scale"
            type="number"
            step={0.5}
            max={10}
            value={config?.guidance_scale}
            label={t("providers:together.guidanceScale")}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updateConfig({
                ...config,
                guidance_scale: e.target.value
                  ? Number(e.target.value)
                  : undefined,
              })
            }
          />

          <theme.Switch
            id="together-disable-safety-checker"
            checked={!!config?.disable_safety_checker}
            label={t("providers:together.disableSafetyChecker")}
            onChange={(val: boolean) =>
              updateConfig({
                ...config,
                disable_safety_checker: val,
              })
            }
          />

          <theme.TextArea
            value={config?.negative_prompt ?? ""}
            label={t("providers:together.negativePrompt")}
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
