import type { Tool } from "@modelcontextprotocol/sdk/types";
import type { ChatConfig } from "../chat/context/ChatContext";
import type { RealtimeConversationEvents, RealtimeConversationSession } from "./startRealtimeConversationWebrtc";

export type RealtimeConversationProviderId = string;

export type RealtimeConversationProviderRuntime = {
  start: (args: StartRealtimeConversationProviderSessionArgs) => Promise<RealtimeConversationSession>;
  createSessionUpdateEvent?: (args: RealtimeConversationProviderSessionConfigArgs) => any | undefined;
};

export type RealtimeConversationProviderSessionConfigArgs = {
  model: string;
  instructions?: string;
  maxOutputTokens?: number;
  toolChoice?: string;
  tools?: Tool[];
  providerMetadata?: any;
  providerRealtimeConversationMetadata?: any;
};

export type StartRealtimeConversationProviderSessionArgs = RealtimeConversationProviderSessionConfigArgs & {
  config: ChatConfig;
  customHeaders?: Record<string, string>;
  events?: RealtimeConversationEvents;
};

