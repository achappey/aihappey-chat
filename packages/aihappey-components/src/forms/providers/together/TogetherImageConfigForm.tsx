import React, { ChangeEvent } from "react";
import { useTheme } from "../../../theme/ThemeContext";

export type TogetherImageConfig = {
  steps?: number;
  guidance_scale?: number;
  disable_safety_checker?: boolean;
  negative_prompt?: string;
};

export type TogetherImageConfigFormTranslations = {
  formTitle?: string;
  steps?: string;
  stepsHint?: string;
  disableSafetyChecker?: string;
  disableSafetyCheckerHint?: string;
  negativePrompt?: string;
  negativePromptHint?: string;
  guidanceScale?: string;
  guidanceScaleHint?: string;

};

export const TogetherImageConfigForm: React.FC<{
  config: TogetherImageConfig;
  updateConfig: (val: TogetherImageConfig) => void;
  translations?: TogetherImageConfigFormTranslations;
  formTitle?: string;
}> = ({ config, updateConfig, translations, formTitle }) => {
  const theme = useTheme();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card
        size="small"
        title={formTitle ?? translations?.formTitle ?? "Together image config"}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Input
            id="together-steps"
            type={"number"}
            max={100}
            value={config?.steps}
            label={translations?.steps ?? "steps"}
            onChange={(val: ChangeEvent<HTMLInputElement>) =>
              updateConfig({
                ...config,
                steps: val.target.value ?
                  Number(val.target.value) : undefined,
              })
            }
          />

          <theme.Input
            id="together-guidance-scale"
            type={"number"}
            value={config?.guidance_scale}
            step={0.5}
            max={10}
            label={translations?.guidanceScale ?? "guidanceScale"}
            onChange={(val: ChangeEvent<HTMLInputElement>) =>
              updateConfig({
                ...config,
                guidance_scale: val.target.value ?
                  Number(val.target.value) : undefined,
              })
            }
          />

          <theme.Switch
            id="together-disable-safety-checker"
            checked={!!config?.disable_safety_checker}
            label={translations?.disableSafetyChecker ?? "disableSafetyChecker"}
            onChange={(val: boolean) =>
              updateConfig({
                ...config,
                disable_safety_checker: val,
              })
            }
          />

          <theme.TextArea
            value={config?.negative_prompt ?? ""}
            label={translations?.negativePrompt ?? "negativePrompt"}
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

