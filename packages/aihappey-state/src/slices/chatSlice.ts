import type { StateCreator } from "zustand";
import { defaultProviderMetadata } from "./defaultProviderMetadata";
import type { ModelOption } from "aihappey-types";
import { ToolAnnotations } from "aihappey-mcp";
import { SIDE_INFERENCE_DEFAULT_AGENT_NAMES } from "./defaultAgents";
import {
  DEFAULT_CHAT_ENDPOINT_ID,
  DEFAULT_CHAT_ENDPOINT_MODE,
  normalizeBaseUrl,
  normalizeChatEndpointId,
  normalizeChatEndpointMode,
  resolveEffectiveBaseUrl,
  resolveEffectiveChatEndpointId,
  resolveEffectiveChatEndpointMode,
  type ChatEndpointMode,
  type ChatEndpointId,
} from "./chatEndpoint";

export type SideInferenceAgentNames = {
  welcomeMessageAgent: string;
  conversationNameAgent: string;
  explainToolCallAgent: string;
};

export const DEFAULT_SIDE_INFERENCE_AGENT_SELECTION: SideInferenceAgentNames = {
  welcomeMessageAgent: SIDE_INFERENCE_DEFAULT_AGENT_NAMES.welcomeMessage,
  conversationNameAgent: SIDE_INFERENCE_DEFAULT_AGENT_NAMES.conversationName,
  explainToolCallAgent: SIDE_INFERENCE_DEFAULT_AGENT_NAMES.explainToolCall,
};

export type ChatSlice = {
  selectedConversationId: string | null;
  selectConversation: (id: string | null) => void;
  setTemperature: (temperature: number) => void;
  temperature?: number
  systemInstructions?: string
  chatMode: "chat" | "agent"
  switchChatMode: () => void;
  configuredChatEndpointMode?: ChatEndpointMode;
  selectedChatEndpointMode?: ChatEndpointMode;
  effectiveChatEndpointMode: ChatEndpointMode;
  configuredChatEndpoint?: ChatEndpointId;
  selectedEndpointProfileId?: string;
  selectedChatEndpoint?: ChatEndpointId;
  effectiveChatEndpoint: ChatEndpointId;
  configuredBaseUrl: string;
  selectedBaseUrl?: string;
  effectiveBaseUrl: string;
  endpointRawModelIds: boolean;
  endpointProviderMetadataEnabled: boolean;
  setConfiguredChatEndpointMode: (mode?: ChatEndpointMode | string) => void;
  setSelectedChatEndpointMode: (mode?: ChatEndpointMode | string) => void;
  setConfiguredChatEndpoint: (endpoint?: ChatEndpointId | string) => void;
  setSelectedEndpointProfileId: (profileId?: string) => void;
  setSelectedChatEndpoint: (endpoint?: ChatEndpointId | string) => void;
  setConfiguredBaseUrl: (baseUrl?: string) => void;
  setSelectedBaseUrl: (baseUrl?: string) => void;
  setEndpointRawModelIds: (enabled: boolean) => void;
  setEndpointProviderMetadataEnabled: (enabled: boolean) => void;
  experimentalThrottle?: number
  chatErrors?: string[]
  structuredOutputs?: any
  activePlugins: string[]
  /** Enabled user-defined local tools (stored in IndexedDB via aihappey-tools). */
  enabledLocalTools: string[]
  approveAll: boolean;
  maxOutputTokens?: number
  setMaxOutputTokens: (maxOutputTokens?: number) => void;

  convertAttachmentsToText?: boolean
  sendRawAttachments?: boolean
  maxAttachmentsSize?: number

  setConvertAttachmentsToText: (value?: boolean) => void;
  setSendRawAttachments: (value?: boolean) => void;
  setMaxAttachmentsSize: (value?: number) => void;

  stopTools?: string[]
  setStopTools: (stopTools?: string[]) => void;
  maxToolCalls?: number
  setMaxToolCalls: (maxToolCalls?: number) => void;
  toolChoice?: string
  setToolChoice: (toolChoice?: string) => void;
  allowedToolList: string[];
  toggleApproveAll: () => void;
  addAllowedTool: (name: string) => void;
  setActivePlugins: (names: string[]) => void;
  setEnabledLocalTools: (names: string[]) => void;
  setStructuredOutputs: (structuredOutputs?: any) => void;
  models?: ModelOption[]
  /** True once we have attempted to load models from the backend (even if the list is empty). */
  modelsLoaded: boolean;
  modelsLoadingProgress?: { completed: number; total: number; active: boolean };
  setModelsLoadingProgress: (progress?: { completed: number; total: number; active: boolean }) => void;
  setModels: (models: ModelOption[]) => void;
  resetModels: (options?: { keepSelectedModel?: boolean }) => void;
  setThrottle: (throttle: number) => void;
  providerMetadata?: any
  setProviderMetadata: (metadata: any | ((current: any) => any)) => void;
  sideInferenceAgentNames: SideInferenceAgentNames;
  setSideInferenceAgentNames: (agentNames: Partial<SideInferenceAgentNames>) => void;
  resetSideInferenceAgentNames: () => void;
  resetChatSettings: () => void;
  addChatError: (error: Error) => void
  dismissChatError: (error: string) => void
  toolAnnotations?: ToolAnnotations;
  customHeaders: Record<string, string>;
  addCustomHeader: (key: string, value: string) => void
  removeCustomHeader: (key: string) => void
  setToolAnnotations: (value?: ToolAnnotations) => void

  selectedModel?: string;
  setSelectedModel: (model?: string) => void;

};

