const asRecord = (value: unknown): Record<string, any> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, any>
    : undefined;

export const resolveNativeRequestMetadata = ({
  providerRequestConfig,
  extraMetadata,
}: {
  providerRequestConfig?: Record<string, any>;
  extraMetadata?: Record<string, any>;
}) => {
  const merged = {
    ...(asRecord(providerRequestConfig?.metadata) ?? {}),
    ...(extraMetadata ?? {}),
  };

  return extraMetadata === undefined
    ? providerRequestConfig?.metadata
    : Object.keys(merged).length ? merged : providerRequestConfig?.metadata;
};

export const mergeNativeRequestBody = (config: Record<string, any> | undefined, body: Record<string, any>) => {
  const result = { ...(config ?? {}) };
  for (const [key, value] of Object.entries(body)) {
    if (value === undefined) continue;
    result[key] = ["reasoning", "text", "thinking", "output_config"].includes(key) && asRecord(value)
      ? { ...(asRecord(result[key]) ?? {}), ...value }
      : value;
  }
  return result;
};
