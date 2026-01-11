import type { StateCreator } from "zustand";
import { defaultProviderRerankingMetadata } from "./defaultProviderRerankingMetadata";

export type RerankingSlice = {
  providerRerankingMetadata?: any
  setProviderRerankingMetadata: (metadata: any) => void;
  topN?: number;
  setTopN: (topN?: number) => void;
};

export const createRerankingSlice: StateCreator<
  any,
  [],
  [],
  RerankingSlice
> = (set, get) => ({
  providerRerankingMetadata: defaultProviderRerankingMetadata,
  setProviderRerankingMetadata: (providerMetadata) =>
    set(() => ({
      providerRerankingMetadata: { ...providerMetadata },
    })),
  topN: undefined,
  setTopN: (topN) =>
    set(() => ({
      topN,
    })),
});
