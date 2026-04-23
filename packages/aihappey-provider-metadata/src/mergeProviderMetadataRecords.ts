import type {
  ProviderMetadataHydrationResult,
  ProviderMetadataRecord,
  ProviderMetadataValue,
} from "./types";

function isPlainObject(value: unknown): value is Record<string, any> {
  if (value === null || typeof value !== "object") return false;

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function cloneProviderMetadataValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cloneProviderMetadataValue(item)) as T;
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        cloneProviderMetadataValue(nestedValue),
      ])
    ) as T;
  }

  return value;
}

function mergeProviderMetadataValue<T>(defaults: T, override: T): T {
  if (override === undefined) return cloneProviderMetadataValue(defaults);
  if (defaults === undefined) return cloneProviderMetadataValue(override);

  if (Array.isArray(override)) {
    return cloneProviderMetadataValue(override);
  }

  if (isPlainObject(defaults) && isPlainObject(override)) {
    const defaultRecord = defaults as Record<string, any>;
    const overrideRecord = override as Record<string, any>;
    const keys = new Set([
      ...Object.keys(defaultRecord),
      ...Object.keys(overrideRecord),
    ]);

    const merged: Record<string, any> = {};

    keys.forEach((key) => {
      merged[key] = mergeProviderMetadataValue(defaultRecord[key], overrideRecord[key]);
    });

    return merged as T;
  }

  return cloneProviderMetadataValue(override);
}

export function isProviderMetadataRecord(
  value: unknown
): value is ProviderMetadataRecord {
  return isPlainObject(value);
}

export function hasProviderMetadataEntries(
  value: unknown
): value is ProviderMetadataRecord {
  return isProviderMetadataRecord(value) && Object.keys(value).length > 0;
}

export function mergeProviderMetadataRecords<T = ProviderMetadataValue>(
  defaults?: ProviderMetadataRecord<T>,
  override?: ProviderMetadataRecord<T>
): ProviderMetadataRecord<T> {
  const safeDefaults: ProviderMetadataRecord<T> = isProviderMetadataRecord(defaults)
    ? defaults as ProviderMetadataRecord<T>
    : {};
  const safeOverride: ProviderMetadataRecord<T> = isProviderMetadataRecord(override)
    ? override as ProviderMetadataRecord<T>
    : {};

  const keys = new Set([
    ...Object.keys(safeDefaults),
    ...Object.keys(safeOverride),
  ]);

  const merged: ProviderMetadataRecord<T> = {};

  keys.forEach((key) => {
    const nextValue = mergeProviderMetadataValue(
      safeDefaults[key],
      safeOverride[key]
    );

    if (nextValue !== undefined) {
      merged[key] = nextValue;
    }
  });

  return merged;
}

export function resolveProviderMetadataHydration<T = ProviderMetadataValue>({
  defaults,
  indexedDb,
  legacy,
}: {
  defaults?: ProviderMetadataRecord<T>;
  indexedDb?: ProviderMetadataRecord<T>;
  legacy?: ProviderMetadataRecord<T>;
}): ProviderMetadataHydrationResult<T> {
  if (hasProviderMetadataEntries(indexedDb)) {
    return {
      source: "indexeddb",
      record: mergeProviderMetadataRecords(defaults, indexedDb),
    };
  }

  if (hasProviderMetadataEntries(legacy)) {
    return {
      source: "legacy",
      record: mergeProviderMetadataRecords(defaults, legacy),
    };
  }

  return {
    source: "defaults",
    record: mergeProviderMetadataRecords(defaults),
  };
}
