import { defaultProviderMetadata } from "./defaultProviderMetadata";

function isPlainObject(value: unknown): value is Record<string, any> {
  if (value === null || typeof value !== "object") return false;

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function cloneProviderMetadataValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cloneProviderMetadataValue(item)) as T;
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        cloneProviderMetadataValue(nestedValue),
      ])
    ) as T;
  }

  return value;
}

export const getAgentModelProviderKey = (modelId?: string) => {
  const trimmed = String(modelId ?? "").trim();
  if (!trimmed) return "";

  return trimmed.split("/").filter(Boolean)[0] ?? "";
};

export const getDefaultAgentModelProviderMetadata = (
  modelId?: string
): Record<string, any> => {
  const providerKey = getAgentModelProviderKey(modelId);
  if (!providerKey) return {};

  return cloneProviderMetadataValue(
    defaultProviderMetadata[providerKey as keyof typeof defaultProviderMetadata] ?? {}
  ) as Record<string, any>;
};

export const resolveAgentModelProviderMetadata = ({
  previousModelId,
  nextModelId,
  previousProviderMetadata,
  nextProviderMetadata,
}: {
  previousModelId?: string;
  nextModelId?: string;
  previousProviderMetadata?: Record<string, any>;
  nextProviderMetadata?: Record<string, any>;
}): Record<string, any> | undefined => {
  const previousProvider = getAgentModelProviderKey(previousModelId);
  const nextProvider = getAgentModelProviderKey(nextModelId);

  if (nextProvider && previousProvider !== nextProvider) {
    return getDefaultAgentModelProviderMetadata(nextModelId);
  }

  if (nextProviderMetadata !== undefined) {
    return cloneProviderMetadataValue(nextProviderMetadata);
  }

  if (previousProviderMetadata !== undefined) {
    return cloneProviderMetadataValue(previousProviderMetadata);
  }

  return undefined;
};
