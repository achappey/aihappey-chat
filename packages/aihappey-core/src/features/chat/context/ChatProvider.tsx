// Core chat provider for aihappey-core, using aihappey-ai abstraction only

import { useMemo, useRef } from "react";
import { ChatContext } from "./ChatContext";
import type { ReactNode, FC } from "react";
import { defaultEndpoints } from "aihappey-ai";
import type { ChatEndpointId } from "aihappey-state";

export interface AiChatConfig {
 // api?: string;
  getAccessToken?: () => Promise<string>;
  headers?: Record<string, string>;
  fetch?: typeof fetch;
}

export interface ChatConfig extends AiChatConfig {
  modelsApi?: string;
  transcriptionApi?: string;
  samplingApi?: string;
  appName?: string;
  chatbotInstructions?: string;
  mcpCatalogUrls?: string[];
  agentEndpoint?: string;
  agentScopes?: string[];
  appVersion?: string;
  defaultChatEndpoint?: ChatEndpointId;
  defaultProvidersByType?: Partial<{
    language: string[];
    image: string[];
    audio: string[];
    transcription: string[];
    speech: string[];
    reranking: string[];
    video: string[];
  }>;
  endpoints: typeof defaultEndpoints
  baseUrl: string
}

export const ChatProvider: FC<{ config: ChatConfig; children: ReactNode }> = ({
  config,
  children,
}) => {
  const toolAbortRef = useRef<AbortController | null>(null);
  const stopTool = () => {
    toolAbortRef.current?.abort();
  };

  const value = useMemo(
    () => ({
      config,
      stopTool,
    }),
    [config]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
  
};
