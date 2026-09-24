import { useTranslation } from "aihappey-i18n";

import { useTheme } from "../../../../theme/ThemeContext";
import type { NeuralwattChatConfigCardProps } from "../neuralwattChatConfig";

const DEFAULT_THINKING_TOKEN_BUDGET = 1024;

const parsePositiveInteger = (value: unknown) => {
  const text = String(value ?? "").trim();
  if (!text) return undefined;

  const parsed = Number(text);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : undefined;
};

export const NeuralwattThinkingTokenBudgetCard = ({
  config,
  updateConfig,
}: NeuralwattChatConfigCardProps) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const enabled = config.thinking_token_budget !== undefined;

  return (
    <theme.Card
      size="small"
      title={t("neuralwatt.thinkingTokenBudget.title")}
      headerActions={
        <theme.Switch
          id="neuralwatt-thinking-token-budget"
          checked={enabled}
          onChange={(nextEnabled: boolean) => {
            if (nextEnabled) {
              updateConfig({
                ...config,
                thinking_token_budget: DEFAULT_THINKING_TOKEN_BUDGET,
              });
              return;
            }

            const { thinking_token_budget: _thinkingTokenBudget, ...nextConfig } = config;
            updateConfig(nextConfig);
          }}
        />
      }
    >
      <theme.Input
        id="neuralwatt-thinking-token-budget-value"
        label={t("neuralwatt.thinkingTokenBudget.label")}
        type="number"
        min={1}
        step={1}
        disabled={!enabled}
        value={config.thinking_token_budget ?? DEFAULT_THINKING_TOKEN_BUDGET}
        onChange={(event: any) => {
          const budget = parsePositiveInteger(event?.target?.value);
          if (budget !== undefined) {
            updateConfig({ ...config, thinking_token_budget: budget });
          }
        }}
      />
    </theme.Card>
  );
};
