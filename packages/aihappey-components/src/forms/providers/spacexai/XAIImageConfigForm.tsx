import React from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../theme/ThemeContext";

export type XAIImageQuality = "auto" | "low" | "medium";

export type XAIImageConfig = {
  quality?: XAIImageQuality;
};

const QUALITY_VALUES: XAIImageQuality[] = ["auto", "low", "medium"];

export const XAIImageConfigForm: React.FC<{
  config: XAIImageConfig;
  updateConfig: (value: XAIImageConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const quality = config.quality ?? "auto";
  const qualityOptions = QUALITY_VALUES.map((value) => ({
    value,
    label: t(value),
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={t("general")}>
        <theme.Select
          label={t("quality")}
          values={[quality]}
          valueTitle={
            qualityOptions.find((option) => option.value === quality)?.label
          }
          options={qualityOptions}
          onChange={(value: string) =>
            updateConfig({
              ...config,
              quality: value as XAIImageQuality,
            })
          }
          style={{ minWidth: 220 }}
        >
          {qualityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </theme.Select>
      </theme.Card>
    </div>
  );
};
