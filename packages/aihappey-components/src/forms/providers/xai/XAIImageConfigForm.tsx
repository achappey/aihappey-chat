import React from "react";
import { useTheme } from "../../../theme/ThemeContext";

export type XAIImageConfig = {
  quality?: string;
};

export type XAIImageConfigFormTranslations = {
  formTitle?: string;

  quality?: string;

  low?: string;
  medium?: string;
  high?: string;

};

export const XAIImageConfigForm: React.FC<{
  config: XAIImageConfig;
  updateConfig: (val: XAIImageConfig) => void;
  translations?: XAIImageConfigFormTranslations;
  formTitle?: string;
}> = ({ config, updateConfig, translations, formTitle }) => {
  const theme = useTheme();

  const qualityOptions = [
    { value: "low", label: translations?.low ?? "low" },
    { value: "medium", label: translations?.medium ?? "medium" },
    { value: "high", label: translations?.high ?? "high" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card
        size="small"
        title={formTitle ?? translations?.formTitle ?? "XAI image config"}
      >
        <div >
          <theme.Select
            label={translations?.quality ?? "quality"}
            values={[config?.quality ?? "medium"]}
            valueTitle={
              qualityOptions.find((o) => o.value === (config?.quality ?? "medium"))
                ?.label
            }
            options={qualityOptions}
            onChange={(val: string) =>
              updateConfig({
                ...config,
                quality: val,
              })
            }
            style={{ minWidth: 220 }}
          >
            {qualityOptions.map((o) => (
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

