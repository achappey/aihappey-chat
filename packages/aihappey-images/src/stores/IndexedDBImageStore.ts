import { get, set } from "idb-keyval";
import type { ImageResponse } from "aihappey-ai";
import type { ImageItem, ImageStore } from "../types";

const DB_KEY = "aihappey_images_v1";

async function load(): Promise<ImageItem[]> {
  if (typeof window === "undefined") return [];
  try {
    return (await get(DB_KEY)) ?? [];
  } catch {
    return [];
  }
}

async function save(list: ImageItem[]) {
  if (typeof window !== "undefined") {
    await set(DB_KEY, list);
  }
}

export class IndexedDBImageStore implements ImageStore {
  readonly kind = "indexeddb" as const;
  private data: ImageItem[] = [];
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

  add = async (imageResponse: ImageResponse): Promise<ImageItem> => {
    await this.ensureLoaded();
    const item: ImageItem = {
      id: crypto.randomUUID(),
      imageResponse,
    };
    this.data = [item, ...this.data];
    await this.commit();
    return item;
  };

  list = async (): Promise<ImageItem[]> => {
    await this.ensureLoaded();
    return this.data;
  };

  delete = async (id: string): Promise<void> => {
    await this.ensureLoaded();
    this.data = this.data.filter((x) => x.id !== id);
    await this.commit();
  };
}

