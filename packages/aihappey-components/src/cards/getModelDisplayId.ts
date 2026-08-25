export const getModelDisplayId = (modelId: string, hasProviderIcons: boolean): string => {
  if (!hasProviderIcons) return modelId;

  const separatorIndex = modelId.indexOf("/");
  return separatorIndex >= 0 && separatorIndex < modelId.length - 1
    ? modelId.slice(separatorIndex + 1)
    : modelId;
};
