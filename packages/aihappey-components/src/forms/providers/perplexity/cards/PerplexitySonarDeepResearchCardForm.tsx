import React from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";

export const PerplexitySonarDeepResearchCardForm: React.FC<{
  config: any;
  updateConfig: (val: any) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const reasoningEffortOptions = [
    { value: "low", label: t("low") },
    { value: "medium", label: t("medium") },
    { value: "high", label: t("high") },
  ];

  return (
    <theme.Card size="small" title={t("providers:perplexity.sonarDeepResearch")}>
      <div>
        <theme.Select
          label={t("reasoning")}
          disabled={!config?.reasoning_effort}
          values={[config?.reasoning_effort || ""]}
          valueTitle={
            reasoningEffortOptions.find((a) => a.value === config?.reasoning_effort)
              ?.label
          }
          options={reasoningEffortOptions}
          onChange={(val: string) => updateConfig({ ...config, reasoning_effort: val })}
        >
          {reasoningEffortOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </theme.Select>
      </div>
    </theme.Card>
  );
};

