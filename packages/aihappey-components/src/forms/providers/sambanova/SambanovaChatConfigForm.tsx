import React, { useMemo } from "react";
import { useTranslation } from "aihappey-i18n";

import { useTheme } from "../../../theme/ThemeContext";

const EFFORTS = ["low", "medium", "high"] as const;
type Effort = (typeof EFFORTS)[number];
const TRUNCATION_OPTIONS = ["auto", "disabled"] as const;
type Truncation = (typeof TRUNCATION_OPTIONS)[number];

const DEFAULT_REASONING_EFFORT: Effort = "medium";

export const SambanovaChatConfigForm = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const reasoningOn = config?.reasoning !== undefined;
  const reasoningEffort = config?.reasoning?.effort;
  const truncationValue = config?.truncation ?? "disabled";

  const reasoningOptions = useMemo(
    () =>
      EFFORTS.map((v) => ({
        value: v,
        label: t(v),
      })),
    [t]
  );

  const truncationOptions = useMemo(
    () =>
      TRUNCATION_OPTIONS.map((value) => ({
        value,
        label: t(`providers:openai.truncation.${value}`),
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
            id="sambanova_reasoning_effort"
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
              reasoningEffort: t(reasoningEffort ?? "none"),
            })}
            disabled={!reasoningOn}
            values={[reasoningEffort ?? ""]}
            valueTitle={
              reasoningOptions.find((o) => o.value === reasoningEffort)?.label
            }
            options={reasoningOptions}
            onChange={(val: string) =>
              updateConfig({
                ...config,
                reasoning: { effort: val as Effort },
              })
            }
          >
            {reasoningOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>
        </div>
      </theme.Card>

      <theme.Select
        label={t("providers:openai.truncation.title")}
        values={[truncationValue]}
        valueTitle={t(`providers:openai.truncation.${truncationValue}`)}
        options={truncationOptions}
        onChange={(value: string) =>
          updateConfig({
            ...config,
            truncation: String(value ?? "disabled") as Truncation,
          })
        }
      >
        {truncationOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </theme.Select>

      <theme.Switch
        id="sambanova_parallel_tool_calls"
        checked={!!config?.parallel_tool_calls}
        label={t("parallelToolCalls")}
        onChange={(value) =>
          updateConfig({
            ...config,
            parallel_tool_calls: value,
          })
        }
      />
    </div>
  );
};

