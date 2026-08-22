import type { ModelOption } from "./models";

export const HIDDEN_DIRECT_MODEL_ID_SUFFIX = "__direct";

export const isDirectModelRoute = (model?: ModelOption | null) =>
  (model as any)?.route === "direct";

export const getModelProviderKey = (modelId?: string, model?: ModelOption | null) => {
  const explicitProviderKey = (model as any)?.sourceProviderKey ?? (model as any)?.providerKey;
  if (typeof explicitProviderKey === "string" && explicitProviderKey.trim().length > 0) {
    return explicitProviderKey.trim().toLowerCase();
  }

  return String(modelId ?? model?.id ?? "").split("/")[0]?.trim().toLowerCase() || undefined;
};

export const stripHiddenDirectModelIdSuffix = (modelId?: string) => {
  const value = String(modelId ?? "").trim();
  return value.endsWith(HIDDEN_DIRECT_MODEL_ID_SUFFIX)
    ? value.slice(0, -HIDDEN_DIRECT_MODEL_ID_SUFFIX.length)
    : value;
};

export const getModelDisplayId = (model?: ModelOption | null, fallbackModelId?: string) => {
  const displayId = (model as any)?.displayId;
  if (typeof displayId === "string" && displayId.trim().length > 0) return displayId.trim();

  const providerModelId = (model as any)?.providerModelId;
  if (typeof providerModelId === "string" && providerModelId.trim().length > 0) return providerModelId.trim();

  return stripHiddenDirectModelIdSuffix(fallbackModelId ?? model?.id);
};

export const getModelDisplayName = (model?: ModelOption | null, fallbackModelId?: string) =>
  model?.name || getModelDisplayId(model, fallbackModelId);

