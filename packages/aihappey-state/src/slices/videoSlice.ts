import type { StateCreator } from "zustand";
import { defaultProviderVideoMetadata } from "./defaultProviderVideoMetadata";

export type VideoSlice = {
  duration?: number | undefined;
  resolution?: string | undefined;
  fps?: number | undefined;
  aspectRatio?: string | undefined;
  n: number;
  maxVideosPerCall?: number;
  generateAudio: boolean;
  providerVideoMetadata?: any;
  seed?: number | undefined;
  setSeed: (seed: number | undefined) => void;
  setN: (n: number) => void;
  setAspectRatio: (aspectRatio: string | undefined) => void;
  setResolution: (resolution: string | undefined) => void;
  setDuration: (duration: number | undefined) => void;
  setFps: (fps: number | undefined) => void;
  setMaxVideosPerCall: (maxVideosPerCall: number | undefined) => void;
  setGenerateAudio: (generateAudio: boolean) => void;
  setProviderVideoMetadata: (metadata: any) => void;
};

export const createVideoSlice: StateCreator<
  any,
  [],
  [],
  VideoSlice
> = (set) => ({
  duration: undefined,
  resolution: undefined,
  fps: undefined,
  aspectRatio: undefined,
  n: 1,
  seed: undefined,
  maxVideosPerCall: undefined,
  generateAudio: false,
  providerVideoMetadata: defaultProviderVideoMetadata,
  setGenerateAudio: (generateAudio) =>
    set(() => ({
      generateAudio,
    })),
  setMaxVideosPerCall: (maxVideosPerCall) =>
    set(() => ({
      maxVideosPerCall,
    })),
  setProviderVideoMetadata: (providerMetadata) =>
    set(() => ({
      providerVideoMetadata: { ...providerMetadata },
    })),
  setSeed: (seed) =>
    set(() => ({
      seed,
    })),
  setAspectRatio: (value) =>
    set(() => ({
      aspectRatio: value,
    })),
  setN: (value) =>
    set(() => ({
      n: value,
    })),
  setResolution: (value) =>
    set(() => ({
      resolution: value,
    })),
  setDuration: (value) =>
    set(() => ({
      duration: value,
    })),
  setFps: (value) =>
    set(() => ({
      fps: value,
    })),
});
