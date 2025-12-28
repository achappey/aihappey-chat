// stores/IndexedDBToolStore.ts
import { get, set } from "idb-keyval";
import type { StoredTool, ToolStore } from "../types";

const DB_KEY = "aihappey_tools_v1";

async function load(): Promise<StoredTool[]> {
  if (typeof window === "undefined") return [];
  try {
    return (await get(DB_KEY)) ?? [];
  } catch {
    return [];
  }
}

async function save(list: StoredTool[]) {
  if (typeof window !== "undefined") {
    await set(DB_KEY, list);
  }
}

export class IndexedDBToolStore implements ToolStore {
  readonly kind = "indexeddb" as const;

  private data: StoredTool[] = [];
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

  add = async (tool: StoredTool): Promise<StoredTool> => {
    await this.ensureLoaded();
    this.data = [tool, ...this.data];
    await this.commit();
    return tool;
  };

  list = async (): Promise<StoredTool[]> => {
    await this.ensureLoaded();
    return this.data;
  };

  delete = async (id: string): Promise<void> => {
    await this.ensureLoaded();
    this.data = this.data.filter(t => t.id !== id);
    await this.commit();
  };
}
