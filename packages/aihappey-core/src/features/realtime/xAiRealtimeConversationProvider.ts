import { getRealtimeToken, type RealtimeResponse } from "aihappey-ai";
import { mcpToolToRealtimeFunctionTool, stripProviderPrefix } from "./realtimeMessageParts";
import { buildRealtimeBackendHeaders, compactUndefined, deepMerge } from "./realtimeConversationConfig";
import { startXAiRealtimeConversationWsSession } from "./startXAiRealtimeConversationWs";
import type {
  RealtimeConversationProviderRuntime,
  RealtimeConversationProviderSessionConfigArgs,
  StartRealtimeConversationProviderSessionArgs,
} from "./realtimeConversationProviderTypes";

export const buildXAiRealtimeSessionConfig = (args: RealtimeConversationProviderSessionConfigArgs) => {
  const realtimeXAiMetadata = (args.providerRealtimeConversationMetadata as any)?.xai ?? {};
  const chatXAiMetadata = (args.providerMetadata as any)?.xai ?? {};
  const sessionOverrides = realtimeXAiMetadata?.session && typeof realtimeXAiMetadata.session === "object"
    ? realtimeXAiMetadata.session
    : {};
  const realtimeTools = (args.tools ?? []).map(mcpToolToRealtimeFunctionTool);

  const chatDefaults = compactUndefined({
    instructions: args.instructions ?? chatXAiMetadata?.instructions,
  });

  const appDefaults = compactUndefined({
    voice: realtimeXAiMetadata?.voice ?? sessionOverrides?.voice ?? "eve",
    instructions: args.instructions ?? chatXAiMetadata?.instructions,
    turn_detection: sessionOverrides?.turn_detection ?? { type: "server_vad" },
    audio: {
      input: {
        format: {
          type: "audio/pcm",
          rate: 24000,
        },
      },
      output: {
        format: {
          type: "audio/pcm",
          rate: 24000,
        },
      },
    },
    ...(realtimeTools.length && args.toolChoice !== "none" ? { tools: realtimeTools } : {}),
  });

  return deepMerge(chatDefaults, appDefaults, sessionOverrides);
};

const startXAiRealtimeConversation = async (args: StartRealtimeConversationProviderSessionArgs) => {
  const headers = await buildRealtimeBackendHeaders(args.config, args.customHeaders);
  const tokenClientFactory = await getRealtimeToken({
    baseUrl: args.config.baseUrl + args.config.endpoints.realtime,
    headers,
  });
  const realtimeXAiMetadata = (args.providerRealtimeConversationMetadata as any)?.xai ?? {};
  const sessionConfig = buildXAiRealtimeSessionConfig(args);

  return startXAiRealtimeConversationWsSession({
    model: stripProviderPrefix(args.model),
    session: sessionConfig,
    getEphemeralToken: () =>
      tokenClientFactory({
        model: args.model,
        providerOptions: {
          ...(args.providerRealtimeConversationMetadata ?? {}),
          xai: {
            ...realtimeXAiMetadata,
            session: sessionConfig,
          },
        },
      }) as Promise<RealtimeResponse>,
    events: args.events,
  });
};

export const xAiRealtimeConversationProvider: RealtimeConversationProviderRuntime = {
  start: startXAiRealtimeConversation,
  createSessionUpdateEvent: (args) => ({
    type: "session.update",
    session: buildXAiRealtimeSessionConfig(args),
  }),
};

