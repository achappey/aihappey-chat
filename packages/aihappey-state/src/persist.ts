import { persist } from "zustand/middleware";
import type { StateCreator } from "zustand";

type PersistMutators = [["zustand/persist", unknown]];
import type { ChatSlice } from "./slices/chatSlice";
import { McpSlice } from "./slices/mcpSlice";
import { UiSlice } from "./slices/uiSlice";
import { AgentSlice } from "./slices/agentSlice";
import { McpServersSlice } from "./slices/mcpServersSlice";
import { McpRegistrySlice } from "./slices/mcpRegistrySlice";
import { ImageSlice } from "./slices/imageSlice";
import { TranscriptionSlice } from "./slices/transcriptionSlice";
import { SpeechSlice } from "./slices/speechSlice";

type RootState = ChatSlice & McpSlice & ImageSlice & TranscriptionSlice & SpeechSlice
  & UiSlice & AgentSlice & McpServersSlice & McpRegistrySlice;

export const withPersist = (
  creator: StateCreator<RootState, PersistMutators, [], RootState>
) =>
  persist(creator, {
    name: "aihappey_store_v7",
    partialize: (s) => ({
      mcpServers: s.mcpServers,
      agents: s.agents,
      debugMode: s.debugMode,
      structuredOutputs: s.structuredOutputs,
      quickSearches: s.quickSearches,
      userPreferredModel: s.userPreferredModel,
      enableAgentImport: s.enableAgentImport,
      enableConversationImport: s.enableConversationImport,
      extractExif: s.extractExif,
      providerMetadata: s.providerMetadata,
      providerImageMetadata: s.providerImageMetadata,
      providerSpeechMetadata: s.providerSpeechMetadata,
      providerTranscriptionMetadata: s.providerTranscriptionMetadata,
      // Speech (general)
      voice: s.voice,
      speechOutputFormat: s.speechOutputFormat,
      speechInstructions: s.speechInstructions,
      speed: s.speed,
      speechLanguage: s.speechLanguage,
      seed: s.seed,
      allowedToolList: s.allowedToolList,
      size: s.size,
      maxImagesPerCall: s.maxImagesPerCall,
      aspectRatio: s.aspectRatio,
      chatWithImageModels: s.chatWithImageModels,
      toolAnnotations: s.toolAnnotations,
      enableUserLocation: s.enableUserLocation,
      enableApps: s.enableApps,
      customHeaders: s.customHeaders,
      experimentalThrottle: s.experimentalThrottle,
      toolTimeout: s.toolTimeout,
      resetTimeoutOnProgress: s.resetTimeoutOnProgress,
      conversationStorage: s.conversationStorage,
      enabledProviders: s.enabledProviders,
      remoteStorageConnected: s.remoteStorageConnected,
      logLevel: s.logLevel,
    }),
    migrate: (persistedState, version) => {
      // On version bump, reset endpoints, servers, and selected
      if (version < 5) {
        const safeState = typeof persistedState === "object"
          && persistedState !== null ? persistedState : {};
        return {
          ...safeState,

          endpoints: [],
          servers: {},
          selected: [],
        };
      }
      return persistedState;
    },
  });
