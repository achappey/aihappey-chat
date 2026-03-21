import type { SpeechModelV4CallOptions, SpeechResponse } from "aihappey-ai";

export type SpeechStorageKind = "indexeddb" | "local";

/**
 * Input payload used to generate speech.
 *
 * Note: `language_` uses underscore for parity with upstream callers.
 */

export interface SpeechItem {
  /** Client-generated id (backend does not provide one). */
  id: string;
  createdAt: Date;
  input: SpeechModelV4CallOptions;
  /** Raw SpeechResponse payload (“straight json”). */
  speechResponse: SpeechResponse;
}

export interface SpeechStore {
  readonly kind: SpeechStorageKind;

  add(input: SpeechModelV4CallOptions, speechResponse: SpeechResponse): Promise<SpeechItem>;
  list(): Promise<SpeechItem[]>;
  delete(id: string): Promise<void>;
}

