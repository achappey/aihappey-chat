const asRecord = (value: unknown): Record<string, any> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, any>
    : undefined;

export const resolveNativeRequestMetadata = ({
  providerMetadata,
  providerRequestConfig,
  omitProviderMetadataInNativeMetadata,
  extraMetadata,
}: {
  providerMetadata?: unknown;
  providerRequestConfig?: Record<string, any>;
  omitProviderMetadataInNativeMetadata?: boolean;
  extraMetadata?: Record<string, any>;
}) => {
  const merged = {
    ...(!omitProviderMetadataInNativeMetadata ? (asRecord(providerMetadata) ?? {}) : {}),
    ...(asRecord(providerRequestConfig?.metadata) ?? {}),
    ...(extraMetadata ?? {}),
  };

  return Object.keys(merged).length ? merged : undefined;
};
