import React from "react";
import { useTheme } from "../../../theme/ThemeContext";

export type OpenAIImageConfig = {
  quality?: string;
  background?: string;
  moderation?: string;
};

export type OpenAIImageConfigFormTranslations = {
  formTitle?: string;

  quality?: string;
  background?: string;
  moderation?: string;

  auto?: string;
  low?: string;
  medium?: string;
  high?: string;

  transparent?: string;
  opaque?: string;
};

export const OpenAIImageConfigForm: React.FC<{
  config: OpenAIImageConfig;
  updateConfig: (val: OpenAIImageConfig) => void;
  translations?: OpenAIImageConfigFormTranslations;
  formTitle?: string;
}> = ({ config, updateConfig, translations, formTitle }) => {
  const theme = useTheme();

  const qualityOptions = [
    { value: "auto", label: translations?.auto ?? "auto" },
    { value: "low", label: translations?.low ?? "low" },
    { value: "medium", label: translations?.medium ?? "medium" },
    { value: "high", label: translations?.high ?? "high" },
  ];

  const backgroundOptions = [
    { value: "auto", label: translations?.auto ?? "auto" },
    { value: "transparent", label: translations?.transparent ?? "transparent" },
    { value: "opaque", label: translations?.opaque ?? "opaque" },
  ];

  const moderationOptions = [
    { value: "low", label: translations?.low ?? "low" },
    { value: "auto", label: translations?.auto ?? "auto" }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card
        size="small"
        title={formTitle ?? translations?.formTitle ?? "OpenAI image config"}
      >
        <div >
          <theme.Select
            label={translations?.quality ?? "quality"}
            values={[config?.quality ?? "auto"]}
            valueTitle={
              qualityOptions.find((o) => o.value === (config?.quality ?? "auto"))
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

          <theme.Select
            label={translations?.background ?? "background"}
            values={[config?.background ?? "auto"]}
            valueTitle={
              backgroundOptions.find(
                (o) => o.value === (config?.background ?? "auto")
              )?.label
            }
            options={backgroundOptions}
            onChange={(val: string) =>
              updateConfig({
                ...config,
                background: val,
              })
            }
            style={{ minWidth: 220 }}
          >
            {backgroundOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>

          <theme.Select
            label={translations?.moderation ?? "moderation"}
            values={[config?.moderation ?? "low"]}
            valueTitle={
              moderationOptions.find(
                (o) => o.value === (config?.moderation ?? "low")
              )?.label
            }
            options={moderationOptions}
            onChange={(val: string) =>
              updateConfig({
                ...config,
                moderation: val,
              })
            }
            style={{ minWidth: 220 }}
          >
            {moderationOptions.map((o) => (
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

