/** SpaceX AI is canonical. Keep old saved xAI options readable without emitting the alias. */
export const normalizeSpaceXAiProviderMetadata = (metadata: any): Record<string, any> => {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return {};
  const { xai, ...providers } = metadata;
  const spacexai = providers.spacexai ?? xai;
  return spacexai === undefined ? providers : { ...providers, spacexai };
};
