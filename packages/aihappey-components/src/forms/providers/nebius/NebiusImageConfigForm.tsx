import React, { ChangeEvent, useMemo } from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

export type NebiusImageConfig = {
  /** Required range: 1 <= x <= 80 */
  num_inference_steps?: number;

  /** Maximum string length: 2000 */
  negative_prompt?: string;

  /** Required range: 0 <= x <= 100 */
  guidance_scale?: number;

  /** webp, jpg or png */
  response_extension?: string;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const NebiusImageConfigForm: React.FC<{
  config: NebiusImageConfig;
  updateConfig: (val: NebiusImageConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const responseExtensionOptions = useMemo(
    () => [
      { value: "", label: t("providerDefault") },
      { value: "webp", label: "webp" },
      { value: "jpg", label: "jpg" },
      { value: "png", label: "png" },
    ],
    [t]
  );

  const currentResponseExtension = config?.response_extension ?? "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={t("general")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Input
            id="nebius-num-inference-steps"
            type="number"
            min={1}
            max={80}
            step={1}
            value={config?.num_inference_steps}
            label={t("steps")}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const raw = e.target.value;
              updateConfig({
                ...config,
                num_inference_steps: raw
                  ? clamp(Number(raw), 1, 80)
                  : undefined,
              });
            }}
          />

          <theme.Input
            id="nebius-guidance-scale"
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={config?.guidance_scale}
            label={t("guidanceScale")}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const raw = e.target.value;
              updateConfig({
                ...config,
                guidance_scale: raw
                  ? clamp(Number(raw), 0, 100)
                  : undefined,
              });
            }}
          />

          <theme.Select
            label={t("providers:nebius.responseExtension")}
            values={[currentResponseExtension]}
            valueTitle={
              responseExtensionOptions.find(
                (o) => o.value === currentResponseExtension
              )?.label
            }
            options={responseExtensionOptions}
            onChange={(val: string) =>
              updateConfig({
                ...config,
                response_extension: val?.trim() ? val : undefined,
              })
            }
            style={{ minWidth: 220 }}
          >
            {responseExtensionOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>

          <theme.TextArea
            value={config?.negative_prompt ?? ""}
            label={t("negativePrompt")}
            onChange={(val: string) => {
              const next = (val ?? "").slice(0, 2000);
              updateConfig({
                ...config,
                negative_prompt: next.length ? next : undefined,
              });
            }}
          />
        </div>
      </theme.Card>
    </div>
  );
};

