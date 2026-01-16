import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

/**
 * UI config for StabilityAI Stable Audio generation.
 *
 * IMPORTANT: keys must match backend JSON property names.
 */
export type StabilityAISpeechConfig = {
  /** mp3 | wav */
  output_format?: string;
  /** Duration in seconds. */
  duration?: number;
  /** 0 means random seed (per StabilityAI docs). */
  seed?: number;
  /** Sampling steps (model-dependent allowed range). */
  steps?: number;
  /** Prompt adherence, 1..25 (model-dependent defaults). */
  cfg_scale?: number;
};

export const StabilityAISpeechConfigForm: React.FC<{
  config: StabilityAISpeechConfig;
  updateConfig: (val: StabilityAISpeechConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const DEFAULT_VALUE = "__default__";

  const outputFormatOptions = [
    { value: DEFAULT_VALUE, label: t("providerDefault") },
    { value: "mp3", label: "mp3" },
    { value: "wav", label: "wav" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={t("general")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Select
            label={t("outputFormat")}
            values={[config?.output_format ?? DEFAULT_VALUE]}
            valueTitle={
              outputFormatOptions.find(
                (o) => o.value === (config?.output_format ?? DEFAULT_VALUE)
              )?.label
            }
            options={outputFormatOptions}
            onChange={(val: string) => {
              const raw = String(val ?? "");
              updateConfig({
                ...config,
                output_format: raw === DEFAULT_VALUE ? undefined : raw,
              });
            }}
            style={{ minWidth: 220 }}
          >
            {outputFormatOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>

          <theme.Input
            id="stabilityai-speech-duration"
            type="number"
            step={1}
            min={1}
            max={190}
            label={t("providers:stabilityai.speech.duration")}
            hint={t("providers:stabilityai.speech.durationHint")}
            value={config?.duration ?? ""}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              updateConfig({
                ...config,
                duration: raw.length ? Number(raw) : undefined,
              });
            }}
          />

          <theme.Input
            id="stabilityai-speech-seed"
            type="number"
            step={1}
            min={0}
            max={4294967294}
            label={t("providers:stabilityai.speech.seed")}
            hint={t("providers:stabilityai.speech.seedHint")}
            value={config?.seed ?? ""}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              updateConfig({
                ...config,
                seed: raw.length ? Number(raw) : undefined,
              });
            }}
          />

          <theme.Input
            id="stabilityai-speech-steps"
            type="number"
            step={1}
            min={4}
            max={100}
            label={t("steps")}
            hint={t("providers:stabilityai.speech.stepsHint")}
            value={config?.steps ?? ""}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              updateConfig({
                ...config,
                steps: raw.length ? Number(raw) : undefined,
              });
            }}
          />

          <theme.Input
            id="stabilityai-speech-cfg-scale"
            type="number"
            step={1}
            min={1}
            max={25}
            label={t("providers:stabilityai.speech.cfgScale")}
            hint={t("providers:stabilityai.speech.cfgScaleHint")}
            value={config?.cfg_scale ?? ""}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              updateConfig({
                ...config,
                cfg_scale: raw.length ? Number(raw) : undefined,
              });
            }}
          />
        </div>
      </theme.Card>
    </div>
  );
};

