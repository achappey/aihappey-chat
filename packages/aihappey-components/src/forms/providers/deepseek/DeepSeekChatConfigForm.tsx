import { useTranslation } from "aihappey-i18n";

import { useTheme } from "../../../theme/ThemeContext";

const REASONING_EFFORTS = ["low", "high", "max"] as const;
type ReasoningEffort = (typeof REASONING_EFFORTS)[number];

const DEFAULT_REASONING_EFFORT: ReasoningEffort = "high";

export type DeepSeekChatConfig = {
  thinking?: {
    type: "enabled" | "disabled";
  };
  reasoning_effort?: ReasoningEffort;
  [key: string]: unknown;
};

export const DeepSeekChatConfigForm = ({
  config,
  updateConfig,
}: {
  config: DeepSeekChatConfig;
  updateConfig: (config: DeepSeekChatConfig) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const reasoningOn = config?.thinking?.type !== "disabled";
  const reasoningEffort = REASONING_EFFORTS.includes(config?.reasoning_effort as ReasoningEffort)
    ? (config.reasoning_effort as ReasoningEffort)
    : DEFAULT_REASONING_EFFORT;
  const options = REASONING_EFFORTS.map((value) => ({
    value,
    label: t(value),
  }));

  const toggleReasoning = (enabled: boolean) => {
    const nextConfig: DeepSeekChatConfig = {
      ...(config ?? {}),
      thinking: { type: enabled ? "enabled" : "disabled" },
    };

    if (enabled) {
      nextConfig.reasoning_effort = DEFAULT_REASONING_EFFORT;
    } else {
      delete nextConfig.reasoning_effort;
    }

    updateConfig(nextConfig);
  };

  return (
    <theme.Card
      size="small"
      title={t("reasoning")}
      headerActions={
        <theme.Switch
          id="deepseek-reasoning"
          checked={reasoningOn}
          onChange={toggleReasoning}
        />
      }
    >
      <theme.Select
        label={t("reasoningEffort", {
          reasoningEffort: t(reasoningEffort),
        })}
        disabled={!reasoningOn}
        values={[reasoningEffort]}
        valueTitle={t(reasoningEffort)}
        options={options}
        onChange={(value: string) =>
          updateConfig({
            ...(config ?? {}),
            thinking: { type: "enabled" },
            reasoning_effort: value as ReasoningEffort,
          })
        }
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </theme.Select>
    </theme.Card>
  );
};
