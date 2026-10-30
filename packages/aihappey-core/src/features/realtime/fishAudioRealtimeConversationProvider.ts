import { getRealtimeToken } from "aihappey-ai";
import { buildRealtimeBackendHeaders } from "./realtimeConversationConfig";
import { startFishAudioSession } from "./fishAudioSession";
import type { RealtimeConversationProviderRuntime } from "./realtimeConversationProviderTypes";

export const fishAudioRealtimeConversationProvider: RealtimeConversationProviderRuntime = {
  start: async args => {
    const headers = await buildRealtimeBackendHeaders(args.config, args.customHeaders, args.model);
    const safeHeaders = new Headers(headers);
    safeHeaders.delete("X-AIHappey-Debug"); // Ephemeral session tokens must not enter backend API-debug storage.
    const create = await getRealtimeToken({ baseUrl: args.config.baseUrl + args.config.endpoints.realtime,
      headers: Object.fromEntries(safeHeaders), signal: args.abortSignal });
    args.abortSignal?.throwIfAborted();
    const options = { ...(args.providerRealtimeConversationMetadata?.fishaudio ?? {}) };
    // The published agent owns its prompt/voice/tools unless the caller explicitly requests an override.
    options.client_timezone ??= Intl.DateTimeFormat().resolvedOptions().timeZone;
    const token = await create({ model: args.model, providerOptions: { fishaudio: options } });
    args.abortSignal?.throwIfAborted();
    const client = await startFishAudioSession({ sessionToken: token.providerMetadata?.fishaudio,
      toolNames: args.toolChoice === "none" ? [] : args.tools?.map(tool => tool.name), signal: args.abortSignal,
      onEvent: event => args.events?.onEvent?.(event), onOpen: args.events?.onOpen,
      onError: message => args.events?.onError?.(message) });
    return { kind: "sdk", provider: "fishaudio", client, send: client.send,
      setMicrophoneEnabled: enabled => { void client.setMuted(!enabled).catch(() => args.events?.onError?.("Fish Audio microphone could not be changed.")); },
      stop: client.stop };
  },
};
