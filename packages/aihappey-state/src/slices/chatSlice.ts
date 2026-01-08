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
  approveAll: boolean;
  allowedToolList: string[];
  toggleApproveAll: () => void;
  addAllowedTool: (name: string) => void;
  setActivePlugins: (names: string[]) => void;
  setStructuredOutputs: (structuredOutputs?: any) => void;
  models?: ModelOption[]
  /** True once we have attempted to load models from the backend (even if the list is empty). */
  modelsLoaded: boolean;
  setModels: (models: ModelOption[]) => void;
  setThrottle: (throttle: number) => void;
  providerMetadata?: any
  setProviderMetadata: (metadata: any) => void;
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

const DEFAULT_ANNOTATIONS: ToolAnnotations = {
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
  experimentalThrottle: 100,
  models: [],
  modelsLoaded: false,
  chatMode: "chat",
  customHeaders: {},
  structuredOutputs: undefined,
  toolAnnotations: DEFAULT_ANNOTATIONS,
  chatErrors: [],
  approveAll: false,
  allowedToolList: [],
  activePlugins: [],
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
      chatErrors: [...state.chatErrors, message],
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
    set(() => ({
      providerMetadata: { ...providerMetadata },
    })),
  resetChatSettings: () =>
    set(() => ({
      providerMetadata: { ...defaultProviderMetadata },
      temperature: 1,
      enabledProviders: [],
      toolAnnotations: DEFAULT_ANNOTATIONS
    })),
  selectConversation: (id) =>
    set(() => ({
      selectedConversationId: id,
    })),
});
