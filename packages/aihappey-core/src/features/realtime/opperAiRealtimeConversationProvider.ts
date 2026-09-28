import { getRealtimeToken, type RealtimeResponse } from "aihappey-ai";
import { buildRealtimeBackendHeaders, compactUndefined, deepMerge, isPlainRecord } from "./realtimeConversationConfig";
import { stripProviderPrefix } from "./realtimeMessageParts";
import { startOpperAiRealtimeConversationWsSession } from "./startOpperAiRealtimeConversationWs";
import type {
  RealtimeConversationProviderRuntime,
  RealtimeConversationProviderSessionConfigArgs,
  StartRealtimeConversationProviderSessionArgs,
} from "./realtimeConversationProviderTypes";

export const buildOpperAiRealtimeSessionConfig = (args: RealtimeConversationProviderSessionConfigArgs) => {
  const metadata = (args.providerRealtimeConversationMetadata as any)?.opperai ?? {};
  const chatMetadata = (args.providerMetadata as any)?.opperai ?? {};
  const overrides = isPlainRecord(metadata.session) ? metadata.session : {};
  const model = stripProviderPrefix(args.model);
  if (!model.includes("/")) throw new Error(`OpperAI realtime requires a provider-prefixed upstream model: ${args.model}`);

  const tools = (args.tools ?? []).map((tool) => ({
    name: tool.name,
    description: tool.description ?? tool.annotations?.title ?? tool.name,
    parameters: (tool as any).inputSchema ?? { type: "object", properties: {} },
  }));

  return {
    ...deepMerge(compactUndefined({
      instructions: args.instructions ?? chatMetadata.instructions,
      modalities: ["audio"],
      turn_detection: { type: "server_vad" },
      input_transcription: true,
      output_transcription: true,
      ...(tools.length && args.toolChoice !== "none" ? { tools } : {}),
    }), overrides),
    // The client-side model is opperai/<upstream-provider>/<model>. Never send
    // the gateway prefix (or an override for another model) to session.start.
    model,
  };
};

const startOpperAiRealtimeConversation = async (args: StartRealtimeConversationProviderSessionArgs) => {
  const headers = await buildRealtimeBackendHeaders(args.config, args.customHeaders);
  const tokenClient = await getRealtimeToken({
    baseUrl: args.config.baseUrl + args.config.endpoints.realtime,
    headers,
  });
  const metadata = (args.providerRealtimeConversationMetadata as any)?.opperai ?? {};
  const sessionConfig = buildOpperAiRealtimeSessionConfig(args);

  return startOpperAiRealtimeConversationWsSession({
    config: sessionConfig,
    getEphemeralToken: () => tokenClient({
      model: args.model,
      providerOptions: {
        ...(args.providerRealtimeConversationMetadata ?? {}),
        opperai: { ...metadata, session: sessionConfig },
      },
    }) as Promise<RealtimeResponse>,
    events: args.events,
  });
};

export const opperAiRealtimeConversationProvider: RealtimeConversationProviderRuntime = {
  start: startOpperAiRealtimeConversation,
  // All config is sent in the first session.start frame. OpenAI transcription
  // fields cannot be updated mid-session and Gemini ignores session.update.
};
