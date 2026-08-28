import { useTranslation } from "aihappey-i18n";

import { useTheme } from "../../../../theme/ThemeContext";

const REASONING_EFFORTS = ["none", "low", "medium", "high"] as const;
type ReasoningEffort = (typeof REASONING_EFFORTS)[number];

const DEFAULT_REASONING_EFFORT: ReasoningEffort = "medium";

const omitReasoningEffort = (config: any) => {
  const nextConfig = { ...(config ?? {}) };
  delete nextConfig.reasoning_effort;
  return nextConfig;
};

export const CerebrasReasoningCard = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (config: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const reasoningOn = config?.reasoning_effort !== undefined;
  const reasoningEffort = REASONING_EFFORTS.includes(config?.reasoning_effort)
    ? (config.reasoning_effort as ReasoningEffort)
    : DEFAULT_REASONING_EFFORT;
  const options = REASONING_EFFORTS.map((value) => ({
    value,
    label: t(value),
  }));

  return (
    <theme.Card
      size="small"
      title={t("reasoning")}
      headerActions={
        <theme.Switch
          id="cerebras-reasoning-effort"
          checked={reasoningOn}
          onChange={(enabled) =>
            updateConfig(
              enabled
                ? { ...(config ?? {}), reasoning_effort: DEFAULT_REASONING_EFFORT }
                : omitReasoningEffort(config),
            )
          }
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
