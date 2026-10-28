import { openAiRealtimeConversationProvider } from "./openAiRealtimeConversationProvider";
import { xAiRealtimeConversationProvider } from "./xAiRealtimeConversationProvider";
import { assemblyAiRealtimeConversationProvider } from "./assemblyAiRealtimeConversationProvider";
import { agentPhoneRealtimeConversationProvider } from "./agentPhoneRealtimeConversationProvider";
import { googleRealtimeConversationProvider } from "./googleRealtimeConversationProvider";
import { cartesiaRealtimeConversationProvider } from "./cartesiaRealtimeConversationProvider";
import { opperAiRealtimeConversationProvider } from "./opperAiRealtimeConversationProvider";
import { smallestAiRealtimeConversationProvider } from "./smallestAiRealtimeConversationProvider";
import type { RealtimeConversationSession } from "./startRealtimeConversationWebrtc";
import type {
  RealtimeConversationProviderId,
  RealtimeConversationProviderRuntime,
  RealtimeConversationProviderSessionConfigArgs,
  StartRealtimeConversationProviderSessionArgs,
} from "./realtimeConversationProviderTypes";

export type { RealtimeConversationSession } from "./startRealtimeConversationWebrtc";
export type {
  RealtimeConversationProviderId,
  RealtimeConversationProviderRuntime,
  RealtimeConversationProviderSessionConfigArgs,
  StartRealtimeConversationProviderSessionArgs,
} from "./realtimeConversationProviderTypes";

const describeUnsupportedProvider = (providerId: string) =>
  `Realtime audio conversation is not supported for provider '${providerId}'.`;

const normalizeRealtimeProviderId = (providerId: string): RealtimeConversationProviderId => {
  const normalized = providerId.toLowerCase();
  return normalized === "xai" ? "spacexai" : normalized;
};

export const parseRealtimeProviderIdFromModelId = (modelId?: string): RealtimeConversationProviderId | null => {
  if (!modelId) return null;
  const idx = modelId.indexOf("/");
  if (idx <= 0) return null;
  return normalizeRealtimeProviderId(modelId.slice(0, idx));
};

const providers: Record<string, RealtimeConversationProviderRuntime> = {
  openai: openAiRealtimeConversationProvider,
  spacexai: xAiRealtimeConversationProvider,
  assemblyai: assemblyAiRealtimeConversationProvider,
  agentphone: agentPhoneRealtimeConversationProvider,
  google: googleRealtimeConversationProvider,
  cartesia: cartesiaRealtimeConversationProvider,
  opperai: opperAiRealtimeConversationProvider,
  smallestai: smallestAiRealtimeConversationProvider,
};

export const getRealtimeConversationProvider = (providerId: string) => providers[normalizeRealtimeProviderId(providerId)];

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
