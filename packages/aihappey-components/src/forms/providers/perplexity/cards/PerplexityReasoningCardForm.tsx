import React from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";

const DEFAULT_REASONING = {
  effort: "medium",
};

const EFFORTS = ["low", "medium", "high"] as const;
type Effort = (typeof EFFORTS)[number];

export const PerplexityReasoningCardForm: React.FC<{
  config: any;
  updateConfig: (val: any) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const reasoningOn = !!config?.reasoning;

  const effortToIndex = (e?: Effort) =>
    Math.max(0, EFFORTS.indexOf((e ?? DEFAULT_REASONING.effort) as Effort));

  const indexToEffort = (i: number): Effort =>
    EFFORTS[Math.min(EFFORTS.length - 1, Math.max(0, i))];

  return (
    <theme.Card
      size="small"
      title={t("reasoning")}
      headerActions={
        <theme.Switch
          id="perplexityReasoning"
          checked={reasoningOn}
          onChange={(val) =>
            updateConfig({
              ...config,
              reasoning: val ? { ...DEFAULT_REASONING } : undefined,
            })
          }
        />
      }
    >
      <div>
        <theme.Slider
          label={`${t("reasoningEffort", {
            reasoningEffort: t(config?.reasoning?.effort ?? DEFAULT_REASONING.effort),
          })}`}
          disabled={!reasoningOn}
          min={0}
          max={EFFORTS.length - 1}
          step={1}
          value={effortToIndex(config?.reasoning?.effort as Effort)}
          onChange={(i: number) =>
            updateConfig({
              ...config,
              reasoning: {
                ...(config?.reasoning ?? DEFAULT_REASONING),
                effort: indexToEffort(i),
              },
            })
          }
        />
      </div>
    </theme.Card>
  );
};
