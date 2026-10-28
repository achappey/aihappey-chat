import { getRealtimeToken } from "aihappey-ai";
import { buildRealtimeBackendHeaders } from "./realtimeConversationConfig";
import { startSmallestAiRealtimeConversationWsSession } from "./startSmallestAiRealtimeConversationWs";
import type { RealtimeConversationProviderRuntime } from "./realtimeConversationProviderTypes";

export const smallestAiRealtimeConversationProvider: RealtimeConversationProviderRuntime = {
  start: async args => {
    const headers = await buildRealtimeBackendHeaders(args.config, args.customHeaders, args.model);
    const tokenClient = await getRealtimeToken({ baseUrl: args.config.baseUrl + args.config.endpoints.realtime, headers });
    return startSmallestAiRealtimeConversationWsSession({
      signal: args.abortSignal,
      getEphemeralToken: () => tokenClient({ model: args.model,
        providerOptions: { smallestai: args.providerRealtimeConversationMetadata?.smallestai ?? {} } }),
      events: args.events,
    });
  },
  // Atoms configuration belongs to the registered agent. Do not send OpenAI session updates/tools.
};
