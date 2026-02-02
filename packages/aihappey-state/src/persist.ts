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
import { VideoSlice } from "./slices/videoSlice";
import { TranscriptionSlice } from "./slices/transcriptionSlice";
import { SpeechSlice } from "./slices/speechSlice";
import { RerankingSlice } from "./slices/rerankingSlice";
import { RealtimeSlice } from "./slices/realtimeSlice";
import { JsonRenderSlice } from "./slices/jsonRenderSlice";

type RootState = ChatSlice & McpSlice & ImageSlice & VideoSlice & RealtimeSlice & TranscriptionSlice & SpeechSlice
  & UiSlice & AgentSlice & McpServersSlice & McpRegistrySlice & RerankingSlice & JsonRenderSlice;

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
      maxToolCalls: s.maxToolCalls,
      providerRealtimeMetadata: s.providerRealtimeMetadata,
      userPreferredModel: s.userPreferredModel,
      userPreferredImageModel: s.userPreferredImageModel,
      userPreferredVideoModel: (s as any).userPreferredVideoModel,
      userPreferredSpeechModel: s.userPreferredSpeechModel,
      pinnedConversations: s.pinnedConversations,
      userPreferredTranscriptionModel: s.userPreferredTranscriptionModel,
      enableAgentImport: s.enableAgentImport,
      enableConversationImport: s.enableConversationImport,
      maxAttachmentsSize: s.maxAttachmentsSize,
      sendRawAttachments: s.sendRawAttachments,
      convertAttachmentsToText: s.convertAttachmentsToText,
      extractExif: s.extractExif,
      showMessageTemperature: s.showMessageTemperature,
      showMessageTokens: s.showMessageTokens,
      providerMetadata: s.providerMetadata,
      providerImageMetadata: s.providerImageMetadata,
      providerVideoMetadata: (s as any).providerVideoMetadata,
      providerSpeechMetadata: s.providerSpeechMetadata,
      providerTranscriptionMetadata: s.providerTranscriptionMetadata,
      providerRerankingMetadata: s.providerRerankingMetadata,
      topN: s.topN,
      // Speech (general)
      voice: s.voice,
      speechOutputFormat: s.speechOutputFormat,
      speechInstructions: s.speechInstructions,
      speed: s.speed,
      speechLanguage: s.speechLanguage,
      seed: s.seed,
      videoSeed: (s as any).seed,
      allowedToolList: s.allowedToolList,
      size: s.size,
      maxImagesPerCall: s.maxImagesPerCall,
      aspectRatio: s.aspectRatio,
      videoDuration: (s as any).duration,
      videoResolution: (s as any).resolution,
      videoFps: (s as any).fps,
      videoAspectRatio: (s as any).aspectRatio,
      videoMaxPerCall: (s as any).maxVideosPerCall,
      chatWithImageModels: s.chatWithImageModels,
      chatWithSpeechModels: s.chatWithSpeechModels,
      chatWithTranscriptionModels: s.chatWithTranscriptionModels,
      toolAnnotations: s.toolAnnotations,
      enableUserLocation: s.enableUserLocation,
      enableApps: s.enableApps,
      defaultCatalogs: s.defaultCatalogs,
      defaultRegistries: (s as any).defaultRegistries,
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
