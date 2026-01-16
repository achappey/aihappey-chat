import type { ImageResponse } from "aihappey-ai";
import type { ImageItem, ImageStore } from "../types";

const LS_KEY = "aihappey_images_v1";

function load(): ImageItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function save(list: ImageItem[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  }
}

export class LocalImageStore implements ImageStore {
  readonly kind = "local" as const;
  private data: ImageItem[];

  constructor() {
    this.data = load();
  }

  private commit = () => {
    save(this.data);
  };

  add = async (imageResponse: ImageResponse): Promise<ImageItem> => {
    const item: ImageItem = {
      id: crypto.randomUUID(),
      imageResponse,
    };
    this.data = [item, ...this.data];
    this.commit();
    return item;
  };

  list = async (): Promise<ImageItem[]> => {
    return this.data;
  };

  update = async (id: string, imageResponse: ImageResponse): Promise<ImageItem> => {
    const idx = this.data.findIndex((x) => x.id === id);
    if (idx === -1) {
      throw new Error(`ImageItem not found: ${id}`);
    }

    const updated: ImageItem = { ...this.data[idx], imageResponse };
    this.data = this.data.map((x) => (x.id === id ? updated : x));
    this.commit();
    return updated;
  };

  delete = async (id: string): Promise<void> => {
    this.data = this.data.filter((x) => x.id !== id);
    this.commit();
  };
}

