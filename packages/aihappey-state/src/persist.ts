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

function isPlainRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const withPersist = (
  creator: StateCreator<RootState, PersistMutators, [], RootState>
) =>
  persist(creator, {
    name: "aihappey_store_v8",
    version: 20,
    partialize: (s) => ({
      mcpServers: s.mcpServers,
      debugMode: s.debugMode,
      structuredOutputs: s.structuredOutputs,
      quickSearches: s.quickSearches,
      maxToolCalls: s.maxToolCalls,
      providerRealtimeMetadata: s.providerRealtimeMetadata,
      providerRealtimeConversationMetadata: (s as any).providerRealtimeConversationMetadata,
      userPreferredModel: s.userPreferredModel,
      userPreferredImageModel: s.userPreferredImageModel,
      userPreferredAudioModel: (s as any).userPreferredAudioModel,
      userPreferredVideoModel: (s as any).userPreferredVideoModel,
      userPreferredRerankingModel: (s as any).userPreferredRerankingModel,
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
      chatWithVideoModels: (s as any).chatWithVideoModels,
      chatWithSpeechModels: s.chatWithSpeechModels,
      chatWithTranscriptionModels: s.chatWithTranscriptionModels,
      transcriptionFileSplitEnabled: (s as any).transcriptionFileSplitEnabled,
      transcriptionFileSplitOverlapSeconds: (s as any).transcriptionFileSplitOverlapSeconds,
      transcriptionFileSplitMaxSizeMb: (s as any).transcriptionFileSplitMaxSizeMb,
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
      enabledProvidersByType: (s as any).enabledProvidersByType,
      favoriteModelsByType: (s as any).favoriteModelsByType,
      favoriteAgentIds: (s as any).favoriteAgentIds,
      enabledSkillIds: (s as any).enabledSkillIds,
      favoriteSkillIds: (s as any).favoriteSkillIds,
      selectedThemeId: (s as any).selectedThemeId,
      remoteStorageConnected: s.remoteStorageConnected,
      logLevel: s.logLevel,
    }),
    migrate: (persistedState, version) => {
      let safeState = isPlainRecord(persistedState)
        ? { ...(persistedState as Record<string, any>) }
        : {};

      // On version bump, reset endpoints, servers, and selected
      if (version < 5) {
        safeState = {
          ...safeState,

          endpoints: [],
          servers: {},
          selected: [],
        };
      }

      if (version < 12) {
        safeState = {
          ...safeState,
          enabledSkillIds: Array.isArray(safeState.enabledSkillIds)
            ? safeState.enabledSkillIds.filter(Boolean)
            : [],
          __legacyEnabledSkillNames: Array.isArray(safeState.enabledSkillNames)
            ? safeState.enabledSkillNames.filter(Boolean)
            : [],
        };
      }

      if (version < 13) {
        const {
          providerMetadata: legacyProviderMetadata,
          ...restState
        } = safeState;

        safeState = {
          ...restState,
          __legacyProviderMetadata: isPlainRecord(legacyProviderMetadata)
            ? legacyProviderMetadata
            : undefined,
        };
      }

      if (version < 14) {
        const {
          agents: legacyAgents,
          ...restState
        } = safeState;

        safeState = {
          ...restState,
          __legacyAgents: Array.isArray(legacyAgents)
            ? legacyAgents.filter(Boolean)
            : undefined,
        };
      }

      if (version < 15) {
        safeState = {
          ...safeState,
          providerRealtimeConversationMetadata: isPlainRecord(safeState.providerRealtimeConversationMetadata)
            ? safeState.providerRealtimeConversationMetadata
            : undefined,
        };
      }

      if (version < 16) {
        const enabledProvidersByType = isPlainRecord(safeState.enabledProvidersByType)
          ? safeState.enabledProvidersByType
          : {};

        safeState = {
          ...safeState,
          enabledProvidersByType: {
            ...enabledProvidersByType,
            audio: Array.isArray(enabledProvidersByType.audio)
              ? enabledProvidersByType.audio.filter(Boolean)
              : Array.isArray((enabledProvidersByType as any).realtime)
                ? (enabledProvidersByType as any).realtime.filter(Boolean)
                : [],
          },
        };
      }

      if (version < 17) {
        safeState = {
          ...safeState,
          transcriptionFileSplitEnabled: typeof safeState.transcriptionFileSplitEnabled === "boolean"
            ? safeState.transcriptionFileSplitEnabled
            : false,
          transcriptionFileSplitOverlapSeconds: typeof safeState.transcriptionFileSplitOverlapSeconds === "number"
            ? Math.max(0, safeState.transcriptionFileSplitOverlapSeconds)
            : 5,
          transcriptionFileSplitMaxSizeMb: typeof safeState.transcriptionFileSplitMaxSizeMb === "number"
            ? Math.max(1, safeState.transcriptionFileSplitMaxSizeMb)
            : 25,
        };
      }

      if (version < 18) {
        const favoriteModelsByType = isPlainRecord(safeState.favoriteModelsByType)
          ? safeState.favoriteModelsByType
          : {};

        safeState = {
          ...safeState,
          favoriteModelsByType: {
            language: Array.isArray(favoriteModelsByType.language)
              ? favoriteModelsByType.language.filter(Boolean)
              : [],
            image: Array.isArray(favoriteModelsByType.image)
              ? favoriteModelsByType.image.filter(Boolean)
              : [],
            audio: Array.isArray(favoriteModelsByType.audio)
              ? favoriteModelsByType.audio.filter(Boolean)
              : [],
            transcription: Array.isArray(favoriteModelsByType.transcription)
              ? favoriteModelsByType.transcription.filter(Boolean)
              : [],
            speech: Array.isArray(favoriteModelsByType.speech)
              ? favoriteModelsByType.speech.filter(Boolean)
              : [],
            reranking: Array.isArray(favoriteModelsByType.reranking)
              ? favoriteModelsByType.reranking.filter(Boolean)
              : [],
            video: Array.isArray(favoriteModelsByType.video)
              ? favoriteModelsByType.video.filter(Boolean)
              : [],
          },
        };
      }

      if (version < 19) {
        safeState = {
          ...safeState,
          favoriteAgentIds: Array.isArray(safeState.favoriteAgentIds)
            ? Array.from(new Set(safeState.favoriteAgentIds.filter(Boolean)))
            : [],
        };
      }

      if (version < 20) {
        safeState = {
          ...safeState,
          favoriteSkillIds: Array.isArray(safeState.favoriteSkillIds)
            ? Array.from(new Set(safeState.favoriteSkillIds.filter(Boolean)))
            : [],
        };
      }

      return {
        ...safeState,
        favoriteAgentIds: Array.isArray(safeState.favoriteAgentIds)
          ? Array.from(new Set(safeState.favoriteAgentIds.filter(Boolean)))
          : [],
        enabledSkillIds: Array.isArray(safeState.enabledSkillIds)
          ? safeState.enabledSkillIds.filter(Boolean)
          : [],
        favoriteSkillIds: Array.isArray(safeState.favoriteSkillIds)
          ? Array.from(new Set(safeState.favoriteSkillIds.filter(Boolean)))
          : [],
      } as any;
    },
  });
