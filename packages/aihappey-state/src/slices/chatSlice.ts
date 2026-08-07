import type { StateCreator } from "zustand";
import { defaultProviderMetadata } from "./defaultProviderMetadata";
import { defaultProviderHeaders } from "./defaultProviderHeaders";
import type { ModelOption } from "aihappey-types";
import { ToolAnnotations } from "aihappey-mcp";
import { SIDE_INFERENCE_DEFAULT_AGENT_NAMES } from "./defaultAgents";
import type { ApiKeyEncryptionState, EncryptedApiKeys } from "./apiKeyEncryption";
import {
  DEFAULT_CHAT_ENDPOINT_ID,
  DEFAULT_CHAT_ENDPOINT_MODE,
  normalizeBaseUrl,
  normalizeChatEndpointId,
  normalizeChatEndpointMode,
  readStoredChatEndpointMode,
  resolveEffectiveBaseUrl,
  resolveEffectiveChatEndpointId,
  resolveEffectiveChatEndpointMode,
  writeStoredChatEndpointMode,
  type ChatEndpointMode,
  type ChatEndpointId,
} from "./chatEndpoint";

export type SideInferenceAgentNames = {
  welcomeMessageAgent: string;
  conversationNameAgent: string;
  explainToolCallAgent: string;
  toolSearchAgent: string;
};

export const DEFAULT_SIDE_INFERENCE_AGENT_SELECTION: SideInferenceAgentNames = {
  welcomeMessageAgent: SIDE_INFERENCE_DEFAULT_AGENT_NAMES.welcomeMessage,
  conversationNameAgent: SIDE_INFERENCE_DEFAULT_AGENT_NAMES.conversationName,
  explainToolCallAgent: SIDE_INFERENCE_DEFAULT_AGENT_NAMES.explainToolCall,
  toolSearchAgent: SIDE_INFERENCE_DEFAULT_AGENT_NAMES.toolSearch,
};

