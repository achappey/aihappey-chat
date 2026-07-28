import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";
import { parseAnthropicNumberInput } from "./AnthropicToolCardShared";

const EFFORTS = ["low", "medium", "high", "xhigh", "max"] as const;
type Effort = (typeof EFFORTS)[number];

const createDefaultOutputConfig = () => ({ effort: "medium" as Effort });

const effortToIndex = (effort?: Effort) =>
  Math.max(0, EFFORTS.indexOf((effort ?? "medium") as Effort));

const indexToEffort = (index: number): Effort =>
  EFFORTS[Math.min(EFFORTS.length - 1, Math.max(0, index))];

export const AnthropicOutputConfigCard = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const outputConfigOn = !!config?.output_config;
  const outputConfig = config?.output_config ?? createDefaultOutputConfig();
  const effort = (outputConfig.effort ?? "medium") as Effort;
  const taskBudgetTotal = outputConfig?.task_budget?.total;

  const updateTaskBudget = (value: string) => {
    const parsedTotal = parseAnthropicNumberInput(value);
    const total =
      parsedTotal !== undefined &&
      parsedTotal > 0 &&
      Number.isInteger(parsedTotal)
        ? parsedTotal
        : undefined;
    const { task_budget: _taskBudget, ...nextOutputConfig } = outputConfig;

    updateConfig({
      ...config,
      output_config: total
        ? {
            ...nextOutputConfig,
            task_budget: { type: "tokens", total },
          }
        : nextOutputConfig,
    });
  };

  return (
    <theme.Card
      size="small"
      title={t("providers:anthropic.outputConfig.title")}
      headerActions={
        <theme.Switch
          id="anthropic-output-config"
          checked={outputConfigOn}
          onChange={(checked: boolean) =>
            updateConfig({
              ...config,
              output_config: checked ? createDefaultOutputConfig() : undefined,
            })
          }
        />
      }
    >
      <div style={{ display: "flex", gap: 12, width: "100%" }}>
        <theme.Slider
          label={t("providers:anthropic.outputConfig.effort", {
            effort: t(effort),
          })}
          disabled={!outputConfigOn}
          min={0}
          max={EFFORTS.length - 1}
          step={1}
          style={{ flex: "1 1 0", minWidth: 0 }}
          value={effortToIndex(effort)}
          onChange={(index: number) =>
            updateConfig({
              ...config,
              output_config: {
                ...outputConfig,
                effort: indexToEffort(index),
              },
            })
          }
        />
        <theme.Input
          id="anthropic-output-config-task-budget"
          type="number"
          label={t("providers:anthropic.outputConfig.taskBudget")}
          disabled={!outputConfigOn}
          min={20000}
          step={1}
          value={taskBudgetTotal ?? ""}
          style={{ flex: "1 1 0", minWidth: 0 }}
          onChange={(e: any) => updateTaskBudget(e.target.value)}
        />
      </div>
    </theme.Card>
  );
};
