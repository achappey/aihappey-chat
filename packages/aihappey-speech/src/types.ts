import type { SpeechModelV4CallOptions, SpeechResponse } from "aihappey-ai";

export type SpeechStorageKind = "indexeddb" | "local";
export type SpeechInput = SpeechModelV4CallOptions & {
  /** Selected request model used for the speech generation. */
  model?: string;
};

/**
 * Input payload used to generate speech.
 *
 * Note: `language_` uses underscore for parity with upstream callers.
 */

export interface SpeechItem {
  /** Client-generated id (backend does not provide one). */
  id: string;
  createdAt: Date;
  input: SpeechInput;
  /** Raw SpeechResponse payload (“straight json”). */
  speechResponse: SpeechResponse;
}

export interface SpeechStore {
  readonly kind: SpeechStorageKind;

  add(input: SpeechInput, speechResponse: SpeechResponse): Promise<SpeechItem>;
  list(): Promise<SpeechItem[]>;
  delete(id: string): Promise<void>;
}

