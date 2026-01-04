import type { StateCreator } from "zustand";
import { defaultProviderSpeechMetadata } from "./defaultProviderSpeechMetadata";

export type SpeechSlice = {
  voice?: string;
  speechOutputFormat?: string;
  speechInstructions?: string;
  speed?: number;
  speechLanguage?: string;
  providerSpeechMetadata?: any
  setProviderSpeechMetadata: (metadata: any) => void;
  setVoice: (voice?: string) => void;
  setOutputFormat: (format?: string) => void;
  setInstructions: (instructions?: string) => void;
  setSpeed: (speed?: number) => void;
  setLanguage: (language?: string) => void;
};

export const createSpeechSlice: StateCreator<
  any,
  [],
  [],
  SpeechSlice
> = (set, get) => ({
  voice: undefined,
  speechOutputFormat: undefined,
  speechInstructions: undefined,
  speed: undefined,
  speechLanguage: undefined,
  providerSpeechMetadata: defaultProviderSpeechMetadata,

  setProviderSpeechMetadata: (providerMetadata) =>
    set(() => ({
      providerSpeechMetadata: { ...providerMetadata },
    })),
  setVoice: (voice) =>
    set(() => ({
      voice,
    })),

  setOutputFormat: (speechOutputFormat) =>
    set(() => ({
      speechOutputFormat,
    })),

  setInstructions: (speechInstructions) =>
    set(() => ({
      speechInstructions,
    })),

  setSpeed: (speed) =>
    set(() => ({
      speed,
    })),

  setLanguage: (speechLanguage) =>
    set(() => ({
      speechLanguage,
    })),
});
