import { get, set } from "idb-keyval";
import { save } from "@orama/orama";
import { createVectorStoreDatabase, getVectorStoreChunkCount } from "../oramaVectorStore";
import { validateChunkSettings } from "../chunking";
import type {
  CreateVectorStoreInput,
  VectorStore,
  VectorStoreStore,
  UpdateVectorStoreInput,
} from "../types";

const DB_KEY = "aihappey_embeddings_v1";

const load = async (): Promise<VectorStore[]> => {
  if (typeof window === "undefined") return [];
  try {
    return (await get<VectorStore[]>(DB_KEY)) ?? [];
  } catch {
    return [];
  }
};

const persist = async (items: VectorStore[]) => {
  if (typeof window !== "undefined") await set(DB_KEY, items);
};

export class IndexedDBVectorStoreStore implements VectorStoreStore {
  readonly kind = "indexeddb" as const;
  private data: VectorStore[] = [];
  private loaded = false;

  private async ensureLoaded() {
    if (!this.loaded) {
      this.data = await load();
      this.loaded = true;
    }
  }

  list = async () => {
    await this.ensureLoaded();
    return this.data;
  };

  get = async (id: string) => {
    await this.ensureLoaded();
    return this.data.find((hub) => hub.id === id);
  };

  add = async (input: CreateVectorStoreInput) => {
    await this.ensureLoaded();
    validateChunkSettings(input.chunkSize, input.chunkOverlap);
    const name = input.name.trim();
    const model = input.model.trim();
    if (!name) throw new Error("Vector store name is required.");
    if (!model) throw new Error("Embedding model is required.");
    const hub: VectorStore = {
      id: crypto.randomUUID(),
      name,
      description: input.description.trim(),
      orama: save(createVectorStoreDatabase(input.vectorSize)),
      chunkSize: input.chunkSize,
      chunkOverlap: input.chunkOverlap,
      model,
    };
    this.data = [hub, ...this.data];
    await persist(this.data);
    return hub;
  };

  update = async (id: string, input: UpdateVectorStoreInput) => {
    await this.ensureLoaded();
    const current = this.data.find((hub) => hub.id === id);
    if (!current) throw new Error(`Vector store not found: ${id}`);
    const name = input.name.trim();
    if (!name) throw new Error("Vector store name is required.");
    const hasChunks = getVectorStoreChunkCount(current) > 0;
    if (!hasChunks) validateChunkSettings(input.chunkSize, input.chunkOverlap);
    const updated: VectorStore = {
      ...current,
      name,
      description: input.description.trim(),
      chunkSize: hasChunks ? current.chunkSize : input.chunkSize,
      chunkOverlap: hasChunks ? current.chunkOverlap : input.chunkOverlap,
    };
    this.data = this.data.map((hub) => hub.id === id ? updated : hub);
    await persist(this.data);
    return updated;
  };

  replace = async (hub: VectorStore) => {
    await this.ensureLoaded();
    if (!this.data.some((item) => item.id === hub.id)) throw new Error(`Vector store not found: ${hub.id}`);
    this.data = this.data.map((item) => item.id === hub.id ? hub : item);
    await persist(this.data);
    return hub;
  };

  upsert = async (hub: VectorStore) => {
    await this.ensureLoaded();
    this.data = this.data.some((item) => item.id === hub.id)
      ? this.data.map((item) => item.id === hub.id ? hub : item)
      : [hub, ...this.data];
    await persist(this.data);
    return hub;
  };

  delete = async (id: string) => {
    await this.ensureLoaded();
    this.data = this.data.filter((hub) => hub.id !== id);
    await persist(this.data);
  };
}
