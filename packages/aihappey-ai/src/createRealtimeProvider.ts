import { createOpenAI } from '@ai-sdk/openai';
import type { Experimental_RealtimeModelV4 as RealtimeModelV4 } from '@ai-sdk/provider';

/** SDK model adapter: provisioning stays on the gateway; credentials never go to a provider URL. */
export function createRealtimeProvider(config: {
  baseUrl: string;
  headers?: Record<string, string>;
  fetch?: typeof fetch;
}) {
  return {
    realtimeModel(modelId: string, api: 'live' | 'realtime' = 'realtime'): RealtimeModelV4 {
      const localModel = modelId.slice(modelId.indexOf('/') + 1);
      // This instance is used for protocol mapping only, never for authenticated network operations.
      const protocol = createOpenAI({ apiKey: 'protocol-only' }).experimental_realtime(localModel, { api });
      return {
        specificationVersion: 'v4', provider: protocol.provider, modelId,
        capabilities: { ...protocol.capabilities!, transports: ['webrtc'], connections: ['webrtc'] },
        getWebRTCConfig: () => protocol.getWebRTCConfig?.() ?? { dataChannelLabel: 'oai-events' },
        parseServerEvent: raw => protocol.parseServerEvent(raw),
        createServerEventParser: () => protocol.createServerEventParser?.() ?? (raw => protocol.parseServerEvent(raw)),
        serializeClientEvent: event => protocol.serializeClientEvent(event),
        buildSessionConfig: value => protocol.buildSessionConfig(value),
        async doCreateWebRTCSession({ sdp, sessionConfig, abortSignal }) {
          abortSignal?.throwIfAborted();
          if (!sdp.trim()) throw new Error('A WebRTC SDP offer is required.');
          const response = await (config.fetch ?? fetch)(`${config.baseUrl.replace(/\/$/, '')}/${modelId.split('/').map(encodeURIComponent).join('/')}`, {
            method: 'POST', signal: abortSignal, redirect: 'error',
            headers: { ...config.headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ sdp, sessionConfig }),
          });
          if (!response.ok) throw new Error(`Realtime session creation failed (HTTP ${response.status}).`);
          const result = await response.json();
          if (typeof result.sessionId !== 'string' || !result.sessionId.trim() || typeof result.sdp !== 'string' || !result.sdp.trim() || result.sdp.length > 262144)
            throw new Error('The gateway returned an invalid WebRTC session.');
          return { sessionId: result.sessionId, sdp: result.sdp };
        },
      } satisfies RealtimeModelV4;
    },
  };
}
