// stores/IndexedDBTranscriptionStore.ts
import { get, set } from "idb-keyval";
import type {
  TranscriptionItem,
  TranscriptionStore,
} from "../types";
import type { TranscriptionResponse } from "aihappey-ai";

const DB_KEY = "aihappey_transcriptions_v1";

async function load(): Promise<TranscriptionItem[]> {
  if (typeof window === "undefined") return [];
  try {
    return (await get(DB_KEY)) ?? [];
  } catch {
    return [];
  }
}

async function save(list: TranscriptionItem[]) {
  if (typeof window !== "undefined") {
    await set(DB_KEY, list);
  }
}

export class IndexedDBTranscriptionStore implements TranscriptionStore {
  readonly kind = "indexeddb" as const;

  private data: TranscriptionItem[] = [];
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
    name: string,
    blob: Blob,
    transcription: TranscriptionResponse
  ): Promise<TranscriptionItem> => {
    await this.ensureLoaded();

    const item: TranscriptionItem = {
      id: crypto.randomUUID(),
      name,
      blob,
      transcription,
      createdAt: new Date(),
    };

    this.data = [item, ...this.data];
    await this.commit();
    return item;
  };

  update = async (
    id: string,
    patch: Partial<Pick<TranscriptionItem, "name" | "blob" | "transcription">>
  ): Promise<TranscriptionItem | undefined> => {
    await this.ensureLoaded();

    const idx = this.data.findIndex((x) => x.id === id);
    if (idx < 0) return undefined;

    const current = this.data[idx];
    const updated: TranscriptionItem = {
      ...current,
      ...patch,
    };

    // Keep ordering stable (do not move item to top); callers may manage ordering.
    this.data = this.data.map((x, i) => (i === idx ? updated : x));
    await this.commit();
    return updated;
  };

  list = async (): Promise<TranscriptionItem[]> => {
    await this.ensureLoaded();
    return this.data;
  };

  delete = async (id: string): Promise<void> => {
    await this.ensureLoaded();
    this.data = this.data.filter((x) => x.id !== id);
    await this.commit();
  };
}
