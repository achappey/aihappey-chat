import type { StateCreator } from "zustand";
import { defaultProviderMetadata } from "./defaultProviderMetadata";
import type { ModelOption } from "aihappey-types";
import { ToolAnnotations } from "aihappey-mcp";

export type ChatSlice = {
  selectedConversationId: string | null;
  selectConversation: (id: string | null) => void;
  setTemperature: (temperature: number) => void;
  temperature?: number
  systemInstructions?: string
  chatMode: "chat" | "agent"
  switchChatMode: () => void;
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
  setModels: (models: ModelOption[]) => void;
  setThrottle: (throttle: number) => void;
  providerMetadata?: any
  setProviderMetadata: (metadata: any | ((current: any) => any)) => void;
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
  temperature: 1,
  experimentalThrottle: 500,
  models: [],
  modelsLoaded: false,
  chatMode: "chat",
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
  resetChatSettings: () =>
    set(() => ({
      providerMetadata: { ...defaultProviderMetadata },
      temperature: 1,
      enabledProvidersByType: {
        language: [],
        image: [],
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
