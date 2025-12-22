import type { StateCreator } from "zustand";
import { defaultProviderMetadata } from "./defaultProviderMetadata";
import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types";
import type { ModelOption } from "aihappey-types";

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
  setStructuredOutputs: (structuredOutputs?: any) => void;
  localAgentTools?: boolean
  setLocalAgentTools: (value: boolean) => void;
  localConversationTools?: boolean
  setLocalConversationTools: (value: boolean) => void;
  localSettingsTools?: boolean
  setLocalSettingsTools: (value: boolean) => void;
  localMcpTools?: boolean
  setLocalMcpTools: (value: boolean) => void;
  models?: ModelOption[]
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
  experimentalThrottle: 300,
  models: [],
  chatMode: "chat",
  customHeaders: {},
  structuredOutputs: undefined,
  toolAnnotations: DEFAULT_ANNOTATIONS,
  chatErrors: [],
  setSelectedModel: (model) =>
    set((state: any) => {
      return {
        selectedModel: model
      }
    }),
  setLocalMcpTools: (value) => {
    set((state: any) => ({
      localMcpTools: value,
    }));
  },
  setLocalSettingsTools: (value) => {
    set((state: any) => ({
      localSettingsTools: value,
    }));
  },
  setStructuredOutputs: (value) => {
    set((state: any) => ({
      structuredOutputs: value,
    }));
  },
  setLocalAgentTools: (value) => {
    set((state: any) => ({
      localAgentTools: value,
    }));
  },
  setLocalConversationTools: (value) => {
    set((state: any) => ({
      localConversationTools: value,
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
