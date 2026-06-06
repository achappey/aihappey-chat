import { createAppStore, RootState } from "./createAppStore";
import { useStore } from "zustand/react";

const store = createAppStore();
/** Generic selector hook for the global store. */
const useAppStore = <T>(selector: (state: RootState) => T): T =>
  useStore(store, selector);

/** Selector for remoteStorageConnected flag */
export const useRemoteStorageConnected = () =>
  useAppStore(s => (s as any).remoteStorageConnected as boolean);

export { createAppStore, useAppStore, store };

export type { Resource, ResourceTemplate, Prompt } from "aihappey-mcp";
export { SamplingRequest } from "./slices/mcpSlice";
export type { McpContents } from "./slices/mcpSlice";
export type { UiAttachment } from "./slices/uiSlice";
export type {
  ProviderCapability,
  EnabledProvidersByType,
} from "./slices/uiSlice";
export {
  PROVIDER_CAPABILITIES,
  createEmptyEnabledProvidersByType,
} from "./slices/uiSlice";
export {
  defaultAgents,
  ensureDefaultAgents,
  SIDE_INFERENCE_DEFAULT_AGENT_NAMES,
} from "./slices/defaultAgents";
export { defaultProviderMetadata } from "./slices/defaultProviderMetadata";
export {
  defaultProviderRealtimeConversationMetadata,
  defaultProviderRealtimeMetadata,
} from "./slices/defaultProviderRealtimeMetadata";
export * from "./slices/agentModelProviderMetadata";
export {
  DEFAULT_CHAT_TOOL_ANNOTATIONS,
  DEFAULT_SIDE_INFERENCE_AGENT_SELECTION,
} from "./slices/chatSlice";
export type { SideInferenceAgentNames } from "./slices/chatSlice";
export * from "./slices/defaultProviderTranscriptionMetadata";
export * from "./slices/defaultProviderSpeechMetadata";
export * from "./slices/defaultProviderRerankingMetadata";

export type { ServerItem } from './slices/mcpServersSlice';
export { mcpRuntime, connectPersistent, connectServerPersistent } from "./slices/uiSlice";
