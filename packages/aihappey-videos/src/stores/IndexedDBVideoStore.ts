import { get, set } from "idb-keyval";
import type { VideoResponse } from "aihappey-ai";
import type { VideoItem, VideoStore } from "../types";

const DB_KEY = "aihappey_videos_v1";

async function load(): Promise<VideoItem[]> {
  if (typeof window === "undefined") return [];
  const data = (await get(DB_KEY)) as VideoItem[] | undefined;
  return data ?? [];
}

async function save(list: VideoItem[]) {
  if (typeof window !== "undefined") {
    await set(DB_KEY, list);
  }
}

export class IndexedDBVideoStore implements VideoStore {
  readonly kind = "indexeddb" as const;
  private data: VideoItem[] = [];
  private loaded = false;

  private ensureLoaded = async () => {
    if (!this.loaded) {
      this.data = await load();
      this.loaded = true;
    }
  };

  add = async (videoResponse: VideoResponse): Promise<VideoItem> => {
    await this.ensureLoaded();
    const item: VideoItem = {
      id: crypto.randomUUID(),
      videoResponse,
    };
    this.data = [item, ...this.data];
    await save(this.data);
    return item;
  };

  list = async (): Promise<VideoItem[]> => {
    await this.ensureLoaded();
    return this.data;
  };

  update = async (id: string, videoResponse: VideoResponse): Promise<VideoItem> => {
    await this.ensureLoaded();
    const idx = this.data.findIndex((x) => x.id === id);
    if (idx === -1) {
      throw new Error(`VideoItem not found: ${id}`);
    }

    const updated: VideoItem = { ...this.data[idx], videoResponse };
    this.data = this.data.map((x) => (x.id === id ? updated : x));
    await save(this.data);
    return updated;
  };

  delete = async (id: string): Promise<void> => {
    await this.ensureLoaded();
    this.data = this.data.filter((x) => x.id !== id);
    await save(this.data);
  };
}
