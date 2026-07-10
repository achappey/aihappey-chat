const PROVIDER_REQUEST_KEYS_BY_PROVIDER: Record<string, readonly string[]> = {
  openrouter: ["provider", "plugins"],
  requesty: ["requesty"],
};

const PROVIDER_SPECIFIC_REQUEST_KEYS = new Set(
  Object.values(PROVIDER_REQUEST_KEYS_BY_PROVIDER).flat(),
);

const ENDPOINT_RESTRICTED_REQUEST_KEYS: Record<string, readonly string[]> = {
  include: ["/v1/responses"],
};

export const getProviderKeyFromRequest = (request: { providerMetadata?: Record<string, any> }) =>
  Object.keys(request.providerMetadata ?? {})[0]?.trim().toLowerCase() || undefined;

export const sanitizeProviderRequestConfigForProvider = (
  config?: Record<string, any>,
  providerKey?: string,
  options?: { endpointId?: string },
): Record<string, any> | undefined => {
  if (!config) return undefined;

  const normalizedProviderKey = String(providerKey ?? "").trim().toLowerCase();
  const allowedKeys = new Set(PROVIDER_REQUEST_KEYS_BY_PROVIDER[normalizedProviderKey] ?? []);
  const endpointId = String(options?.endpointId ?? "").trim();

  const sanitized = Object.fromEntries(
    Object.entries(config).filter(([key]) => {
      const normalizedKey = key.trim().toLowerCase();
      if (!normalizedKey || normalizedKey === "headers") return false;
      if (normalizedProviderKey === "anthropic" && normalizedKey === "anthropic-beta") return false;
      if (normalizedProviderKey === "openai" && normalizedKey === "openai-beta") return false;

      return ((!ENDPOINT_RESTRICTED_REQUEST_KEYS[key] || !endpointId || ENDPOINT_RESTRICTED_REQUEST_KEYS[key]?.includes(endpointId))
        && (!PROVIDER_SPECIFIC_REQUEST_KEYS.has(key) || allowedKeys.has(key)));
    }),
  );

  return Object.keys(sanitized).length ? sanitized : undefined;
};
