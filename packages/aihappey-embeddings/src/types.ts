import type { RawData } from "@orama/orama";

/** The exact JSON shape persisted for a document hub. */
export interface VectorStore {
  id: string;
  name: string;
  description: string;
  orama: RawData;
  chunkSize: number;
  chunkOverlap: number;
  model: string;
}

export interface CreateVectorStoreInput {
  name: string;
  description: string;
  chunkSize: number;
  chunkOverlap: number;
  model: string;
  vectorSize: number;
}

export interface UpdateVectorStoreInput {
  name: string;
  description: string;
  chunkSize: number;
  chunkOverlap: number;
}

export interface VectorStoreChunk {
  filename: string;
  content: string;
  embedding: number[];
}

export interface VectorStoreSource {
  filename: string;
  chunks: number;
  characters: number;
}

export interface VectorStoreSearchResult {
  id: string;
  filename: string;
  content: string;
  score: number;
}

export type VectorStoreSearchMode = "fulltext" | "hybrid" | "vector";

export interface VectorStoreModeSearchOptions {
  mode: VectorStoreSearchMode;
  /** Required for vector and hybrid search; ignored for full-text search. */
  vector?: number[];
  limit?: number;
  /** Orama vector similarity threshold. Used only by vector and hybrid search. */
  similarity?: number;
}

export type VectorStoreStorageKind = "indexeddb";

export interface  VectorStoreStore {
  readonly kind: VectorStoreStorageKind;
  list(): Promise<VectorStore[]>;
  get(id: string): Promise<VectorStore | undefined>;
  add(input: CreateVectorStoreInput): Promise<VectorStore>;
  update(id: string, input: UpdateVectorStoreInput): Promise<VectorStore>;
  replace(hub: VectorStore): Promise<VectorStore>;
  delete(id: string): Promise<void>;
}
