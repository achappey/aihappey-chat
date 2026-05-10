import { openAiRealtimeConversationProvider } from "./openAiRealtimeConversationProvider";
import { xAiRealtimeConversationProvider } from "./xAiRealtimeConversationProvider";
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

export const parseRealtimeProviderIdFromModelId = (modelId?: string): RealtimeConversationProviderId | null => {
  if (!modelId) return null;
  const idx = modelId.indexOf("/");
  if (idx <= 0) return null;
  return modelId.slice(0, idx).toLowerCase();
};

const providers: Record<string, RealtimeConversationProviderRuntime> = {
  openai: openAiRealtimeConversationProvider,
  xai: xAiRealtimeConversationProvider,
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
