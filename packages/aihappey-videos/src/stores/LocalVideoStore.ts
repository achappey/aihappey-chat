import type { VideoResponse } from "aihappey-ai";
import type { VideoItem, VideoStore } from "../types";

const LS_KEY = "aihappey_videos_v1";

function load(): VideoItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as VideoItem[];
  } catch {
    return [];
  }
}

function save(list: VideoItem[]) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LS_KEY, JSON.stringify(list));
  }
}

export class LocalVideoStore implements VideoStore {
  readonly kind = "local" as const;
  private data: VideoItem[];

  constructor() {
    this.data = load();
  }

  add = async (videoResponse: VideoResponse): Promise<VideoItem> => {
    const item: VideoItem = {
      id: crypto.randomUUID(),
      videoResponse,
    };
    this.data = [item, ...this.data];
    save(this.data);
    return item;
  };

  list = async (): Promise<VideoItem[]> => {
    return this.data;
  };

  update = async (id: string, videoResponse: VideoResponse): Promise<VideoItem> => {
    const idx = this.data.findIndex((x) => x.id === id);
    if (idx === -1) {
      throw new Error(`VideoItem not found: ${id}`);
    }

    const updated: VideoItem = { ...this.data[idx], videoResponse };
    this.data = this.data.map((x) => (x.id === id ? updated : x));
    save(this.data);
    return updated;
  };

  delete = async (id: string): Promise<void> => {
    this.data = this.data.filter((x) => x.id !== id);
    save(this.data);
  };
}
