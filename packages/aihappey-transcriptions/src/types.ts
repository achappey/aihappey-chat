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
  /**
   * Update an existing transcription item in storage.
   *
   * Intended for long-running / streaming use cases (e.g. Realtime transcription)
   * where we want to incrementally persist the transcript without creating many items.
   */
  update(
    id: string,
    patch: Partial<Pick<TranscriptionItem, "name" | "blob" | "transcription">>
  ): Promise<TranscriptionItem | undefined>;
  list(): Promise<TranscriptionItem[]>;
  delete(id: string): Promise<void>;
}
