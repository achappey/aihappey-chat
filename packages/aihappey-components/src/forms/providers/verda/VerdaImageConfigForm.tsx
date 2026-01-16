import React, { ChangeEvent } from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

export type VerdaFlux1ImageConfig = {
  num_inference_steps?: number;
  guidance_scale?: number;
  enable_safety_checker?: boolean;
  output_format?: string;
  output_quality?: number;
};

export type VerdaFlux2ImageConfig = {
  steps?: number;
  guidance?: number;
};

export type VerdaFlux2KleinImageConfig = {
  num_steps?: number;
  guidance?: number;
  enable_safety_checker?: boolean;
  output_format?: string;
  output_quality?: number;
};

export type VerdaImageConfig = {
  flux_1?: VerdaFlux1ImageConfig;
  flux_2?: VerdaFlux2ImageConfig;
  flux_2_klein?: VerdaFlux2KleinImageConfig;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const VerdaImageConfigForm: React.FC<{
  config: VerdaImageConfig;
  updateConfig: (val: VerdaImageConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const outputFormatOptions = [
    { value: "jpeg", label: "jpeg" },
    { value: "png", label: "png" },
    { value: "webp", label: "webp" },
  ];

  const safetyCheckerLabelRaw = t("providers:together.disableSafetyChecker");
  const safetyCheckerLabel = safetyCheckerLabelRaw === "Disable safety checker"
    ? "Enable safety checker"
    : safetyCheckerLabelRaw;

  const guidanceLabel = t("guidance");
  const guidanceFallback = guidanceLabel === "guidance"
    ? t("guidanceScale")
    : guidanceLabel;

  const flux1 = config?.flux_1 ?? {};
  const flux2 = config?.flux_2 ?? {};
  const flux2Klein = config?.flux_2_klein ?? {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title="FLUX.1">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Input
            id="verda-flux1-num-inference-steps"
            type="number"
            min={1}
            value={flux1.num_inference_steps}
            label={t("steps")}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updateConfig({
                ...config,
                flux_1: {
                  ...flux1,
                  num_inference_steps: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                },
              })
            }
          />

          <theme.Input
            id="verda-flux1-guidance-scale"
            type="number"
            step={0.1}
            value={flux1.guidance_scale}
            label={t("guidanceScale")}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updateConfig({
                ...config,
                flux_1: {
                  ...flux1,
                  guidance_scale: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                },
              })
            }
          />

          <theme.Switch
            id="verda-flux1-enable-safety-checker"
            checked={!!flux1.enable_safety_checker}
            label={safetyCheckerLabel}
            onChange={(val: boolean) =>
              updateConfig({
                ...config,
                flux_1: {
                  ...flux1,
                  enable_safety_checker: val,
                },
              })
            }
          />

          <theme.Select
            label={t("outputFormat")}
            values={[flux1.output_format ?? ""]}
            valueTitle={
              outputFormatOptions.find((o) => o.value === flux1.output_format)
                ?.label
            }
            options={outputFormatOptions}
            onChange={(val: string) =>
              updateConfig({
                ...config,
                flux_1: {
                  ...flux1,
                  output_format: val || undefined,
                },
              })
            }
            style={{ minWidth: 220 }}
          >
            {outputFormatOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>

          <theme.Input
            id="verda-flux1-output-quality"
            type="number"
            min={1}
            max={100}
            value={flux1.output_quality}
            label={t("quality")}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updateConfig({
                ...config,
                flux_1: {
                  ...flux1,
                  output_quality: e.target.value
                    ? clamp(Number(e.target.value), 1, 100)
                    : undefined,
                },
              })
            }
          />
        </div>
      </theme.Card>

      <theme.Card size="small" title="FLUX.2">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Input
            id="verda-flux2-steps"
            type="number"
            min={1}
            value={flux2.steps}
            label={t("steps")}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updateConfig({
                ...config,
                flux_2: {
                  ...flux2,
                  steps: e.target.value ? Number(e.target.value) : undefined,
                },
              })
            }
          />

          <theme.Input
            id="verda-flux2-guidance"
            type="number"
            step={0.1}
            value={flux2.guidance}
            label={guidanceFallback}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updateConfig({
                ...config,
                flux_2: {
                  ...flux2,
                  guidance: e.target.value ? Number(e.target.value) : undefined,
                },
              })
            }
          />
        </div>
      </theme.Card>

      <theme.Card size="small" title="FLUX.2 [klein]">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Input
            id="verda-flux2-klein-num-steps"
            type="number"
            min={1}
            value={flux2Klein.num_steps}
            label={t("steps")}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updateConfig({
                ...config,
                flux_2_klein: {
                  ...flux2Klein,
                  num_steps: e.target.value ? Number(e.target.value) : undefined,
                },
              })
            }
          />

          <theme.Input
            id="verda-flux2-klein-guidance"
            type="number"
            step={0.1}
            value={flux2Klein.guidance}
            label={guidanceFallback}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updateConfig({
                ...config,
                flux_2_klein: {
                  ...flux2Klein,
                  guidance: e.target.value ? Number(e.target.value) : undefined,
                },
              })
            }
          />

          <theme.Switch
            id="verda-flux2-klein-enable-safety-checker"
            checked={!!flux2Klein.enable_safety_checker}
            label={safetyCheckerLabel}
            onChange={(val: boolean) =>
              updateConfig({
                ...config,
                flux_2_klein: {
                  ...flux2Klein,
                  enable_safety_checker: val,
                },
              })
            }
          />

          <theme.Select
            label={t("outputFormat")}
            values={[flux2Klein.output_format ?? ""]}
            valueTitle={
              outputFormatOptions.find(
                (o) => o.value === flux2Klein.output_format
              )?.label
            }
            options={outputFormatOptions}
            onChange={(val: string) =>
              updateConfig({
                ...config,
                flux_2_klein: {
                  ...flux2Klein,
                  output_format: val || undefined,
                },
              })
            }
            style={{ minWidth: 220 }}
          >
            {outputFormatOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>

          <theme.Input
            id="verda-flux2-klein-output-quality"
            type="number"
            min={1}
            max={100}
            value={flux2Klein.output_quality}
            label={t("quality")}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updateConfig({
                ...config,
                flux_2_klein: {
                  ...flux2Klein,
                  output_quality: e.target.value
                    ? clamp(Number(e.target.value), 1, 100)
                    : undefined,
                },
              })
            }
          />
        </div>
      </theme.Card>
    </div>
  );
};
