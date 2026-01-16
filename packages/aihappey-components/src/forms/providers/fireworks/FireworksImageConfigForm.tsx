import React, { ChangeEvent } from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

export type FireworksImageConfig = {
  /** jpeg or png */
  output_format?: string;

  /** URL to receive webhook notifications */
  webhook_url?: string;

  /** Whether to perform upsampling on the prompt */
  prompt_upsampling?: boolean;

  /** Tolerance level for input and output moderation */
  safety_tolerance?: number;
};

export const FireworksImageConfigForm: React.FC<{
  config: FireworksImageConfig;
  updateConfig: (val: FireworksImageConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const outputFormatOptions = [
    { value: "jpeg", label: "jpeg" },
    { value: "png", label: "png" },
  ];
  const currentOutputFormat = config.output_format ?? "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={t("general")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Select
            label={t("outputFormat")}
            values={[currentOutputFormat]}
            valueTitle={
              outputFormatOptions.find((o) => o.value === currentOutputFormat)
                ?.label
            }
            options={outputFormatOptions}
            onChange={(val: string) =>
              updateConfig({
                ...config,
                output_format: val || undefined,
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
            id="fireworks-safety-tolerance"
            type="number"
            min={0}
            max={6}
            value={config.safety_tolerance}
            label={t("providers:fireworks.safetyTolerance")}
            hint={t("providers:fireworks.safetyToleranceHint")}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updateConfig({
                ...config,
                safety_tolerance: e.target.value
                  ? Math.min(6, Math.max(0, Number(e.target.value)))
                  : undefined,
              })
            }
          />
          <theme.Input
            id="fireworks-webhook-url"
            type="url"
            value={config.webhook_url ?? ""}
            label={t("providers:fireworks.webhookUrl")}
            hint={t("providers:fireworks.webhookUrlHint")}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updateConfig({
                ...config,
                webhook_url: e.target.value.trim()
                  ? e.target.value
                  : undefined,
              })
            }
          />

          <theme.Switch
            id="fireworks-prompt-upsampling"
            checked={!!config.prompt_upsampling}
            label={t("providers:fireworks.promptUpsampling")}
            hint={t("providers:fireworks.promptUpsamplingHint")}
            onChange={(val: boolean) =>
              updateConfig({
                ...config,
                prompt_upsampling: val,
              })
            }
          />

        </div>
      </theme.Card>
    </div>
  );
};
