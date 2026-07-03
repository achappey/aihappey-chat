export const sanitizeProviderRequestConfigForProvider = (
  config?: Record<string, any>,
  _providerKey?: string,
  _options?: { endpointId?: string },
): Record<string, any> | undefined => {
  if (!config) return undefined;

  const sanitized = Object.fromEntries(
    Object.entries(config).filter(([key, value]) => key.trim().length > 0 && value !== undefined),
  );

  return Object.keys(sanitized).length ? sanitized : undefined;
};
