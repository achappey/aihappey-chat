import { useTranslation } from "aihappey-i18n";

import { useTheme } from "../../../theme/ThemeContext";

const REASONING_EFFORTS = [
  "none",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
] as const;

type ReasoningEffort = (typeof REASONING_EFFORTS)[number];

const DEFAULT_REASONING_EFFORT: ReasoningEffort = "medium";

const omitReasoningEffort = (config: Record<string, any> | undefined) => {
  const { reasoning_effort: _omitted, ...rest } = config ?? {};
  return rest;
};

export const UpstageChatConfigForm = ({
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
    label: t(`providers:upstage.reasoning.efforts.${value}`),
  }));

  return (
    <theme.Card
      size="small"
      title={t("providers:upstage.reasoning.title")}
      headerActions={
        <theme.Switch
          id="upstage-reasoning-effort"
          checked={reasoningOn}
          onChange={(enabled: boolean) =>
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
        label={t("providers:upstage.reasoning.effort")}
        disabled={!reasoningOn}
        values={[reasoningEffort]}
        valueTitle={t(`providers:upstage.reasoning.efforts.${reasoningEffort}`)}
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
