import type { ModelOption, ModelResponse, Provider } from "aihappey-types";
import { PROVIDER_PRICING_CATALOGS as RAW_PROVIDER_PRICING_CATALOGS } from "./pricing.generated";

type PriceValue = string | number;

export type ProviderModelPricing = {
  input: PriceValue;
  output: PriceValue;
  input_cache_read?: PriceValue;
  input_cache_write?: PriceValue;
  [key: string]: PriceValue | undefined;
};

type ProviderPricingCatalogEntry = {
  pricing?: ProviderModelPricing;
};

type ProviderPricingCatalog = Record<string, ProviderPricingCatalogEntry>;

const PROVIDER_PRICING_CATALOGS = RAW_PROVIDER_PRICING_CATALOGS as Record<string, ProviderPricingCatalog>;

const normalizeProviderKey = (value?: string) => String(value ?? "").trim().toLowerCase();

const normalizeModelId = (value?: string) => String(value ?? "").trim().toLowerCase();

const stripExactProviderPrefix = (modelId: string, providerKey: string) => {
  const prefix = `${providerKey}/`;
  return modelId.toLowerCase().startsWith(prefix)
    ? modelId.slice(prefix.length)
    : modelId;
};

export const getProviderPricingForModel = (
  providerKey?: string,
  modelId?: string,
): ProviderModelPricing | undefined => {
  const normalizedProviderKey = normalizeProviderKey(providerKey);
  if (!normalizedProviderKey) return undefined;

  const normalizedModelId = normalizeModelId(modelId);
  if (!normalizedModelId) return undefined;

  const catalog = PROVIDER_PRICING_CATALOGS[normalizedProviderKey];
  if (!catalog) return undefined;

  const requestedModelId = stripExactProviderPrefix(normalizedModelId, normalizedProviderKey);
  const expectedPrefix = `${normalizedProviderKey}/`;

  for (const [catalogModelId, entry] of Object.entries(catalog)) {
    const normalizedCatalogModelId = normalizeModelId(catalogModelId);
    if (!normalizedCatalogModelId.startsWith(expectedPrefix)) continue;

    const catalogProviderModelId = normalizedCatalogModelId.slice(expectedPrefix.length);
    if (catalogProviderModelId === requestedModelId && entry?.pricing) {
      return entry.pricing;
    }
  }

  return undefined;
};

export const enrichDirectModelsWithProviderPricing = (
  response: { data?: ModelOption[] },
  providerKey?: string,
): ModelResponse => {
  const normalizedProviderKey = normalizeProviderKey(providerKey);
  if (!normalizedProviderKey) return { ...response, data: response?.data ?? [] };

  return {
    ...response,
    data: (response?.data ?? []).map((model) => {
      if ((model as any)?.pricing) return model;

      const pricing = getProviderPricingForModel(normalizedProviderKey, model?.id);
      if (!pricing) return model;

      return {
        ...model,
        pricing,
      };
    }),
  };
};

const toFiniteNumber = (value: unknown): number | undefined => {
  const numeric = typeof value === "number" ? value : typeof value === "string" ? Number(value) : undefined;
  return typeof numeric === "number" && Number.isFinite(numeric) ? numeric : undefined;
};

const getNestedFiniteNumber = (source: any, keys: string[]) => {
  for (const key of keys) {
    const value = key.split(".").reduce<any>((acc, segment) => acc?.[segment], source);
    const numeric = toFiniteNumber(value);
    if (numeric !== undefined) return numeric;
  }

  return undefined;
};

const usageFromEvent = (event: any) => event?.usage
  ?? event?.message?.usage
  ?? event?.response?.usage
  ?? event?.conversation?.usage
  ?? event?.interaction?.usage
  ?? event?.metadata?.total_usage;

const usageTokens = (usage: any) => {
  if (!usage || typeof usage !== "object") return undefined;

  const input = getNestedFiniteNumber(usage, [
    "promptTokens",
    "inputTokens",
    "prompt_tokens",
    "input_tokens",
    "total_input_tokens",
    "tokens.prompt",
    "tokens.input",
  ]);
  const output = getNestedFiniteNumber(usage, [
    "completionTokens",
    "outputTokens",
    "completion_tokens",
    "output_tokens",
    "total_output_tokens",
    "tokens.completion",
    "tokens.output",
  ]);
  const inputCacheRead = getNestedFiniteNumber(usage, [
    "inputCacheReadTokens",
    "input_cache_read_tokens",
    "cacheReadInputTokens",
    "cache_read_input_tokens",
    "cachedInputTokens",
    "cached_input_tokens",
    "cache_read_tokens",
    "cache_read",
    "prompt_tokens_details.cached_tokens",
    "input_tokens_details.cached_tokens",
    "cache_read_input_tokens_details.tokens",
  ]);
  const inputCacheWrite = getNestedFiniteNumber(usage, [
    "inputCacheWriteTokens",
    "input_cache_write_tokens",
    "cacheWriteInputTokens",
    "cache_write_input_tokens",
    "cacheCreationInputTokens",
    "cache_creation_input_tokens",
    "cache_creation_tokens",
    "cache_write_tokens",
    "cache_write",
    "prompt_tokens_details.cache_creation_tokens",
    "input_tokens_details.cache_creation_tokens",
  ]);

  return input !== undefined || output !== undefined || inputCacheRead !== undefined || inputCacheWrite !== undefined
    ? { input, output, inputCacheRead, inputCacheWrite }
    : undefined;
};

export const calculateProviderPricingCost = ({
  providerKey,
  modelId,
  usage,
}: {
  providerKey?: string;
  modelId?: string;
  usage?: any;
}) => {
  const pricing = getProviderPricingForModel(providerKey, modelId);
  if (!pricing) return undefined;

  const tokens = usageTokens(usage);
  if (!tokens) return undefined;

  let cost = 0;
  let hasPricedUsage = false;

  const addCost = (tokenCount: number | undefined, price: unknown) => {
    if (tokenCount === undefined) return;
    const numericPrice = toFiniteNumber(price);
    if (numericPrice === undefined || numericPrice < 0) return;
    cost += tokenCount * numericPrice;
    hasPricedUsage = true;
  };

  addCost(tokens.input, pricing.input);
  addCost(tokens.output, pricing.output);
  addCost(tokens.inputCacheRead, pricing.input_cache_read);
  addCost(tokens.inputCacheWrite, pricing.input_cache_write);

  return hasPricedUsage ? cost : undefined;
};

export const createProviderPricingGatewayMetadata = (
  providerKey: string,
): Provider["createGatewayMetadata"] => ({ event, requestModel, currentGateway, directProviderEndpoint }) => {
  if (!directProviderEndpoint) return undefined;

  const cost = calculateProviderPricingCost({
    providerKey,
    modelId: requestModel,
    usage: usageFromEvent(event),
  });

  if (cost === undefined) return undefined;

  return {
    ...(currentGateway ?? {}),
    cost,
  };
};

