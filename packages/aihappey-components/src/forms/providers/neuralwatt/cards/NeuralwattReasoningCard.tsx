import { useTranslation } from "aihappey-i18n";

import { useTheme } from "../../../../theme/ThemeContext";
import {
  NEURALWATT_REASONING_EFFORTS,
  type NeuralwattChatConfigCardProps,
  type NeuralwattReasoningEffort,
} from "../neuralwattChatConfig";

const DEFAULT_REASONING_EFFORT: NeuralwattReasoningEffort = "medium";

export const NeuralwattReasoningCard = ({
  config,
  updateConfig,
}: NeuralwattChatConfigCardProps) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const enabled = config.reasoning_effort !== undefined;
  const value = config.reasoning_effort ?? DEFAULT_REASONING_EFFORT;
  const options = NEURALWATT_REASONING_EFFORTS.map((effort) => ({
    value: effort,
    label: t(`neuralwatt.reasoning.efforts.${effort}`),
  }));

  return (
    <theme.Card
      size="small"
      title={t("neuralwatt.reasoning.title")}
      headerActions={
        <theme.Switch
          id="neuralwatt-reasoning-effort"
          checked={enabled}
          onChange={(nextEnabled: boolean) => {
            if (nextEnabled) {
              updateConfig({ ...config, reasoning_effort: DEFAULT_REASONING_EFFORT });
              return;
            }

            const { reasoning_effort: _reasoningEffort, ...nextConfig } = config;
            updateConfig(nextConfig);
          }}
        />
      }
    >
      <theme.Select
        label={t("neuralwatt.reasoning.effort")}
        disabled={!enabled}
        values={[value]}
        valueTitle={options.find((option) => option.value === value)?.label}
        options={options}
        onChange={(effort: string) =>
          updateConfig({ ...config, reasoning_effort: effort as NeuralwattReasoningEffort })
        }
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </theme.Select>
    </theme.Card>
  );
};
