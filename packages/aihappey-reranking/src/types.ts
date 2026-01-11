// types.ts
import type { RerankingResponse } from "aihappey-ai";

export type RerankingStorageKind = "indexeddb" | "local";

export interface RerankingItem {
  id: string;
  query: string;
  reranking: RerankingResponse;
  files: RerankingFileItem[]
}

export interface RerankingFileItem {
  name: string;
  text: string;
}

export interface RerankingStore {
  kind: RerankingStorageKind;
  add(
    query: string,
    files: RerankingFileItem[],
    reranking: RerankingResponse
  ): Promise<RerankingItem>;
  list(): Promise<RerankingItem[]>;
  delete(id: string): Promise<void>;
}
