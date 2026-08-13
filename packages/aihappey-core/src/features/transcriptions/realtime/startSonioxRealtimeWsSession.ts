import type { RealtimeResponse } from "aihappey-ai";
import type { RealtimeTranscriptionEvents } from "./startRealtimeWebrtcSession";

const SONIOX_WEBSOCKET_URL = "wss://stt-rt.soniox.com/transcribe-websocket";
const DEFAULT_SAMPLE_RATE = 16000;
const FINISHED_WAIT_MS = 1500;

export type SonioxToken = {
  text?: string;
  start_ms?: number;
  end_ms?: number;
  confidence?: number;
  is_final?: boolean;
  speaker?: string;
  translation_status?: string;
  language?: string;
  source_language?: string;
};

export type SonioxRealtimeResponse = {
  tokens?: SonioxToken[];
  final_audio_proc_ms?: number;
  total_audio_proc_ms?: number;
  finished?: boolean;
  error_code?: number;
  error_type?: string;
  error_message?: string;
  more_info?: string;
  request_id?: string;
};

/**
 * Soniox WebSocket start configuration. Kept permissive so a future settings
 * form can expose additional Soniox options without changing this transport.
 */
export type SonioxRealtimeConfig = Record<string, unknown> & {
  model?: string;
  audio_format?: string;
  sample_rate?: number;
  num_channels?: number;
  language_hints?: string[];
  language_hints_strict?: boolean;
  context?: Record<string, unknown>;
  enable_speaker_diarization?: boolean;
  enable_language_identification?: boolean;
  enable_endpoint_detection?: boolean;
  max_endpoint_delay_ms?: number;
  endpoint_sensitivity?: number;
  endpoint_latency_adjustment_level?: number;
  translation?: Record<string, unknown>;
};

export type SonioxRealtimeWsSession = {
  ws: WebSocket;
  stream: MediaStream;
  stop: () => Promise<void>;
};

const describeError = (error: unknown): string => {
  if (!error) return "unknown";
  if (error instanceof Error) return error.message || error.name;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
};

const stripProviderPrefix = (modelId: string): string => {
  const index = modelId.indexOf("/");
  return index >= 0 ? modelId.slice(index + 1) : modelId;
};

/** Build a Soniox start message while keeping temporary-key creation options server-side. */
export const buildSonioxRealtimeConfig = (args: {
  apiKey: string;
  modelId: string;
  config?: SonioxRealtimeConfig;
}): SonioxRealtimeConfig & { api_key: string } => {
  const configured = { ...(args.config ?? {}) };

  // These configure temporary-key creation in the backend, not a WebSocket session.
  delete configured.api_key;
  delete configured.expires_in_seconds;
  delete configured.expiresInSeconds;
  delete configured.max_session_duration_seconds;
  delete configured.maxSessionDurationSeconds;
  delete configured.client_reference_id;
  delete configured.clientReferenceId;

  const selectedModel = stripProviderPrefix(args.modelId).trim();

  return {
    ...configured,
    api_key: args.apiKey,
    model: String(configured.model ?? (selectedModel || "stt-rt-v5")),
    // The browser transport below always emits mono PCM16LE at 16 kHz. Force
    // matching protocol values so raw metadata cannot accidentally desync it.
    audio_format: "pcm_s16le",
    sample_rate: DEFAULT_SAMPLE_RATE,
    num_channels: 1,
    enable_endpoint_detection: configured.enable_endpoint_detection ?? true,
  };
};

const resampleLinear = (input: Float32Array, fromRate: number, toRate: number): Float32Array => {
  if (fromRate === toRate) return input;
  const ratio = fromRate / toRate;
  const output = new Float32Array(Math.max(1, Math.round(input.length / ratio)));
  for (let i = 0; i < output.length; i++) {
    const position = i * ratio;
    const lower = Math.floor(position);
    const upper = Math.min(lower + 1, input.length - 1);
    const fraction = position - lower;
    output[i] = (1 - fraction) * (input[lower] ?? 0) + fraction * (input[upper] ?? 0);
  }
  return output;
};

const pcm16leFromFloat32 = (input: Float32Array): Uint8Array => {
  const output = new Uint8Array(input.length * 2);
  const view = new DataView(output.buffer);
  for (let i = 0; i < input.length; i++) {
    const sample = Math.max(-1, Math.min(1, input[i] ?? 0));
    view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }
  return output;
};

const renderTokens = (tokens: SonioxToken[]): string =>
  tokens
    .filter((token) => token.text && token.text !== "<fin>")
    .map((token) => token.text)
    .join("");

const describeProtocolError = (message: SonioxRealtimeResponse): string => {
  const identity = [message.error_type, message.error_code].filter((value) => value !== undefined).join("/");
  const request = message.request_id ? ` (request ${message.request_id})` : "";
  const details = message.error_message || "Soniox realtime transcription failed";
  return `${identity ? `Soniox ${identity}: ` : "Soniox: "}${details}${request}`;
};

