// stores/IndexedDBTranscriptionStore.ts
import { get, set } from "idb-keyval";
import type { RerankingResponse } from "aihappey-ai";
import { RerankingFileItem, RerankingItem, RerankingStore } from "../types";

const DB_KEY = "aihappey_transcriptions_v1";

async function load(): Promise<RerankingItem[]> {
  if (typeof window === "undefined") return [];
  try {
    return (await get(DB_KEY)) ?? [];
  } catch {
    return [];
  }
}

async function save(list: RerankingItem[]) {
  if (typeof window !== "undefined") {
    await set(DB_KEY, list);
  }
}

export class IndexedDBRerankingStore implements RerankingStore {
  readonly kind = "indexeddb" as const;

  private data: RerankingItem[] = [];
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
    query: string,
    files: RerankingFileItem[],
    reranking: RerankingResponse
  ): Promise<RerankingItem> => {
    await this.ensureLoaded();

    const item: RerankingItem = {
      id: crypto.randomUUID(),
      query,
      files,
      reranking,
    };

    this.data = [item, ...this.data];
    await this.commit();
    return item;
  };

  list = async (): Promise<RerankingItem[]> => {
    await this.ensureLoaded();
    return this.data;
  };

  delete = async (id: string): Promise<void> => {
    await this.ensureLoaded();
    this.data = this.data.filter((x) => x.id !== id);
    await this.commit();
  };
}
