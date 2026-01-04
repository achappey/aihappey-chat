import { get, set } from "idb-keyval";
import type { SpeechModelV3CallOptions, SpeechResponse } from "aihappey-ai";
import type { SpeechItem, SpeechStore } from "../types";

const DB_KEY = "aihappey_speech_v1";

async function load(): Promise<SpeechItem[]> {
  if (typeof window === "undefined") return [];
  try {
    return (await get(DB_KEY)) ?? [];
  } catch {
    return [];
  }
}

async function save(list: SpeechItem[]) {
  if (typeof window !== "undefined") {
    await set(DB_KEY, list);
  }
}

export class IndexedDBSpeechStore implements SpeechStore {
  readonly kind = "indexeddb" as const;

  private data: SpeechItem[] = [];
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

  add = async (
    input: SpeechModelV3CallOptions,
    speechResponse: SpeechResponse
  ): Promise<SpeechItem> => {
    await this.ensureLoaded();

    const item: SpeechItem = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      input,
      speechResponse,
    };

    this.data = [item, ...this.data];
    await this.commit();
    return item;
  };

  list = async (): Promise<SpeechItem[]> => {
    await this.ensureLoaded();
    return this.data;
  };

  delete = async (id: string): Promise<void> => {
    await this.ensureLoaded();
    this.data = this.data.filter((x) => x.id !== id);
    await this.commit();
  };
}

