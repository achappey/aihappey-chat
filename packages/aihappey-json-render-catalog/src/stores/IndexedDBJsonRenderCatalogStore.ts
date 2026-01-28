import { get, set } from "idb-keyval";
import type { JsonRenderCatalogItem, JsonRenderCatalogStore } from "../types";

const DB_KEY = "aihappey_json_render_catalogs_v1";

async function load(): Promise<JsonRenderCatalogItem[]> {
  if (typeof window === "undefined") return [];
  try {
    return (await get(DB_KEY)) ?? [];
  } catch {
    return [];
  }
}

async function save(list: JsonRenderCatalogItem[]) {
  if (typeof window !== "undefined") {
    await set(DB_KEY, list);
  }
}

export class IndexedDBJsonRenderCatalogStore implements JsonRenderCatalogStore {
  readonly kind = "indexeddb" as const;

  private data: JsonRenderCatalogItem[] = [];
  private loaded = false;

  private async ensureLoaded() {
    if (!this.loaded) {
      this.data = await load();
      this.loaded = true;
    }
  }

  private async commit() {
    await save(this.data);
  }

  list = async (): Promise<JsonRenderCatalogItem[]> => {
    await this.ensureLoaded();
    return this.data;
  };

  read = async (id: string): Promise<JsonRenderCatalogItem | undefined> => {
    await this.ensureLoaded();
    return this.data.find((item) => item.id === id);
  };

  create = async (
    item: Omit<JsonRenderCatalogItem, "id" | "createdAt" | "updatedAt">,
  ): Promise<JsonRenderCatalogItem> => {
    await this.ensureLoaded();

    const now = new Date().toISOString();
    const created: JsonRenderCatalogItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    this.data = [created, ...this.data];
    await this.commit();
    return created;
  };

  update = async (
    id: string,
    item: Omit<JsonRenderCatalogItem, "id" | "createdAt" | "updatedAt">,
  ): Promise<JsonRenderCatalogItem> => {
    await this.ensureLoaded();

    const index = this.data.findIndex((entry) => entry.id === id);
    if (index < 0) throw new Error("Catalog not found.");

    const createdAt = this.data[index]?.createdAt;
    const updated: JsonRenderCatalogItem = {
      ...item,
      id,
      createdAt,
      updatedAt: new Date().toISOString(),
    };

    this.data = [updated, ...this.data.filter((entry) => entry.id !== id)];
    await this.commit();
    return updated;
  };

  delete = async (id: string): Promise<void> => {
    await this.ensureLoaded();
    this.data = this.data.filter((entry) => entry.id !== id);
    await this.commit();
  };
}
