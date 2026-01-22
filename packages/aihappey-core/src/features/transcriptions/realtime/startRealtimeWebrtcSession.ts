import type { RealtimeResponse } from "aihappey-ai";
import { startOpenAiRealtimeWebrtcSession } from "./openaiRealtimeWebrtc";
import type { OpenAiRealtimeWebrtcEvents, OpenAiRealtimeWebrtcSession } from "./openaiRealtimeWebrtc";
import { startElevenLabsRealtimeWsSession } from "./startElevenLabsRealtimeWsSession";
import { startDeepgramRealtimeWsSession } from "./startDeepgramRealtimeWsSession";
import { startGladiaRealtimeWsSession } from "./startGladiaRealtimeWsSession";
import { startAssemblyAiRealtimeWsSession } from "./startAssemblyAiRealtimeWsSession";

export type RealtimeTranscriptionSession = {
  /** Provider-specific implementation detail (WebRTC / WebSocket). */
  kind: "webrtc" | "ws";
  stop: () => Promise<void>;
};

export type RealtimeTranscriptionEvents = OpenAiRealtimeWebrtcEvents;

export type StartRealtimeSessionArgs = {
  providerId: string;
  /** Full selected model id (e.g. `openai/gpt-4o-realtime-preview` or `elevenlabs/scribe_v2_realtime`). */
  selectedModel: string;
  getEphemeralToken: () => Promise<RealtimeResponse>;
  events?: RealtimeTranscriptionEvents;
  /** UI-configured provider options (flat map). For ElevenLabs these are mapped to WSS query params. */
  providerRealtimeMetadata?: any;
};

const stripProviderPrefix = (modelId: string): string => {
  const idx = modelId.indexOf("/");
  return idx >= 0 ? modelId.slice(idx + 1) : modelId;
};

export async function startRealtimeWebrtcSession(args: StartRealtimeSessionArgs): Promise<RealtimeTranscriptionSession> {
  const { providerId, getEphemeralToken, events, selectedModel, providerRealtimeMetadata } = args;

  // Today only OpenAI is implemented.
  // Adding other providers later should happen here (or via a provider registry).
  if (providerId === "openai") {
    const session = await startOpenAiRealtimeWebrtcSession({ getEphemeralToken, events });
    return {
      kind: "webrtc",
      stop: session.stop,
    };
  }

  if (providerId === "elevenlabs") {
    const elevenConfig = (providerRealtimeMetadata as any)?.elevenlabs ?? (providerRealtimeMetadata as any) ?? {};
    const elevenModelId = stripProviderPrefix(selectedModel);
    const session = await startElevenLabsRealtimeWsSession({
      getEphemeralToken,
      modelId: elevenModelId,
      config: elevenConfig,
      events,
    });
    return {
      kind: "ws",
      stop: session.stop,
    };
  }

  if (providerId === "deepgram") {
    const deepgramConfig = (providerRealtimeMetadata as any)?.deepgram ?? (providerRealtimeMetadata as any) ?? {};
    const deepgramModelId = stripProviderPrefix(selectedModel);
    const session = await startDeepgramRealtimeWsSession({
      getEphemeralToken,
      modelId: deepgramModelId,
      config: deepgramConfig,
      events,
    });
    return {
      kind: "ws",
      stop: session.stop,
    };
  }

  if (providerId === "gladia") {
    const gladiaConfig = (providerRealtimeMetadata as any)?.gladia ?? (providerRealtimeMetadata as any) ?? {};
    const session = await startGladiaRealtimeWsSession({
      getEphemeralToken,
      config: gladiaConfig,
      events,
    });
    return {
      kind: "ws",
      stop: session.stop,
    };
  }

  if (providerId === "assemblyai") {
    const assemblyAiConfig = (providerRealtimeMetadata as any)?.assemblyai ?? (providerRealtimeMetadata as any) ?? {};
    const assemblyAiModelId = stripProviderPrefix(selectedModel);
    const session = await startAssemblyAiRealtimeWsSession({
      getEphemeralToken,
      modelId: assemblyAiModelId,
      config: assemblyAiConfig,
      events,
    });
    return {
      kind: "ws",
      stop: session.stop,
    };
  }

  throw new Error(`Realtime transcription is not supported for provider '${providerId}'.`);
}

