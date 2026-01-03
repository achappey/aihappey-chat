import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

export type OpenAIImageConfig = {
  quality?: string;
  background?: string;
  moderation?: string;
};

export const OpenAIImageConfigForm: React.FC<{
  config: OpenAIImageConfig;
  updateConfig: (val: OpenAIImageConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const qualityOptions = [
    { value: "auto", label: t("auto") },
    { value: "low", label: t("low") },
    { value: "medium", label: t("medium") },
    { value: "high", label: t("high") },
  ];

  const backgroundOptions = [
    { value: "auto", label: t("auto") },
    { value: "transparent", label: t("transparent") },
    { value: "opaque", label: t("opaque") },
  ];

  const moderationOptions = [
    { value: "low", label: t("low") },
    { value: "auto", label: t("auto") },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={t("general")}>
        <div>
          <theme.Select
            label={t("quality")}
            values={[config?.quality ?? "auto"]}
            valueTitle={
              qualityOptions.find(
                (o) => o.value === (config?.quality ?? "auto")
              )?.label
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
            label={t("background")}
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
            label={t("moderation")}
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
