// types.ts
import type { TranscriptionResponse } from "aihappey-ai";

export type TranscriptionStorageKind = "indexeddb" | "local";

export interface TranscriptionItem {
  id: string;
  name: string;
  blob: Blob;
  transcription: TranscriptionResponse;
  createdAt: Date;
}

export interface TranscriptionStore {
  kind: TranscriptionStorageKind;
  add(
    name: string,
    blob: Blob,
    transcription: TranscriptionResponse
  ): Promise<TranscriptionItem>;
  list(): Promise<TranscriptionItem[]>;
  delete(id: string): Promise<void>;
}
