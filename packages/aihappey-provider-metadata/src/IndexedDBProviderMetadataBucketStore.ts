import {
  clear,
  createStore as createKeyValueStore,
  del,
  entries,
  get,
  keys,
  set,
} from "idb-keyval";
import type {
  ProviderMetadataBucketStore,
  ProviderMetadataRecord,
  ProviderMetadataValue,
} from "./types";

const DB_NAME = "aihappey_provider_metadata";

function normalizeRecord<T>(items?: ProviderMetadataRecord<T>) {
  return Object.fromEntries(
    Object.entries(items ?? {}).filter(
      ([providerId, value]) => Boolean(providerId) && value !== undefined
    )
  ) as ProviderMetadataRecord<T>;
}

export class IndexedDBProviderMetadataBucketStore<T = ProviderMetadataValue>
implements ProviderMetadataBucketStore<T> {
  readonly kind = "indexeddb" as const;
  readonly bucket: string;

  private readonly store;

  constructor(bucket: string, dbName = DB_NAME) {
    this.bucket = bucket;
    this.store = createKeyValueStore(dbName, bucket);
  }

  private canUseIndexedDb() {
    return typeof window !== "undefined";
  }

  list = async (): Promise<ProviderMetadataRecord<T>> => {
    if (!this.canUseIndexedDb()) return {};

    try {
      const values = await entries<string, T>(this.store);
      return normalizeRecord(Object.fromEntries(values));
    } catch {
      return {};
    }
  };

  get = async (providerId: string): Promise<T | undefined> => {
    if (!providerId || !this.canUseIndexedDb()) return undefined;

    try {
      return await get<T>(providerId, this.store);
    } catch {
      return undefined;
    }
  };

  set = async (providerId: string, value: T | undefined): Promise<void> => {
    if (!providerId || !this.canUseIndexedDb()) return;

    if (value === undefined) {
      await del(providerId, this.store);
      return;
    }

    await set(providerId, value, this.store);
  };

  merge = async (
    items: ProviderMetadataRecord<T>
  ): Promise<ProviderMetadataRecord<T>> => {
    const nextItems = normalizeRecord(items);
    const currentItems = await this.list();
    const mergedItems = {
      ...currentItems,
      ...nextItems,
    };

    await Promise.all(
      Object.entries(nextItems).map(([providerId, value]) =>
        this.set(providerId, value)
      )
    );

    return mergedItems;
  };

  replaceAll = async (
    items: ProviderMetadataRecord<T>
  ): Promise<ProviderMetadataRecord<T>> => {
    const nextItems = normalizeRecord(items);

    if (!this.canUseIndexedDb()) return nextItems;

    const existingKeys = await keys(this.store);
    const nextProviderIds = new Set(Object.keys(nextItems));

    await Promise.all(
      existingKeys
        .map((key) => String(key))
        .filter((providerId) => !nextProviderIds.has(providerId))
        .map((providerId) => del(providerId, this.store))
    );

    await Promise.all(
      Object.entries(nextItems).map(([providerId, value]) =>
        set(providerId, value, this.store)
      )
    );

    return nextItems;
  };

  clear = async (): Promise<void> => {
    if (!this.canUseIndexedDb()) return;
    await clear(this.store);
  };

  isEmpty = async (): Promise<boolean> => {
    const existingKeys = await this.list();
    return Object.keys(existingKeys).length === 0;
  };
}
