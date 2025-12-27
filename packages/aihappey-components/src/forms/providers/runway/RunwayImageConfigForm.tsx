import React, { ChangeEvent } from "react";
import { useTheme } from "../../../theme/ThemeContext";

export type RunwayImageConfig = {
  contentModeration?: {
    publicFigureThreshold: string
  };
};

export type RunwayImageConfigFormTranslations = {
  formTitle?: string;
  publicFigureThreshold?: string;
  low?: string
  auto?: string
};

export const RunwayImageConfigForm: React.FC<{
  config: RunwayImageConfig;
  updateConfig: (val: RunwayImageConfig) => void;
  translations?: RunwayImageConfigFormTranslations;
  formTitle?: string;
}> = ({ config, updateConfig, translations, formTitle }) => {
  const theme = useTheme();

  const publicFigureThresholdOptions = [
    { value: "low", label: translations?.low ?? "low" },
    { value: "auto", label: translations?.auto ?? "auto" }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card
        size="small"
        title={formTitle ?? translations?.formTitle ?? "Together image config"}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Select
            label={translations?.publicFigureThreshold ?? "publicFigureThreshold"}
            values={[config?.contentModeration?.publicFigureThreshold ?? "auto"]}
            valueTitle={
              publicFigureThresholdOptions
                .find((o) => o.value === (config?.contentModeration?.publicFigureThreshold ?? "auto"))
                ?.label
            }
            options={publicFigureThresholdOptions}
            onChange={(val: string) =>
              updateConfig({
                ...config,
                contentModeration: {
                  publicFigureThreshold: val
                },
              })
            }
            style={{ minWidth: 220 }}
          >
            {publicFigureThresholdOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>

        </div>
      </theme.Card>
    </div>
  );
};

