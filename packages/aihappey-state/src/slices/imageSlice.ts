import type { StateCreator } from "zustand";
import { defaultProviderImageMetadata } from "./defaultProviderImageMetadata";

export type ImageSlice = {
  size?: string | undefined;
  aspectRatio?: string | undefined
  n: number
  maxImagesPerCall?: number
  providerImageMetadata?: any
  seed?: number | undefined
  setSeed: (seed: number | undefined) => void;
  setN: (n: number) => void;
  setAspectRatio: (aspectRatio: string | undefined) => void;
  setSize: (size: string | undefined) => void;
  setMaxImagesPerCall: (maxImagesPerCall: number | undefined) => void;
  setProviderImageMetadata: (metadata: any) => void;
};

export const createImageSlice: StateCreator<
  any,
  [],
  [],
  ImageSlice
> = (set, get) => ({
  size: undefined,
  aspectRatio: undefined,
  n: 1,
  seed: undefined,
  maxImagesPerCall: undefined,
  providerImageMetadata: defaultProviderImageMetadata,
  setMaxImagesPerCall: (maxImagesPerCall) =>
    set((state: any) => {
      return {
        maxImagesPerCall: maxImagesPerCall
      }
    }),
  setProviderImageMetadata: (providerMetadata) =>
    set(() => ({
      providerImageMetadata: { ...providerMetadata },
    })),
  setSeed: (seed) =>
    set((state: any) => {
      return {
        seed: seed
      }
    }),
  setAspectRatio: (value) => {
    set((state: any) => ({
      aspectRatio: value,
    }));
  },
  setN: (value) => {
    set((state: any) => ({
      n: value,
    }));
  },
  setSize: (value) => {
    set((state: any) => ({
      size: value,
    }));
  },

});
