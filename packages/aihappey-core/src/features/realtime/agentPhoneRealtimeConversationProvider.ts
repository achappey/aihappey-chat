import { getRealtimeToken, type RealtimeResponse } from "aihappey-ai";
import { stripProviderPrefix } from "./realtimeMessageParts";
import { buildRealtimeBackendHeaders, compactUndefined, deepMerge } from "./realtimeConversationConfig";
import { startAgentPhoneRealtimeConversationSdkSession } from "./startAgentPhoneRealtimeConversationSdk";
import type {
  RealtimeConversationProviderRuntime,
  RealtimeConversationProviderSessionConfigArgs,
  StartRealtimeConversationProviderSessionArgs,
} from "./realtimeConversationProviderTypes";

export const buildAgentPhoneRealtimeSessionConfig = (args: RealtimeConversationProviderSessionConfigArgs) => {
  const realtimeAgentPhoneMetadata = (args.providerRealtimeConversationMetadata as any)?.agentphone ?? {};
  const sessionOverrides = realtimeAgentPhoneMetadata?.session && typeof realtimeAgentPhoneMetadata.session === "object"
    ? realtimeAgentPhoneMetadata.session
    : {};

  return deepMerge(
    compactUndefined({
      agentId: realtimeAgentPhoneMetadata?.agentId ?? stripProviderPrefix(args.model),
      sampleRate: realtimeAgentPhoneMetadata?.sampleRate,
      captureDeviceId: realtimeAgentPhoneMetadata?.captureDeviceId,
      playbackDeviceId: realtimeAgentPhoneMetadata?.playbackDeviceId,
      emitRawAudioSamples: realtimeAgentPhoneMetadata?.emitRawAudioSamples,
    }),
    sessionOverrides,
    { agentId: sessionOverrides?.agentId ?? realtimeAgentPhoneMetadata?.agentId ?? stripProviderPrefix(args.model) }
  );
};

const startAgentPhoneRealtimeConversation = async (args: StartRealtimeConversationProviderSessionArgs) => {
  const headers = await buildRealtimeBackendHeaders(args.config, args.customHeaders);
  const tokenClientFactory = await getRealtimeToken({
    baseUrl: args.config.baseUrl + args.config.endpoints.realtime,
    headers,
  });
  const realtimeAgentPhoneMetadata = (args.providerRealtimeConversationMetadata as any)?.agentphone ?? {};
  const sessionConfig = buildAgentPhoneRealtimeSessionConfig(args);

  return startAgentPhoneRealtimeConversationSdkSession({
    config: sessionConfig,
    getAccessToken: () => tokenClientFactory({
      model: args.model,
      providerOptions: {
        ...(args.providerRealtimeConversationMetadata ?? {}),
        agentphone: {
          ...realtimeAgentPhoneMetadata,
          session: sessionConfig,
        },
      },
    }) as Promise<RealtimeResponse>,
    events: args.events,
  });
};

export const agentPhoneRealtimeConversationProvider: RealtimeConversationProviderRuntime = {
  start: startAgentPhoneRealtimeConversation,
  createSessionUpdateEvent: (args) => ({
    type: "agentphone.session.update",
    session: buildAgentPhoneRealtimeSessionConfig(args),
  }),
};

