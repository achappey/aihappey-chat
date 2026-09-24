export const NEURALWATT_REASONING_EFFORTS = [
  "none",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
] as const;

export const NEURALWATT_SERVICE_TIERS = ["auto", "default", "flex"] as const;

export type NeuralwattReasoningEffort = (typeof NEURALWATT_REASONING_EFFORTS)[number];
export type NeuralwattServiceTier = (typeof NEURALWATT_SERVICE_TIERS)[number];

export type NeuralwattChatConfig = {
  reasoning_effort?: NeuralwattReasoningEffort;
  thinking_token_budget?: number;
  service_tier?: NeuralwattServiceTier;
};

const isReasoningEffort = (value: unknown): value is NeuralwattReasoningEffort =>
  typeof value === "string"
  && NEURALWATT_REASONING_EFFORTS.includes(value as NeuralwattReasoningEffort);

const isServiceTier = (value: unknown): value is NeuralwattServiceTier =>
  typeof value === "string"
  && NEURALWATT_SERVICE_TIERS.includes(value as NeuralwattServiceTier);

/** Produces the exact flat metadata object accepted by Neuralwatt chat completions. */
export const normalizeNeuralwattChatConfig = (
  config: Partial<NeuralwattChatConfig> | Record<string, unknown> = {},
): NeuralwattChatConfig => {
  const normalized: NeuralwattChatConfig = {};

  if (isReasoningEffort(config.reasoning_effort)) {
    normalized.reasoning_effort = config.reasoning_effort;
  }

  if (
    typeof config.thinking_token_budget === "number"
    && Number.isInteger(config.thinking_token_budget)
    && config.thinking_token_budget >= 1
  ) {
    normalized.thinking_token_budget = config.thinking_token_budget;
  }

  if (isServiceTier(config.service_tier)) {
    normalized.service_tier = config.service_tier;
  }

  return normalized;
};

export type NeuralwattChatConfigCardProps = {
  config: NeuralwattChatConfig;
  updateConfig: (config: NeuralwattChatConfig) => void;
};
