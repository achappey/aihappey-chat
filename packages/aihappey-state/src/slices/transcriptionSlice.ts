import type { StateCreator } from "zustand";
import { defaultProviderTranscriptionMetadata, normalizeProviderTranscriptionMetadata } from "./defaultProviderTranscriptionMetadata";

export type TranscriptionSlice = {
  providerTranscriptionMetadata?: any
  setProviderTranscriptionMetadata: (metadata: any) => void;
};

export const createTranscriptionSlice: StateCreator<
  any,
  [],
  [],
  TranscriptionSlice
> = (set, get) => ({
  providerTranscriptionMetadata: defaultProviderTranscriptionMetadata,
 
  setProviderTranscriptionMetadata: (providerMetadata) =>
    set(() => ({
      providerTranscriptionMetadata: normalizeProviderTranscriptionMetadata(providerMetadata),
    })),
});
