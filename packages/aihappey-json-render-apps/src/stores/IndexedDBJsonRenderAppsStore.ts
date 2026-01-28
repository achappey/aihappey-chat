import { get, set } from "idb-keyval";
import type { JsonRenderAppItem, JsonRenderAppsStore } from "../types";

const DB_KEY = "aihappey_json_render_apps_v1";

async function load(): Promise<JsonRenderAppItem[]> {
  if (typeof window === "undefined") return [];
  try {
    return (await get(DB_KEY)) ?? [];
  } catch {
    return [];
  }
}

async function save(list: JsonRenderAppItem[]) {
  if (typeof window !== "undefined") {
    await set(DB_KEY, list);
  }
}

export class IndexedDBJsonRenderAppsStore implements JsonRenderAppsStore {
  readonly kind = "indexeddb" as const;

  private data: JsonRenderAppItem[] = [];
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

  list = async (): Promise<JsonRenderAppItem[]> => {
    await this.ensureLoaded();
    return this.data;
  };

  read = async (id: string): Promise<JsonRenderAppItem | undefined> => {
    await this.ensureLoaded();
    return this.data.find((item) => item.id === id);
  };

  create = async (
    item: Omit<JsonRenderAppItem, "id" | "createdAt" | "updatedAt">,
  ): Promise<JsonRenderAppItem> => {
    await this.ensureLoaded();

    const now = new Date().toISOString();
    const created: JsonRenderAppItem = {
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
    item: Omit<JsonRenderAppItem, "id" | "createdAt" | "updatedAt">,
  ): Promise<JsonRenderAppItem> => {
    await this.ensureLoaded();

    const index = this.data.findIndex((entry) => entry.id === id);
    if (index < 0) throw new Error("App not found.");

    const createdAt = this.data[index]?.createdAt;
    const updated: JsonRenderAppItem = {
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
