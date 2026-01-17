import type { StateCreator } from "zustand";
import { defaultProviderRealtimeMetadata } from "./defaultProviderRealtimeMetadata";

export type RealtimeSlice = {
  providerRealtimeMetadata?: any
  setProviderRealtimeMetadata: (metadata: any) => void;

  // Realtime transcription session state
  realtimeStatus?: "idle" | "starting" | "connected" | "stopping" | "error";
  realtimeError?: string | null;
  realtimeActiveModel?: string | null;
  realtimeActiveTranscriptionId?: string | null;
  realtimeText?: string;

  setRealtimeSessionState: (patch: Partial<Pick<RealtimeSlice,
    | "realtimeStatus"
    | "realtimeError"
    | "realtimeActiveModel"
    | "realtimeActiveTranscriptionId"
    | "realtimeText"
  >>) => void;
  resetRealtimeSessionState: () => void;
};

export const createRealtimeSlice: StateCreator<
  any,
  [],
  [],
  RealtimeSlice
> = (set, get) => ({
  providerRealtimeMetadata: defaultProviderRealtimeMetadata,

  setProviderRealtimeMetadata: (providerMetadata) =>
    set(() => ({
      providerRealtimeMetadata: { ...providerMetadata },
    })),

  realtimeStatus: "idle",
  realtimeError: null,
  realtimeActiveModel: null,
  realtimeActiveTranscriptionId: null,
  realtimeText: "",

  setRealtimeSessionState: (patch) => set(() => ({
    ...patch,
  })),
  resetRealtimeSessionState: () => set(() => ({
    realtimeStatus: "idle",
    realtimeError: null,
    realtimeActiveModel: null,
    realtimeActiveTranscriptionId: null,
    realtimeText: "",
  })),
});
