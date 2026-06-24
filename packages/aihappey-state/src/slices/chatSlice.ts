import type { StateCreator } from "zustand";
import { defaultProviderMetadata } from "./defaultProviderMetadata";
import type { ModelOption } from "aihappey-types";
import { ToolAnnotations } from "aihappey-mcp";
import { SIDE_INFERENCE_DEFAULT_AGENT_NAMES } from "./defaultAgents";
import {
  DEFAULT_CHAT_ENDPOINT_ID,
  normalizeChatEndpointId,
  resolveEffectiveChatEndpointId,
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
  configuredChatEndpoint?: ChatEndpointId;
  selectedChatEndpoint?: ChatEndpointId;
  effectiveChatEndpoint: ChatEndpointId;
  setConfiguredChatEndpoint: (endpoint?: ChatEndpointId | string) => void;
  setSelectedChatEndpoint: (endpoint?: ChatEndpointId | string) => void;
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
  setSelectedModel: (model: string) => void;

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
  configuredChatEndpoint: DEFAULT_CHAT_ENDPOINT_ID,
  selectedChatEndpoint: undefined,
  effectiveChatEndpoint: DEFAULT_CHAT_ENDPOINT_ID,
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
        selectedModel: model
      }
    }),
  setStructuredOutputs: (value) => {
    set((state: any) => ({
      structuredOutputs: value,
    }));
  },
  setConfiguredChatEndpoint: (value) => {
    const configuredChatEndpoint = normalizeChatEndpointId(value) ?? DEFAULT_CHAT_ENDPOINT_ID;
    set((state: ChatSlice) => ({
      configuredChatEndpoint,
      effectiveChatEndpoint: resolveEffectiveChatEndpointId(configuredChatEndpoint, state.selectedChatEndpoint),
    }));
  },
  setSelectedChatEndpoint: (value) => {
    const selectedChatEndpoint = normalizeChatEndpointId(value);
    set((state: ChatSlice) => ({
      selectedChatEndpoint,
      effectiveChatEndpoint: resolveEffectiveChatEndpointId(state.configuredChatEndpoint, selectedChatEndpoint),
    }));
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
      selectedChatEndpoint: undefined,
      effectiveChatEndpoint: get().configuredChatEndpoint ?? DEFAULT_CHAT_ENDPOINT_ID,
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
