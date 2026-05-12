import { getRealtimeToken, type RealtimeResponse } from "aihappey-ai";
import { mcpToolToRealtimeFunctionTool } from "./realtimeMessageParts";
import { buildRealtimeBackendHeaders, compactUndefined, deepMerge } from "./realtimeConversationConfig";
import { startAssemblyAiRealtimeConversationWsSession } from "./startAssemblyAiRealtimeConversationWs";
import type {
  RealtimeConversationProviderRuntime,
  RealtimeConversationProviderSessionConfigArgs,
  StartRealtimeConversationProviderSessionArgs,
} from "./realtimeConversationProviderTypes";

const toAssemblyAiAudioFormat = (format: any) => {
  const encoding = format?.encoding ?? format?.type;
  return compactUndefined({
    encoding: encoding === "audio/pcma" || encoding === "audio/pcmu" || encoding === "audio/pcm" ? encoding : "audio/pcm",
  });
};

const toAssemblyAiToolDefinition = (tool: any) => {
  const realtimeTool = mcpToolToRealtimeFunctionTool(tool);
  return {
    type: "function" as const,
    name: realtimeTool.name,
    description: realtimeTool.description,
    parameters: realtimeTool.parameters,
  };
};

export const buildAssemblyAiRealtimeSessionConfig = (args: RealtimeConversationProviderSessionConfigArgs) => {
  const realtimeAssemblyAiMetadata = (args.providerRealtimeConversationMetadata as any)?.assemblyai ?? {};
  const chatAssemblyAiMetadata = (args.providerMetadata as any)?.assemblyai ?? {};
  const sessionOverrides = realtimeAssemblyAiMetadata?.session && typeof realtimeAssemblyAiMetadata.session === "object"
    ? realtimeAssemblyAiMetadata.session
    : {};
  const realtimeTools = (args.tools ?? []).map(toAssemblyAiToolDefinition);
  const inputFormat = sessionOverrides?.input?.format ?? sessionOverrides?.audio?.input?.format;
  const outputFormat = sessionOverrides?.output?.format ?? sessionOverrides?.audio?.output?.format;

  const chatDefaults = compactUndefined({
    system_prompt: args.instructions ?? chatAssemblyAiMetadata?.system_prompt ?? chatAssemblyAiMetadata?.instructions,
  });

  const appDefaults = compactUndefined({
    system_prompt: args.instructions ?? chatAssemblyAiMetadata?.system_prompt ?? chatAssemblyAiMetadata?.instructions,
    greeting: realtimeAssemblyAiMetadata?.greeting ?? sessionOverrides?.greeting,
    input: {
      format: toAssemblyAiAudioFormat(inputFormat),
      keyterms: sessionOverrides?.input?.keyterms ?? realtimeAssemblyAiMetadata?.keyterms,
      turn_detection: sessionOverrides?.input?.turn_detection ?? {
        interrupt_response: true,
      },
    },
    output: {
      voice: realtimeAssemblyAiMetadata?.voice ?? sessionOverrides?.output?.voice ?? "ivy",
      format: toAssemblyAiAudioFormat(outputFormat),
    },
    ...(realtimeTools.length && args.toolChoice !== "none" ? { tools: realtimeTools } : {}),
  });

  return deepMerge(chatDefaults, appDefaults, sessionOverrides);
};

const startAssemblyAiRealtimeConversation = async (args: StartRealtimeConversationProviderSessionArgs) => {
  const headers = await buildRealtimeBackendHeaders(args.config, args.customHeaders);
  const tokenClientFactory = await getRealtimeToken({
    baseUrl: args.config.baseUrl + args.config.endpoints.realtime,
    headers,
  });
  const realtimeAssemblyAiMetadata = (args.providerRealtimeConversationMetadata as any)?.assemblyai ?? {};
  const sessionConfig = buildAssemblyAiRealtimeSessionConfig(args);

  return startAssemblyAiRealtimeConversationWsSession({
    session: sessionConfig,
    getEphemeralToken: () =>
      tokenClientFactory({
        model: args.model,
        providerOptions: {
          ...(args.providerRealtimeConversationMetadata ?? {}),
          assemblyai: {
            ...realtimeAssemblyAiMetadata,
            session: sessionConfig,
          },
        },
      }) as Promise<RealtimeResponse>,
    events: args.events,
  });
};

export const assemblyAiRealtimeConversationProvider: RealtimeConversationProviderRuntime = {
  start: startAssemblyAiRealtimeConversation,
  createSessionUpdateEvent: (args) => ({
    type: "session.update",
    session: buildAssemblyAiRealtimeSessionConfig(args),
  }),
};

