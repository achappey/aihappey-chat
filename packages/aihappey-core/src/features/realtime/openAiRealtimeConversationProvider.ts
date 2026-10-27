import { createRealtimeProvider, getRealtimeToken, type RealtimeResponse } from "aihappey-ai";
import { buildLiveSessionConfig, usesOpenAiLiveProtocol } from './liveSessionConfig';
import { startGatewayRealtimeWebrtc } from './startGatewayRealtimeWebrtc';
import { mcpToolToRealtimeFunctionTool, stripProviderPrefix } from "./realtimeMessageParts";
import { startOpenAiRealtimeConversationWebrtcSession } from "./startRealtimeConversationWebrtc";
import { buildRealtimeBackendHeaders, compactUndefined, deepMerge } from "./realtimeConversationConfig";
import type {
  RealtimeConversationProviderRuntime,
  RealtimeConversationProviderSessionConfigArgs,
  StartRealtimeConversationProviderSessionArgs,
} from "./realtimeConversationProviderTypes";

export const buildOpenAiRealtimeSessionConfig = (args: RealtimeConversationProviderSessionConfigArgs) => {
  const realtimeOpenAiMetadata = (args.providerRealtimeConversationMetadata as any)?.openai ?? {};
  const chatOpenAiMetadata = (args.providerMetadata as any)?.openai ?? {};
  const sessionOverrides = realtimeOpenAiMetadata?.session?.type === "realtime"
    ? Object.fromEntries(Object.entries(realtimeOpenAiMetadata.session).filter(([key]) => !['delegation', 'client', 'input', 'store', 'triggers'].includes(key))) as any
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

  if (sessionOverrides?.reasoning) {
    appDefaults.parallel_tool_calls = chatOpenAiMetadata?.parallel_tool_calls;
  }

  return deepMerge(chatDefaults, appDefaults, sessionOverrides, {
    type: "realtime",
    model: stripProviderPrefix(args.model),
  });
};

const startOpenAiRealtimeConversation = async (args: StartRealtimeConversationProviderSessionArgs) => {
  const headers = await buildRealtimeBackendHeaders(args.config, args.customHeaders, args.model);
  if (args.modelTags?.includes('realtime-session')) {
    const live = usesOpenAiLiveProtocol(args.modelTags);
    const model = createRealtimeProvider({
      baseUrl: args.config.baseUrl + (args.config.endpoints.realtimeSession ?? '/api/realtime/session'),
      headers, fetch: args.config.fetch,
    }).realtimeModel(args.model, live ? 'live' : 'realtime');
    const sessionConfig = live
      ? buildLiveSessionConfig(args.providerRealtimeConversationMetadata?.openai ?? {}, args.instructions)
      : { providerOptions: { openai: { session: buildOpenAiRealtimeSessionConfig(args) } } };
    return startGatewayRealtimeWebrtc({ model, sessionConfig, events: args.events, signal: args.abortSignal });
  }
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

export const openAiRealtimeConversationProvider: RealtimeConversationProviderRuntime = {
  start: startOpenAiRealtimeConversation,
  createSessionUpdateEvent: (args) => usesOpenAiLiveProtocol(args.modelTags) ? undefined : ({
    type: "session.update",
    session: buildOpenAiRealtimeSessionConfig(args),
  }),
};

