import { getRealtimeToken, type RealtimeResponse } from "aihappey-ai";
import type { Tool } from "@modelcontextprotocol/sdk/types";
import type { ChatConfig } from "../chat/context/ChatContext";
import { mcpToolToRealtimeFunctionTool, stripProviderPrefix } from "./realtimeMessageParts";
import {
  startOpenAiRealtimeConversationWebrtcSession,
  type RealtimeConversationEvents,
} from "./startRealtimeConversationWebrtc";
import type { RealtimeConversationSession } from "./startRealtimeConversationWebrtc";

export type { RealtimeConversationSession } from "./startRealtimeConversationWebrtc";

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

const describeUnsupportedProvider = (providerId: string) =>
  `Realtime audio conversation is not supported for provider '${providerId}'.`;

export const parseRealtimeProviderIdFromModelId = (modelId?: string): RealtimeConversationProviderId | null => {
  if (!modelId) return null;
  const idx = modelId.indexOf("/");
  if (idx <= 0) return null;
  return modelId.slice(0, idx).toLowerCase();
};

const isPlainRecord = (value: any): value is Record<string, any> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const compactUndefined = (value: any): any => {
  if (Array.isArray(value)) return value.map(compactUndefined);
  if (!isPlainRecord(value)) return value;
  const next: Record<string, any> = {};
  for (const [key, child] of Object.entries(value)) {
    if (child === undefined) continue;
    next[key] = compactUndefined(child);
  }
  return next;
};

const deepMerge = (...values: any[]) => {
  const out: Record<string, any> = {};
  for (const value of values) {
    if (!isPlainRecord(value)) continue;
    for (const [key, child] of Object.entries(value)) {
      if (child === undefined) continue;
      if (isPlainRecord(child) && isPlainRecord(out[key])) {
        out[key] = deepMerge(out[key], child);
      } else {
        out[key] = child;
      }
    }
  }
  return out;
};

export const buildOpenAiRealtimeSessionConfig = (args: RealtimeConversationProviderSessionConfigArgs) => {
  const realtimeOpenAiMetadata = (args.providerRealtimeConversationMetadata as any)?.openai ?? {};
  const chatOpenAiMetadata = (args.providerMetadata as any)?.openai ?? {};
  const sessionOverrides = realtimeOpenAiMetadata?.session?.type === "realtime"
    ? realtimeOpenAiMetadata.session
    : {};
  const realtimeTools = (args.tools ?? []).map(mcpToolToRealtimeFunctionTool);
  const selectedToolChoice = args.toolChoice === "none" ? "none" : "auto";

  const chatDefaults = compactUndefined({
    instructions: args.instructions ?? chatOpenAiMetadata?.instructions,
    truncation: chatOpenAiMetadata?.truncation,
  });

  const appDefaults = compactUndefined({
    type: "realtime",
    model: stripProviderPrefix(args.model),
    output_modalities: ["audio"],
    max_output_tokens: args.maxOutputTokens,
    audio: {
      input: {
        turn_detection: {
          type: "semantic_vad",
          eagerness: "auto",
          create_response: true,
          interrupt_response: true,
        },
      },
      output: {
        voice: realtimeOpenAiMetadata?.voice ?? sessionOverrides?.audio?.output?.voice ?? "marin",
      },
    },
    ...(realtimeTools.length ? { tools: realtimeTools, tool_choice: selectedToolChoice } : {}),
  });

  if (chatOpenAiMetadata?.reasoning) {
    appDefaults.reasoning = {
      effort: chatOpenAiMetadata?.reasoning.effort,
    };
    appDefaults.parallel_tool_calls = chatOpenAiMetadata?.parallel_tool_calls;
  }

  return deepMerge(chatDefaults, appDefaults, sessionOverrides, {
    type: "realtime",
    model: stripProviderPrefix(args.model),
  });
};

const buildHeaders = async (config: ChatConfig, customHeaders?: Record<string, string>) => {
  const merged = { ...(config?.headers ?? {}), ...(customHeaders ?? {}) } as Record<string, string>;
  if (config?.getAccessToken) {
    merged.Authorization = `Bearer ${await config.getAccessToken()}`;
  }
  return merged;
};

const startOpenAiRealtimeConversation = async (args: StartRealtimeConversationProviderSessionArgs) => {
  const headers = await buildHeaders(args.config, args.customHeaders);
  const tokenClientFactory = await getRealtimeToken({
    baseUrl: args.config.baseUrl + args.config.endpoints.realtime,
    headers,
  });
  const realtimeOpenAiMetadata = (args.providerRealtimeConversationMetadata as any)?.openai ?? {};
  const sessionConfig = buildOpenAiRealtimeSessionConfig(args);

  return startOpenAiRealtimeConversationWebrtcSession({
    getEphemeralToken: () =>
      tokenClientFactory({
        model: args.model,
        providerOptions: {
          ...(args.providerRealtimeConversationMetadata ?? {}),
          openai: {
            ...realtimeOpenAiMetadata,
            session: sessionConfig,
          },
        },
      }) as Promise<RealtimeResponse>,
    events: args.events,
  });
};

const openAiRealtimeConversationProvider: RealtimeConversationProviderRuntime = {
  start: startOpenAiRealtimeConversation,
  createSessionUpdateEvent: (args) => ({
    type: "session.update",
    session: buildOpenAiRealtimeSessionConfig(args),
  }),
};

const providers: Record<string, RealtimeConversationProviderRuntime> = {
  openai: openAiRealtimeConversationProvider,
};

export const getRealtimeConversationProvider = (providerId: string) => providers[providerId];

export const startRealtimeConversationProviderSession = async (
  args: StartRealtimeConversationProviderSessionArgs
) => {
  const providerId = parseRealtimeProviderIdFromModelId(args.model);
  if (!providerId) throw new Error(`Realtime audio model id must include a provider prefix: ${args.model}`);
  const provider = getRealtimeConversationProvider(providerId);
  if (!provider) throw new Error(describeUnsupportedProvider(providerId));
  return provider.start(args);
};

export const buildRealtimeConversationSessionUpdateEvent = (
  args: RealtimeConversationProviderSessionConfigArgs
) => {
  const providerId = parseRealtimeProviderIdFromModelId(args.model);
  if (!providerId) return undefined;
  return getRealtimeConversationProvider(providerId)?.createSessionUpdateEvent?.(args);
};
