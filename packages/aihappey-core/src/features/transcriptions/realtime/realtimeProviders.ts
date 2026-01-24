export type RealtimeProviderId = string;

export const parseProviderIdFromModelId = (modelId?: string): RealtimeProviderId | null => {
  if (!modelId) return null;
  const idx = modelId.indexOf("/");
  if (idx <= 0) return null;
  return modelId.slice(0, idx);
};