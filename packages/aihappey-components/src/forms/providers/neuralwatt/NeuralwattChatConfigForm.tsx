import { NeuralwattReasoningCard } from "./cards/NeuralwattReasoningCard";
import { NeuralwattServiceTierCard } from "./cards/NeuralwattServiceTierCard";
import { NeuralwattThinkingTokenBudgetCard } from "./cards/NeuralwattThinkingTokenBudgetCard";
import {
  normalizeNeuralwattChatConfig,
  type NeuralwattChatConfig,
} from "./neuralwattChatConfig";

export const NeuralwattChatConfigForm = ({
  config,
  updateConfig,
}: {
  config: Partial<NeuralwattChatConfig> | Record<string, unknown>;
  updateConfig: (config: NeuralwattChatConfig) => void;
}) => {
  const normalizedConfig = normalizeNeuralwattChatConfig(config);
  const update = (nextConfig: NeuralwattChatConfig) =>
    updateConfig(normalizeNeuralwattChatConfig(nextConfig));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <NeuralwattReasoningCard config={normalizedConfig} updateConfig={update} />
      <NeuralwattThinkingTokenBudgetCard config={normalizedConfig} updateConfig={update} />
      <NeuralwattServiceTierCard config={normalizedConfig} updateConfig={update} />
    </div>
  );
};
