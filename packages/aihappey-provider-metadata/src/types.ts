export type ProviderMetadataValue = any;

export type ProviderMetadataRecord<T = ProviderMetadataValue> = Record<string, T>;

export type ProviderMetadataHydrationSource = "indexeddb" | "legacy" | "defaults";

export interface ProviderMetadataHydrationResult<T = ProviderMetadataValue> {
  source: ProviderMetadataHydrationSource;
  record: ProviderMetadataRecord<T>;
}

export interface ProviderMetadataBucketStore<T = ProviderMetadataValue> {
  readonly kind: "indexeddb";
  readonly bucket: string;
  list(): Promise<ProviderMetadataRecord<T>>;
  get(providerId: string): Promise<T | undefined>;
  set(providerId: string, value: T | undefined): Promise<void>;
  merge(items: ProviderMetadataRecord<T>): Promise<ProviderMetadataRecord<T>>;
  replaceAll(items: ProviderMetadataRecord<T>): Promise<ProviderMetadataRecord<T>>;
  clear(): Promise<void>;
  isEmpty(): Promise<boolean>;
}