export const DEFAULT_CHAT_TOOL_ANNOTATIONS: ToolAnnotations = {
  readOnlyHint: false,
  idempotentHint: false,
  openWorldHint: true,
  destructiveHint: true,
};

export const createChatSlice: StateCreator<
  any,
  [],
  [],
  ChatSlice
> = (set, get) => ({
  selectedConversationId: null,
  providerMetadata: defaultProviderMetadata,
  sideInferenceAgentNames: { ...DEFAULT_SIDE_INFERENCE_AGENT_SELECTION },
  temperature: 1,
  experimentalThrottle: 500,
  models: [],
  modelsLoaded: false,
  modelsLoadingProgress: undefined,
  chatMode: "chat",
  configuredChatEndpointMode: DEFAULT_CHAT_ENDPOINT_MODE,
  selectedChatEndpointMode: undefined,
  effectiveChatEndpointMode: DEFAULT_CHAT_ENDPOINT_MODE,
  configuredChatEndpoint: DEFAULT_CHAT_ENDPOINT_ID,
  selectedEndpointProfileId: undefined,
  selectedChatEndpoint: undefined,
  effectiveChatEndpoint: DEFAULT_CHAT_ENDPOINT_ID,
  configuredBaseUrl: "",
  selectedBaseUrl: undefined,
  effectiveBaseUrl: "",
  endpointRawModelIds: false,
  endpointProviderMetadataEnabled: true,
  customHeaders: {},
  structuredOutputs: undefined,
  toolAnnotations: DEFAULT_CHAT_TOOL_ANNOTATIONS,
  chatErrors: [],
  approveAll: false,
  allowedToolList: [],
  activePlugins: [],
  enabledLocalTools: [],
  stopTools: [],
  convertAttachmentsToText: true,
  maxAttachmentsSize: 25 * 1024 * 1024,
  sendRawAttachments: true,
  setConvertAttachmentsToText: (value?: boolean) => {
    set((state: ChatSlice) => ({
      convertAttachmentsToText: value
    }));
  },
  setSendRawAttachments: (value?: boolean) => {
    set((state: ChatSlice) => ({
      sendRawAttachments: value
    }));
  },

  setMaxAttachmentsSize: (value?: number) => {
    set((state: ChatSlice) => ({
      maxAttachmentsSize: value
    }));
  },
  setStopTools: (value) => {
    set((state: ChatSlice) => ({
      stopTools: value
    }));
  },
  setMaxOutputTokens: (value) => {
    set((state: ChatSlice) => ({
      maxOutputTokens: value
    }));
  },
  setMaxToolCalls: (value) => {
    set((state: ChatSlice) => ({
      maxToolCalls: value,
    }));
  },
  setToolChoice: (value) => {
    set((state: any) => ({
      toolChoice: value,
    }));
  },
  toggleApproveAll: () => {
    set((state: any) => ({
      approveAll: !state.approveAll,
    }));
  },
  addAllowedTool: (value) => {
    set((state: any) => ({
      allowedToolList: [...state.allowedToolList, value],
    }));
  },
  setActivePlugins: (value) => {
    set((state: any) => ({
      activePlugins: value,
    }));
  },
  setEnabledLocalTools: (value) => {
    set(() => ({
      enabledLocalTools: Array.isArray(value) ? value : [],
    }));
  },
  setSelectedModel: (model) =>
    set((state: any) => {
      return {
        selectedModel: typeof model === "string" && model.trim().length ? model : undefined
      }
    }),
  setStructuredOutputs: (value) => {
    set((state: any) => ({
      structuredOutputs: value,
    }));
  },
  setConfiguredChatEndpointMode: (value) => {
    const configuredChatEndpointMode = normalizeChatEndpointMode(value) ?? DEFAULT_CHAT_ENDPOINT_MODE;
    set((state: ChatSlice) => ({
      configuredChatEndpointMode,
      effectiveChatEndpointMode: resolveEffectiveChatEndpointMode(configuredChatEndpointMode, state.selectedChatEndpointMode),
    }));
  },
  setSelectedChatEndpointMode: (value) => {
    const selectedChatEndpointMode = normalizeChatEndpointMode(value);
    set((state: ChatSlice) => ({
      selectedChatEndpointMode,
      effectiveChatEndpointMode: resolveEffectiveChatEndpointMode(state.configuredChatEndpointMode, selectedChatEndpointMode),
      ...(selectedChatEndpointMode === "default"
        ? {
          selectedEndpointProfileId: undefined,
          selectedChatEndpoint: undefined,
          selectedBaseUrl: undefined,
          effectiveChatEndpoint: resolveEffectiveChatEndpointId(state.configuredChatEndpoint, undefined),
          effectiveBaseUrl: resolveEffectiveBaseUrl(state.configuredBaseUrl, undefined),
        }
        : {}),
    }));
  },
  setConfiguredChatEndpoint: (value) => {
    const configuredChatEndpoint = normalizeChatEndpointId(value) ?? DEFAULT_CHAT_ENDPOINT_ID;
    set((state: ChatSlice) => ({
      configuredChatEndpoint,
      effectiveChatEndpoint: resolveEffectiveChatEndpointId(configuredChatEndpoint, state.selectedChatEndpoint),
    }));
  },
  setSelectedEndpointProfileId: (value) => {
    const selectedEndpointProfileId = typeof value === "string" && value.trim().length
      ? value.trim()
      : undefined;
    set(() => ({ selectedEndpointProfileId }));
  },
  setSelectedChatEndpoint: (value) => {
    const selectedChatEndpoint = normalizeChatEndpointId(value);
    set((state: ChatSlice) => ({
      selectedChatEndpoint,
      effectiveChatEndpoint: resolveEffectiveChatEndpointId(state.configuredChatEndpoint, selectedChatEndpoint),
    }));
  },
  setConfiguredBaseUrl: (value) => {
    const configuredBaseUrl = normalizeBaseUrl(value) ?? "";
    set((state: ChatSlice) => ({
      configuredBaseUrl,
      effectiveBaseUrl: resolveEffectiveBaseUrl(configuredBaseUrl, state.selectedBaseUrl),
    }));
  },
  setSelectedBaseUrl: (value) => {
    const selectedBaseUrl = normalizeBaseUrl(value);
    set((state: ChatSlice) => ({
      selectedBaseUrl,
      effectiveBaseUrl: resolveEffectiveBaseUrl(state.configuredBaseUrl, selectedBaseUrl),
    }));
  },
  setEndpointRawModelIds: (value) => {
    set(() => ({ endpointRawModelIds: !!value }));
  },
  setEndpointProviderMetadataEnabled: (value) => {
    set(() => ({ endpointProviderMetadataEnabled: !!value }));
  },
  switchChatMode: () => {
    set((state: any) => ({
      chatMode: state.chatMode == "agent" ? "chat" : "agent",
    }));
  },
  addCustomHeader: (key, value) => {
    set((state: any) => ({
      customHeaders: {
        ...state.customHeaders,
        [key]: value,   // <-- dynamic property name
      },
    }));
  },
  removeCustomHeader: (key) => {
    set((state: any) => {
      const { [key]: _, ...rest } = state.customHeaders;   // remove key

      return {
        customHeaders: rest
      };
    });
  },
  setModels: (models) => {
    set((state: any) => ({
      models: models,
      modelsLoaded: true,
      modelsLoadingProgress: undefined,
    }));
  },
  resetModels: (options) => {
    set(() => ({
      models: [],
      modelsLoaded: false,
      modelsLoadingProgress: undefined,
      ...(options?.keepSelectedModel ? {} : { selectedModel: undefined }),
    }));
  },
  setModelsLoadingProgress: (progress) => {
    set(() => ({
      modelsLoadingProgress: progress,
    }));
  },
  setThrottle: (throttle) => {
    set((state: any) => ({
      experimentalThrottle: throttle,
    }));
  },
  addChatError: (error) => {
    const message = typeof error === "string" ? error : error.message;
    set((state: any) => ({
      chatErrors: state.chatErrors.includes(message)
        ? state.chatErrors
        : [...state.chatErrors, message],
    }));
  },
  dismissChatError: (error) => {
    set((state: any) => ({
      chatErrors: state.chatErrors.filter((e: any) => e !== error),
    }));
  },
  setToolAnnotations: (toolAnnotations) =>
    set(() => ({
      toolAnnotations: { ...toolAnnotations },
    })),
  setTemperature: (temp) =>
    set(() => ({
      temperature: temp,
    })),
  setProviderMetadata: (providerMetadata) =>
    set((state: ChatSlice) => {
      const nextProviderMetadata =
        typeof providerMetadata === "function"
          ? providerMetadata(state.providerMetadata)
          : providerMetadata;

      return {
        providerMetadata: { ...(nextProviderMetadata ?? {}) },
      };
    }),
  setSideInferenceAgentNames: (agentNames) =>
    set((state: ChatSlice) => ({
      sideInferenceAgentNames: {
        ...(state.sideInferenceAgentNames ?? DEFAULT_SIDE_INFERENCE_AGENT_SELECTION),
        ...(agentNames ?? {}),
      },
    })),
  resetSideInferenceAgentNames: () =>
    set(() => ({
      sideInferenceAgentNames: { ...DEFAULT_SIDE_INFERENCE_AGENT_SELECTION },
    })),
  resetChatSettings: () =>
    set(() => ({
      providerMetadata: { ...defaultProviderMetadata },
      sideInferenceAgentNames: { ...DEFAULT_SIDE_INFERENCE_AGENT_SELECTION },
      temperature: 1,
      selectedChatEndpointMode: undefined,
      effectiveChatEndpointMode: get().configuredChatEndpointMode ?? DEFAULT_CHAT_ENDPOINT_MODE,
      selectedEndpointProfileId: undefined,
      selectedChatEndpoint: undefined,
      effectiveChatEndpoint: get().configuredChatEndpoint ?? DEFAULT_CHAT_ENDPOINT_ID,
      selectedBaseUrl: undefined,
      effectiveBaseUrl: get().configuredBaseUrl ?? "",
      endpointRawModelIds: false,
      endpointProviderMetadataEnabled: true,
      enabledProvidersByType: {
        language: [],
        image: [],
        audio: [],
        transcription: [],
        speech: [],
        reranking: [],
        video: [],
      },
      toolAnnotations: DEFAULT_CHAT_TOOL_ANNOTATIONS
    })),
  selectConversation: (id) =>
    set(() => ({
      selectedConversationId: id,
    })),
});