export async function startSonioxRealtimeWsSession(args: {
  getEphemeralToken: () => Promise<RealtimeResponse>;
  modelId: string;
  config?: SonioxRealtimeConfig;
  events?: RealtimeTranscriptionEvents;
}): Promise<SonioxRealtimeWsSession> {
  const { events } = args;
  const token = await args.getEphemeralToken();
  const startConfig = buildSonioxRealtimeConfig({
    apiKey: token.value,
    modelId: args.modelId,
    config: args.config,
  });

  const ws = new WebSocket(SONIOX_WEBSOCKET_URL);
  ws.binaryType = "arraybuffer";

  let stream: MediaStream | undefined;
  let audioContext: AudioContext | undefined;
  let source: MediaStreamAudioSourceNode | undefined;
  let processor: ScriptProcessorNode | undefined;
  let committedTokens: SonioxToken[] = [];
  let stopping = false;
  let stopped = false;
  let receivedFinished = false;
  let resolveFinished: (() => void) | undefined;
  const finished = new Promise<void>((resolve) => {
    resolveFinished = resolve;
  });

  const opened = new Promise<void>((resolve, reject) => {
    const onOpen = () => {
      cleanup();
      try {
        ws.send(JSON.stringify(startConfig));
        events?.onSessionCreated?.({
          provider: "soniox",
          model: startConfig.model,
          audio_format: startConfig.audio_format,
          sample_rate: startConfig.sample_rate,
          num_channels: startConfig.num_channels,
        });
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    const onClose = () => {
      cleanup();
      reject(new Error("Soniox realtime websocket closed before opening"));
    };
    const cleanup = () => {
      ws.removeEventListener("open", onOpen);
      ws.removeEventListener("close", onClose);
    };
    ws.addEventListener("open", onOpen);
    ws.addEventListener("close", onClose);
  });

  ws.addEventListener("message", (event) => {
    try {
      if (typeof event.data !== "string") return;
      const message = JSON.parse(event.data) as SonioxRealtimeResponse;
      events?.onEvent?.(message);

      if (message.error_code !== undefined || message.error_type) {
        events?.onError?.(describeProtocolError(message), message);
        return;
      }

      const responseTokens = Array.isArray(message.tokens) ? message.tokens : [];
      const finalTokens = responseTokens.filter(
        (item) => item.is_final && item.text && item.text !== "<fin>"
      );
      const nonFinalTokens = responseTokens.filter(
        (item) => !item.is_final && item.text && item.text !== "<fin>"
      );

      // Soniox emits final tokens exactly once, while non-final tokens are a
      // complete evolving snapshot that must be replaced on each response.
      if (finalTokens.length) committedTokens = committedTokens.concat(finalTokens);
      if (finalTokens.length || nonFinalTokens.length) {
        events?.onTranscriptText?.(renderTokens([...committedTokens, ...nonFinalTokens]));
      }

      if (message.finished) {
        receivedFinished = true;
        resolveFinished?.();
      }
    } catch (error) {
      events?.onError?.(`Failed to parse Soniox realtime event: ${describeError(error)}`, error);
    }
  });

  ws.addEventListener("error", (error) => {
    if (!stopping) events?.onError?.("Soniox realtime websocket error", error);
  });

  ws.addEventListener("close", (event) => {
    resolveFinished?.();
    if (!stopping && !receivedFinished) {
      events?.onError?.(
        `Soniox realtime websocket closed unexpectedly${event.code ? ` (${event.code})` : ""}${event.reason ? `: ${event.reason}` : ""}`,
        event
      );
    }
  });

  await opened;

  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (!stream.getAudioTracks()[0]) throw new Error("No microphone audio track available");

    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    source = audioContext.createMediaStreamSource(stream);
    processor = audioContext.createScriptProcessor(4096, 1, 1);
    source.connect(processor);
    processor.connect(audioContext.destination);

    processor.onaudioprocess = (event) => {
      try {
        if (ws.readyState !== WebSocket.OPEN || stopping) return;
        const input = event.inputBuffer.getChannelData(0);
        const resampled = resampleLinear(input, audioContext!.sampleRate, DEFAULT_SAMPLE_RATE);
        const pcm16 = pcm16leFromFloat32(resampled);
        const bytes = new Uint8Array(new ArrayBuffer(pcm16.byteLength));
        bytes.set(pcm16);
        ws.send(bytes);
      } catch (error) {
        events?.onError?.(`Failed processing Soniox audio chunk: ${describeError(error)}`, error);
      }
    };
  } catch (error) {
    try {
      ws.close();
    } catch {
      // ignore cleanup failure
    }
    throw error;
  }

  const stop = async () => {
    if (stopped) return;
    stopped = true;
    stopping = true;

    try {
      if (processor) processor.onaudioprocess = null;
      processor?.disconnect();
    } catch {
      // ignore cleanup failure
    }
    try {
      source?.disconnect();
    } catch {
      // ignore cleanup failure
    }
    try {
      stream?.getTracks().forEach((track) => track.stop());
    } catch {
      // ignore cleanup failure
    }
    try {
      await audioContext?.close();
    } catch {
      // ignore cleanup failure
    }

    try {
      if (ws.readyState === WebSocket.OPEN) {
        // An empty binary frame signals end-of-audio and requests final tokens.
        ws.send(new ArrayBuffer(0));
        await Promise.race([
          finished,
          new Promise<void>((resolve) => window.setTimeout(resolve, FINISHED_WAIT_MS)),
        ]);
      }
    } catch {
      // Continue closing even if graceful finalization fails.
    }

    try {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) ws.close(1000);
    } catch {
      // ignore cleanup failure
    }
  };

  return { ws, stream, stop };
}