export type ChatSlice = ApiKeyEncryptionState & {
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
  gatewayEnabled: boolean;
  endpointRawModelIds: boolean;
  endpointProviderMetadataEnabled: boolean;
  setConfiguredChatEndpointMode: (mode?: ChatEndpointMode | string) => void;
  setSelectedChatEndpointMode: (mode?: ChatEndpointMode | string) => void;
  setConfiguredChatEndpoint: (endpoint?: ChatEndpointId | string) => void;
  setSelectedEndpointProfileId: (profileId?: string) => void;
  setSelectedChatEndpoint: (endpoint?: ChatEndpointId | string) => void;
  setConfiguredBaseUrl: (baseUrl?: string) => void;
  setSelectedBaseUrl: (baseUrl?: string) => void;
  setGatewayEnabled: (enabled: boolean) => void;
  setEndpointRawModelIds: (enabled: boolean) => void;
  setEndpointProviderMetadataEnabled: (enabled: boolean) => void;
  experimentalThrottle?: number
  chatErrors?: string[]
  structuredOutputs?: any
  activePlugins: string[]
  /** Enabled user-defined local tools (stored in IndexedDB via aihappey-tools). */
  enabledLocalTools: string[]
  /** Request-only OpenAI tool options. Intentionally excluded from persistence. */
  toolRequestConfig: Record<string, {
    allowed_callers?: Array<"direct" | "programmatic">;
    defer_loading?: true;
  }>;
  useToolNamespaces: boolean;
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
  setToolRequestConfig: (config: ChatSlice["toolRequestConfig"]) => void;
  setUseToolNamespaces: (enabled: boolean) => void;
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
  providerHeaders?: Record<string, Record<string, string>>;
  setProviderHeaders: (headers: Record<string, Record<string, string>> | ((current: Record<string, Record<string, string>> | undefined) => Record<string, Record<string, string>> | undefined)) => void;
  sideInferenceAgentNames: SideInferenceAgentNames;
  setSideInferenceAgentNames: (agentNames: Partial<SideInferenceAgentNames>) => void;
  resetSideInferenceAgentNames: () => void;
  resetChatSettings: () => void;
  addChatError: (error: Error) => void
  dismissChatError: (error: string) => void
  toolAnnotations?: ToolAnnotations;
  customHeaders: Record<string, string>;
  encryptedApiKeys?: EncryptedApiKeys;
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
  providerHeaders: defaultProviderHeaders,
  sideInferenceAgentNames: { ...DEFAULT_SIDE_INFERENCE_AGENT_SELECTION },
  temperature: 1,
  experimentalThrottle: 500,
  models: [],
  modelsLoaded: false,
  modelsLoadingProgress: undefined,
  chatMode: "chat",
  configuredChatEndpointMode: readStoredChatEndpointMode() ?? DEFAULT_CHAT_ENDPOINT_MODE,
  selectedChatEndpointMode: readStoredChatEndpointMode() === "direct" ? "direct" : undefined,
  effectiveChatEndpointMode: readStoredChatEndpointMode() ?? DEFAULT_CHAT_ENDPOINT_MODE,
  configuredChatEndpoint: DEFAULT_CHAT_ENDPOINT_ID,
  selectedEndpointProfileId: undefined,
  selectedChatEndpoint: undefined,
  effectiveChatEndpoint: DEFAULT_CHAT_ENDPOINT_ID,
  configuredBaseUrl: "",
  selectedBaseUrl: undefined,
  effectiveBaseUrl: "",
  gatewayEnabled: true,
  endpointRawModelIds: false,
  endpointProviderMetadataEnabled: true,
  customHeaders: {},
  encryptedApiKeys: undefined,
  apiKeySessionPassword: undefined,
  apiKeyEncryptionStatus: "none",
  structuredOutputs: undefined,
  toolAnnotations: DEFAULT_CHAT_TOOL_ANNOTATIONS,
  chatErrors: [],
  approveAll: false,
  allowedToolList: [],
  activePlugins: [],
  enabledLocalTools: [],
  toolRequestConfig: {},
  useToolNamespaces: false,
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
  setToolRequestConfig: (value) => {
    set(() => ({
      toolRequestConfig: value && typeof value === "object" ? value : {},
    }));
  },
  setUseToolNamespaces: (value) => {
    set(() => ({ useToolNamespaces: !!value }));
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
    writeStoredChatEndpointMode(configuredChatEndpointMode);
    set((state: ChatSlice) => ({
      configuredChatEndpointMode,
      effectiveChatEndpointMode: resolveEffectiveChatEndpointMode(configuredChatEndpointMode, state.selectedChatEndpointMode),
    }));
  },
  setSelectedChatEndpointMode: (value) => {
    const selectedChatEndpointMode = normalizeChatEndpointMode(value);
    writeStoredChatEndpointMode(selectedChatEndpointMode ?? DEFAULT_CHAT_ENDPOINT_MODE);
    set((state: ChatSlice) => ({
      selectedChatEndpointMode,
      effectiveChatEndpointMode: resolveEffectiveChatEndpointMode(state.configuredChatEndpointMode, selectedChatEndpointMode),
      ...(selectedChatEndpointMode !== "direct"
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
  setGatewayEnabled: (value) => {
    set(() => ({ gatewayEnabled: !!value }));
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
      apiKeyEncryptionStatus: state.encryptedApiKeys ? "unlocked" : "needs-password",
    }));
  },
  removeCustomHeader: (key) => {
    set((state: any) => {
      const { [key]: _, ...rest } = state.customHeaders;   // remove key

      return {
        customHeaders: rest,
        apiKeyEncryptionStatus: state.encryptedApiKeys
          ? "unlocked"
          : Object.keys(rest).length > 0
            ? "needs-password"
            : "none",
      };
    });
  },
  setCustomHeaders: (headers) => {
    set((state: any) => ({
      customHeaders: headers ?? {},
      apiKeyEncryptionStatus: state.encryptedApiKeys
        ? "unlocked"
        : Object.keys(headers ?? {}).length > 0
          ? "needs-password"
          : "none",
    }));
  },
  setEncryptedApiKeys: (encryptedApiKeys) => {
    set((state: any) => ({
      encryptedApiKeys,
      apiKeyEncryptionStatus: encryptedApiKeys
        ? Object.keys(state.customHeaders ?? {}).length > 0
          ? "unlocked"
          : "locked"
        : Object.keys(state.customHeaders ?? {}).length > 0
          ? "needs-password"
          : "none",
    }));
  },
  setApiKeySessionPassword: (password) => {
    set(() => ({ apiKeySessionPassword: password }));
  },
  unlockApiKeys: (headers) => {
    set(() => ({
      customHeaders: headers ?? {},
      apiKeyEncryptionStatus: "unlocked",
    }));
  },
  lockApiKeys: () => {
    set((state: any) => ({
      customHeaders: {},
      apiKeySessionPassword: undefined,
      apiKeyEncryptionStatus: state.encryptedApiKeys ? "locked" : "none",
    }));
  },
  setApiKeysNeedPassword: (headers) => {
    set(() => ({
      customHeaders: headers ?? {},
      encryptedApiKeys: undefined,
      apiKeyEncryptionStatus: Object.keys(headers ?? {}).length > 0 ? "needs-password" : "none",
    }));
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
  setProviderHeaders: (providerHeaders) =>
    set((state: ChatSlice) => {
      const nextProviderHeaders =
        typeof providerHeaders === "function"
          ? providerHeaders(state.providerHeaders)
          : providerHeaders;

      return {
        providerHeaders: { ...(nextProviderHeaders ?? {}) },
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
      providerHeaders: { ...defaultProviderHeaders },
      sideInferenceAgentNames: { ...DEFAULT_SIDE_INFERENCE_AGENT_SELECTION },
      temperature: 1,
      selectedChatEndpointMode: undefined,
      effectiveChatEndpointMode: get().configuredChatEndpointMode ?? DEFAULT_CHAT_ENDPOINT_MODE,
      selectedEndpointProfileId: undefined,
      selectedChatEndpoint: undefined,
      effectiveChatEndpoint: get().configuredChatEndpoint ?? DEFAULT_CHAT_ENDPOINT_ID,
      selectedBaseUrl: undefined,
      effectiveBaseUrl: get().configuredBaseUrl ?? "",
      gatewayEnabled: true,
      endpointRawModelIds: false,
      endpointProviderMetadataEnabled: true,
      toolRequestConfig: {},
      useToolNamespaces: false,
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
