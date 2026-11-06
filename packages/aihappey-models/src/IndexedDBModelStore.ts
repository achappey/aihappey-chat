import { del, get, set } from "idb-keyval";
import { MAX_CATALOG_CHARACTERS, readModelSnapshot } from "./catalog.js";
import type { CatalogModel, LocalModelStore, ModelCatalogSnapshot } from "./catalog.js";

const keyFor = (scope: string) => {
  if (!/^[a-f0-9]{64}$/.test(scope)) throw new Error("Invalid model catalog scope");
  return `aihappey_models_v1:${scope}`;
};

/** Best-effort, disposable catalog storage, separate from user-owned primitive data. */
export class IndexedDBModelStore implements LocalModelStore {
  readonly kind = "indexeddb" as const;

  async load<T extends CatalogModel>(scope: string): Promise<ModelCatalogSnapshot<T> | undefined> {
    try {
      if (typeof window === "undefined") return undefined;
      const value = await get(keyFor(scope));
      const json = JSON.stringify(value);
      if (!json || json.length > MAX_CATALOG_CHARACTERS) return undefined;
      return readModelSnapshot<T>(JSON.parse(json));
    } catch { return undefined; }
  }

  async replace<T extends CatalogModel>(scope: string, snapshot: ModelCatalogSnapshot<T>): Promise<void> {
    try {
      if (typeof window === "undefined" || !readModelSnapshot(snapshot)) return;
      const json = JSON.stringify(snapshot);
      if (json.length > MAX_CATALOG_CHARACTERS) return;
      await set(keyFor(scope), JSON.parse(json));
    } catch { /* A quota/privacy/storage failure must not fail successful discovery. */ }
  }

  async clear(scope: string): Promise<void> {
    try { if (typeof window !== "undefined") await del(keyFor(scope)); }
    catch { /* Cache cleanup is best effort too. */ }
  }
}

export const localModelStore: LocalModelStore = new IndexedDBModelStore();
