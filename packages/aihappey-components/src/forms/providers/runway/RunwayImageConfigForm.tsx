import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

export type RunwayImageConfig = {
  contentModeration?: {
    publicFigureThreshold: string;
  };
};

export const RunwayImageConfigForm: React.FC<{
  config: RunwayImageConfig;
  updateConfig: (val: RunwayImageConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const publicFigureThresholdOptions = [
    { value: "low", label: t("low") },
    { value: "auto", label: t("auto") },
  ];

  const current =
    config?.contentModeration?.publicFigureThreshold ?? "auto";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card
        size="small"
        title={t("providers:runway.contentModeration")}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Select
            label={t("providers:runway.publicFigureThreshold")}
            values={[current]}
            valueTitle={
              publicFigureThresholdOptions.find((o) => o.value === current)
                ?.label
            }
            options={publicFigureThresholdOptions}
            onChange={(val: string) =>
              updateConfig({
                ...config,
                contentModeration: {
                  publicFigureThreshold: val,
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
