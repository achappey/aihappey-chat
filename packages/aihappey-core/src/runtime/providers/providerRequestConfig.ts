export const sanitizeProviderRequestConfigForProvider = (
  config?: Record<string, any>,
  providerKey?: string,
  _options?: { endpointId?: string },
): Record<string, any> | undefined => {
  if (!config) return undefined;

  const sanitized = Object.fromEntries(
    Object.entries(config).filter(([key, value]) => {
      const normalizedKey = key.trim().toLowerCase();
      if (!normalizedKey || value === undefined) return false;
      if (normalizedKey === "headers") return false;
      if (providerKey?.trim().toLowerCase() === "anthropic" && normalizedKey === "anthropic-beta") return false;
      if (providerKey?.trim().toLowerCase() === "openai" && normalizedKey === "openai-beta") return false;
      return true;
    }),
  );

  return Object.keys(sanitized).length ? sanitized : undefined;
};
