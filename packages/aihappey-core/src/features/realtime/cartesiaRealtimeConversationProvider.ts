import { getRealtimeToken, type RealtimeResponse } from "aihappey-ai";
import { buildRealtimeBackendHeaders } from "./realtimeConversationConfig";
import { startCartesiaRealtimeConversationWsSession } from "./startCartesiaRealtimeConversationWs";
import type { RealtimeConversationProviderRuntime, StartRealtimeConversationProviderSessionArgs } from "./realtimeConversationProviderTypes";

export const cartesiaRealtimeConversationProvider: RealtimeConversationProviderRuntime = {
  start: async (args: StartRealtimeConversationProviderSessionArgs) => {
    const client = await getRealtimeToken({
      baseUrl: args.config.baseUrl + args.config.endpoints.realtime,
      headers: await buildRealtimeBackendHeaders(args.config, args.customHeaders),
    });
    const settings = args.providerRealtimeConversationMetadata?.cartesia ?? {};
    return startCartesiaRealtimeConversationWsSession({
      agentId: args.model.replace(/^cartesia\/agents\//, ""),
      outputDelivery: settings.audio?.output_delivery === "as_available" ? "as_available" : "speaking_pace",
      getEphemeralToken: () => client({ model: args.model, providerOptions: { cartesia: { expires_in: settings.expires_in ?? 600 } } }) as Promise<RealtimeResponse>,
      events: args.events,
    });
  },
};
