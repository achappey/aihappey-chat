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
import { DEFAULT_CHAT_VERBOSITY, DEFAULT_SIDE_INFERENCE_AGENT_SELECTION } from "./slices/chatSlice";
import { DEFAULT_CHAT_ENDPOINT_ID, DEFAULT_CHAT_ENDPOINT_MODE, normalizeBaseUrl, normalizeChatEndpointId, normalizeChatEndpointMode, readStoredChatEndpointMode, resolveEffectiveBaseUrl, resolveEffectiveChatEndpointId, resolveEffectiveChatEndpointMode } from "./slices/chatEndpoint";
import { normalizeCustomProviders } from "./slices/uiSlice";
import { resolveApiKeyEncryptionStatus } from "./slices/apiKeyEncryption";
import { normalizeProviderHeaders, splitLegacyProviderHeadersFromMetadata } from "./slices/providerHeaders";

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
    version: 31,
    partialize: (s) => ({
      mcpServers: s.mcpServers,
      debugMode: s.debugMode,
      structuredOutputs: s.structuredOutputs,
      verbosity: s.verbosity,
      quickSearches: s.quickSearches,
      maxToolCalls: s.maxToolCalls,
      providerRealtimeMetadata: s.providerRealtimeMetadata,
      providerRealtimeConversationMetadata: s.providerRealtimeConversationMetadata,
      userPreferredModel: s.userPreferredModel,
      userPreferredImageModel: s.userPreferredImageModel,
      userPreferredAudioModel: s.userPreferredAudioModel,
      userPreferredVideoModel: s.userPreferredVideoModel,
      userPreferredRerankingModel: s.userPreferredRerankingModel,
      userPreferredSpeechModel: s.userPreferredSpeechModel,
      pinnedConversations: s.pinnedConversations,
      hiddenNavigationItemKeys: (s as any).hiddenNavigationItemKeys,
      userPreferredTranscriptionModel: s.userPreferredTranscriptionModel,
      enableAgentImport: s.enableAgentImport,
      enableConversationImport: s.enableConversationImport,
      maxAttachmentsSize: s.maxAttachmentsSize,
      sendRawAttachments: s.sendRawAttachments,
      convertAttachmentsToText: s.convertAttachmentsToText,
      extractExif: s.extractExif,
      showMessageTokens: s.showMessageTokens,
      disableProviderLogo: (s as any).disableProviderLogo,
      chatDictationEnabled: s.chatDictationEnabled,
      providerImageMetadata: s.providerImageMetadata,
      providerVideoMetadata: (s as any).providerVideoMetadata,
      providerSpeechMetadata: s.providerSpeechMetadata,
      providerTranscriptionMetadata: s.providerTranscriptionMetadata,
      providerRerankingMetadata: s.providerRerankingMetadata,
      providerHeaders: (s as any).providerHeaders,
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
      generateAudio: (s as any).generateAudio,
      chatWithImageModels: s.chatWithImageModels,
      chatWithVideoModels: (s as any).chatWithVideoModels,
      chatWithSpeechModels: s.chatWithSpeechModels,
      chatWithTranscriptionModels: s.chatWithTranscriptionModels,
      transcriptionFileSplitEnabled: (s as any).transcriptionFileSplitEnabled,
      transcriptionFileSplitOverlapSeconds: (s as any).transcriptionFileSplitOverlapSeconds,
      transcriptionFileSplitMaxSizeMb: (s as any).transcriptionFileSplitMaxSizeMb,
      videoPollingIntervalSeconds: (s as any).videoPollingIntervalSeconds,
      toolAnnotations: s.toolAnnotations,
      enableUserLocation: s.enableUserLocation,
      enableApps: s.enableApps,
      defaultCatalogs: s.defaultCatalogs,
      defaultRegistries: (s as any).defaultRegistries,
      customHeaders: undefined,
      encryptedApiKeys: (s as any).encryptedApiKeys,
      experimentalThrottle: s.experimentalThrottle,
      toolTimeout: s.toolTimeout,
      resetTimeoutOnProgress: s.resetTimeoutOnProgress,
      conversationStorage: s.conversationStorage,
      enabledProvidersByType: (s as any).enabledProvidersByType,
      favoriteModelsByType: (s as any).favoriteModelsByType,
      favoriteAgentIds: (s as any).favoriteAgentIds,
      enabledSkillIds: (s as any).enabledSkillIds,
      favoriteSkillIds: (s as any).favoriteSkillIds,
      enabledAgentPluginIds: (s as any).enabledAgentPluginIds,
      favoriteProviderIds: (s as any).favoriteProviderIds,
      favoritePluginIds: (s as any).favoritePluginIds,
      customProviders: (s as any).customProviders,
      selectedThemeId: (s as any).selectedThemeId,
      sideInferenceAgentNames: (s as any).sideInferenceAgentNames,
      configuredChatEndpointMode: (s as any).configuredChatEndpointMode,
      selectedChatEndpointMode: (s as any).selectedChatEndpointMode,
      configuredChatEndpoint: (s as any).configuredChatEndpoint,
      selectedEndpointProfileId: (s as any).selectedEndpointProfileId,
      selectedChatEndpoint: (s as any).selectedChatEndpoint,
      selectedBaseUrl: (s as any).selectedBaseUrl,
      gatewayEnabled: (s as any).gatewayEnabled,
      endpointRawModelIds: (s as any).endpointRawModelIds,
      endpointProviderMetadataEnabled: (s as any).endpointProviderMetadataEnabled,
      remoteStorageConnected: s.remoteStorageConnected,
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

      if (version < 21) {
        safeState = {
          ...safeState,
          sideInferenceAgentNames: {
            ...DEFAULT_SIDE_INFERENCE_AGENT_SELECTION,
            ...(isPlainRecord(safeState.sideInferenceAgentNames)
              ? safeState.sideInferenceAgentNames
              : {}),
          },
        };
      }

      if (version < 22) {
        const configuredChatEndpoint = normalizeChatEndpointId(safeState.configuredChatEndpoint)
          ?? DEFAULT_CHAT_ENDPOINT_ID;
        const selectedChatEndpoint = normalizeChatEndpointId(safeState.selectedChatEndpoint);

        safeState = {
          ...safeState,
          configuredChatEndpoint,
          selectedChatEndpoint,
          effectiveChatEndpoint: resolveEffectiveChatEndpointId(configuredChatEndpoint, selectedChatEndpoint),
        };
      }

      if (version < 23) {
        safeState = {
          ...safeState,
          selectedBaseUrl: normalizeBaseUrl(safeState.selectedBaseUrl),
        };
      }

      if (version < 24) {
        safeState = {
          ...safeState,
          selectedEndpointProfileId: typeof safeState.selectedEndpointProfileId === "string"
            && safeState.selectedEndpointProfileId.trim().length
            ? safeState.selectedEndpointProfileId.trim()
            : undefined,
        };
      }

      if (version < 25) {
        safeState = {
          ...safeState,
          configuredChatEndpointMode: normalizeChatEndpointMode(safeState.configuredChatEndpointMode)
            ?? DEFAULT_CHAT_ENDPOINT_MODE,
          selectedChatEndpointMode: normalizeChatEndpointMode(safeState.selectedChatEndpointMode)
            ?? (typeof safeState.selectedEndpointProfileId === "string" && safeState.selectedEndpointProfileId.trim().length
              ? "direct"
              : undefined),
          customProviders: normalizeCustomProviders(safeState.customProviders),
        };
      }

      if (version < 26) {
        safeState = {
          ...safeState,
          encryptedApiKeys: isPlainRecord(safeState.encryptedApiKeys)
            ? safeState.encryptedApiKeys
            : undefined,
        };
      }

      if (version < 27) {
        const split = splitLegacyProviderHeadersFromMetadata({
          providerMetadata: isPlainRecord(safeState.__legacyProviderMetadata)
            ? safeState.__legacyProviderMetadata
            : undefined,
          providerHeaders: isPlainRecord(safeState.providerHeaders)
            ? safeState.providerHeaders
            : undefined,
        });

        safeState = {
          ...safeState,
          __legacyProviderMetadata: isPlainRecord(safeState.__legacyProviderMetadata)
            ? split.providerMetadata
            : safeState.__legacyProviderMetadata,
          providerHeaders: split.providerHeaders,
        };
      }

      if (version < 28) {
        safeState = {
          ...safeState,
          favoriteProviderIds: Array.isArray(safeState.favoriteProviderIds)
            ? Array.from(new Set(safeState.favoriteProviderIds.filter(Boolean)))
            : [],
        };
      }

      if (version < 29) {
        safeState = {
          ...safeState,
          videoPollingIntervalSeconds: typeof safeState.videoPollingIntervalSeconds === "number"
            ? Math.min(60, Math.max(5, safeState.videoPollingIntervalSeconds))
            : 10,
        };
      }

      if (version < 30) {
        safeState = {
          ...safeState,
          enabledAgentPluginIds: Array.isArray(safeState.enabledAgentPluginIds)
            ? Array.from(new Set(safeState.enabledAgentPluginIds.filter(Boolean)))
            : [],
        };
      }

      if (version < 31) {
        safeState = {
          ...safeState,
          favoritePluginIds: Array.isArray(safeState.favoritePluginIds)
            ? Array.from(new Set(safeState.favoritePluginIds.filter(Boolean)))
            : [],
        };
      }

      const storedChatEndpointMode = readStoredChatEndpointMode();
      const configuredChatEndpointMode = storedChatEndpointMode
        ?? normalizeChatEndpointMode(safeState.configuredChatEndpointMode)
        ?? DEFAULT_CHAT_ENDPOINT_MODE;
      const selectedChatEndpointMode = storedChatEndpointMode === "direct"
        ? "direct"
        : normalizeChatEndpointMode(safeState.selectedChatEndpointMode);

      return {
        ...safeState,
        verbosity: safeState.verbosity === "low" || safeState.verbosity === "high"
          ? safeState.verbosity
          : DEFAULT_CHAT_VERBOSITY,
        configuredChatEndpointMode,
        selectedChatEndpointMode,
        effectiveChatEndpointMode: resolveEffectiveChatEndpointMode(
          configuredChatEndpointMode,
          selectedChatEndpointMode,
        ),
        configuredChatEndpoint: normalizeChatEndpointId(safeState.configuredChatEndpoint) ?? DEFAULT_CHAT_ENDPOINT_ID,
        selectedEndpointProfileId: typeof safeState.selectedEndpointProfileId === "string"
          && safeState.selectedEndpointProfileId.trim().length
          ? safeState.selectedEndpointProfileId.trim()
          : undefined,
        selectedChatEndpoint: normalizeChatEndpointId(safeState.selectedChatEndpoint),
        effectiveChatEndpoint: resolveEffectiveChatEndpointId(
          normalizeChatEndpointId(safeState.configuredChatEndpoint) ?? DEFAULT_CHAT_ENDPOINT_ID,
          normalizeChatEndpointId(safeState.selectedChatEndpoint),
        ),
        configuredBaseUrl: normalizeBaseUrl(safeState.configuredBaseUrl) ?? "",
        selectedBaseUrl: normalizeBaseUrl(safeState.selectedBaseUrl),
        effectiveBaseUrl: resolveEffectiveBaseUrl(
          normalizeBaseUrl(safeState.configuredBaseUrl) ?? "",
          normalizeBaseUrl(safeState.selectedBaseUrl),
        ),
        gatewayEnabled: safeState.gatewayEnabled !== false,
        endpointRawModelIds: safeState.endpointRawModelIds === true,
        endpointProviderMetadataEnabled: safeState.endpointProviderMetadataEnabled !== false,
        providerHeaders: normalizeProviderHeaders(safeState.providerHeaders),
        sideInferenceAgentNames: {
          ...DEFAULT_SIDE_INFERENCE_AGENT_SELECTION,
          ...(isPlainRecord(safeState.sideInferenceAgentNames)
            ? safeState.sideInferenceAgentNames
            : {}),
        },
        favoriteAgentIds: Array.isArray(safeState.favoriteAgentIds)
          ? Array.from(new Set(safeState.favoriteAgentIds.filter(Boolean)))
          : [],
        enabledSkillIds: Array.isArray(safeState.enabledSkillIds)
          ? safeState.enabledSkillIds.filter(Boolean)
          : [],
        enabledAgentPluginIds: Array.isArray(safeState.enabledAgentPluginIds)
          ? Array.from(new Set(safeState.enabledAgentPluginIds.filter(Boolean)))
          : [],
        favoriteSkillIds: Array.isArray(safeState.favoriteSkillIds)
          ? Array.from(new Set(safeState.favoriteSkillIds.filter(Boolean)))
          : [],
        favoriteProviderIds: Array.isArray(safeState.favoriteProviderIds)
          ? Array.from(new Set(safeState.favoriteProviderIds.filter(Boolean)))
          : [],
        favoritePluginIds: Array.isArray(safeState.favoritePluginIds)
          ? Array.from(new Set(safeState.favoritePluginIds.filter(Boolean)))
          : [],
        customProviders: normalizeCustomProviders(safeState.customProviders),
        apiKeyEncryptionStatus: resolveApiKeyEncryptionStatus(
          isPlainRecord(safeState.encryptedApiKeys) ? safeState.encryptedApiKeys as any : undefined,
          isPlainRecord(safeState.customHeaders) ? safeState.customHeaders as Record<string, string> : undefined,
        ),
      } as any;
    },
  });
