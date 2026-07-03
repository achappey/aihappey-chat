import { createAppStore, RootState } from "./createAppStore";
import { useStore } from "zustand/react";
import {
  areAgentsEqual,
  getConfiguredDefaultAgents,
  setAppStoreConfig,
  type AppStoreConfig,
} from "./appStoreConfig";

const store = createAppStore();
/** Generic selector hook for the global store. */
const useAppStore = <T>(selector: (state: RootState) => T): T =>
  useStore(store, selector);

export const configureAppStore = (config: AppStoreConfig = {}) => {
  const { previousConfig, nextConfig } = setAppStoreConfig(config);
  const currentAgents = (store.getState() as RootState).agents ?? [];

  if (currentAgents.length === 0 || areAgentsEqual(currentAgents, previousConfig.defaultAgents)) {
    store.setState({ agents: nextConfig.defaultAgents } as Partial<RootState>);
  }
};

/** Selector for remoteStorageConnected flag */
export const useRemoteStorageConnected = () =>
  useAppStore(s => (s as any).remoteStorageConnected as boolean);

export { createAppStore, useAppStore, store, getConfiguredDefaultAgents };
export type { AppStoreConfig };

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
  normalizeCustomProviderKey,
  normalizeCustomProviders,
} from "./slices/uiSlice";
export {
  CONVERSATION_NAME_AGENT_NAME,
  EXPLAIN_TOOL_CALL_AGENT_NAME,
  WELCOME_MESSAGE_AGENT_NAME,
  ensureDefaultAgents,
  cloneAgents,
  SIDE_INFERENCE_DEFAULT_AGENT_NAMES,
} from "./slices/defaultAgents";
export { defaultProviderMetadata } from "./slices/defaultProviderMetadata";
export { defaultProviderHeaders } from "./slices/defaultProviderHeaders";
export * from "./slices/providerHeaders";
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
export type {
  ApiKeyEncryptionState,
  ApiKeyEncryptionStatus,
  EncryptedApiKeys,
} from "./slices/apiKeyEncryption";
export {
  CHAT_ENDPOINT_IDS,
  CHAT_ENDPOINT_MODES,
  DEFAULT_CHAT_ENDPOINT_ID,
  DEFAULT_CHAT_ENDPOINT_MODE,
  isChatEndpointId,
  isChatEndpointMode,
  normalizeBaseUrl,
  normalizeChatEndpointId,
  normalizeChatEndpointMode,
  resolveEffectiveBaseUrl,
  resolveEffectiveChatEndpointId,
  resolveEffectiveChatEndpointMode,
  resolvePreferredProviderChatEndpoint,
} from "./slices/chatEndpoint";
export type { ChatEndpointId, ChatEndpointMode } from "./slices/chatEndpoint";
export * from "./slices/defaultProviderTranscriptionMetadata";
export * from "./slices/defaultProviderSpeechMetadata";
export * from "./slices/defaultProviderRerankingMetadata";

export type { ServerItem } from './slices/mcpServersSlice';
export { mcpRuntime, connectPersistent, connectServerPersistent } from "./slices/uiSlice";
