const PROVIDER_REQUEST_KEYS_BY_PROVIDER: Record<string, readonly string[]> = {
  openrouter: ["provider", "plugins"],
  requesty: ["requesty"],
};

const PROVIDER_SPECIFIC_REQUEST_KEYS = new Set(
  Object.values(PROVIDER_REQUEST_KEYS_BY_PROVIDER).flat(),
);

export const sanitizeProviderRequestConfigForProvider = (
  config?: Record<string, any>,
  providerKey?: string,
): Record<string, any> | undefined => {
  if (!config) return undefined;

  const normalizedProviderKey = String(providerKey ?? "").trim().toLowerCase();
  const allowedKeys = new Set(PROVIDER_REQUEST_KEYS_BY_PROVIDER[normalizedProviderKey] ?? []);

  const sanitized = Object.fromEntries(
    Object.entries(config).filter(([key]) =>
      !PROVIDER_SPECIFIC_REQUEST_KEYS.has(key) || allowedKeys.has(key),
    ),
  );

  return Object.keys(sanitized).length ? sanitized : undefined;
};
