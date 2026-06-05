import React, { useMemo } from "react";
import { useTranslation } from "aihappey-i18n";

import { useTheme } from "../../../theme/ThemeContext";

const REASONING_EFFORTS = ["xhigh", "high", "medium", "low", "minimal", "none"] as const;
type ReasoningEffort = (typeof REASONING_EFFORTS)[number];

const DEFAULT_REASONING_EFFORT: ReasoningEffort = "medium";

export const PoolsideChatConfigForm = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const reasoningOn = config?.reasoning !== undefined;
  const reasoningEffort = config?.reasoning?.effort as ReasoningEffort | undefined;

  const reasoningOptions = useMemo(
    () =>
      REASONING_EFFORTS.map((value) => ({
        value,
        label: t(value),
      })),
    [t]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card
        size="small"
        title={t("reasoning")}
        headerActions={
          <theme.Switch
            id="poolside_reasoning_effort"
            checked={reasoningOn}
            onChange={(val) =>
              updateConfig({
                ...config,
                reasoning: val ? { effort: DEFAULT_REASONING_EFFORT } : undefined,
              })
            }
          />
        }
      >
        <div>
          <theme.Select
            label={t("reasoningEffort", {
              reasoningEffort: t(reasoningEffort ?? DEFAULT_REASONING_EFFORT),
            })}
            disabled={!reasoningOn}
            values={[reasoningEffort ?? DEFAULT_REASONING_EFFORT]}
            valueTitle={
              reasoningOptions.find((option) => option.value === reasoningEffort)
                ?.label ?? t(DEFAULT_REASONING_EFFORT)
            }
            options={reasoningOptions}
            onChange={(value: string) =>
              updateConfig({
                ...config,
                reasoning: {
                  ...(config?.reasoning ?? { effort: DEFAULT_REASONING_EFFORT }),
                  effort: value as ReasoningEffort,
                },
              })
            }
          >
            {reasoningOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </theme.Select>
        </div>
      </theme.Card>
    </div>
  );
};

