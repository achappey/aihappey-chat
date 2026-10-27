import type { StateCreator } from "zustand";
import {
  defaultProviderRealtimeConversationMetadata,
  defaultProviderRealtimeMetadata,
} from "./defaultProviderRealtimeMetadata";
import { normalizeSpaceXAiProviderMetadata } from "./providerMetadataAliases";

export type RealtimeSlice = {
  /** Application-only execution reference. Never belongs in provider options. */
  liveClientTarget?: { kind: 'agent' | 'model'; id: string };
  setLiveClientTarget: (target?: { kind: 'agent' | 'model'; id: string }) => void;
  /** Realtime transcription provider metadata. Kept for backwards compatibility. */
  providerRealtimeMetadata?: any
  setProviderRealtimeMetadata: (metadata: any) => void;

  /** Realtime conversation/session metadata. Separate from realtime transcription metadata. */
  providerRealtimeConversationMetadata?: any
  setProviderRealtimeConversationMetadata: (metadata: any) => void;

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
  liveClientTarget: undefined,
  setLiveClientTarget: liveClientTarget => set({ liveClientTarget }),
  providerRealtimeMetadata: defaultProviderRealtimeMetadata,
  providerRealtimeConversationMetadata: defaultProviderRealtimeConversationMetadata,

  setProviderRealtimeMetadata: (providerMetadata) =>
    set(() => ({
      providerRealtimeMetadata: normalizeSpaceXAiProviderMetadata(providerMetadata),
    })),

  setProviderRealtimeConversationMetadata: (providerMetadata) =>
    set(() => ({
      providerRealtimeConversationMetadata: normalizeSpaceXAiProviderMetadata(providerMetadata),
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
