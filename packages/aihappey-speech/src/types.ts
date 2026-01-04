import type { SpeechModelV3CallOptions, SpeechResponse } from "aihappey-ai";

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
  input: SpeechModelV3CallOptions;
  /** Raw SpeechResponse payload (“straight json”). */
  speechResponse: SpeechResponse;
}

export interface SpeechStore {
  readonly kind: SpeechStorageKind;

  add(input: SpeechModelV3CallOptions, speechResponse: SpeechResponse): Promise<SpeechItem>;
  list(): Promise<SpeechItem[]>;
  delete(id: string): Promise<void>;
}

