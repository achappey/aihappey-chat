import type { RealtimeResponse } from "aihappey-ai";
import type { RealtimeTranscriptionEvents } from "./startRealtimeWebrtcSession";

const RATE = 16000;
const VERSION = "2026-08-14";

export type CartesiaSttConfig = {
  keyterm?: string[];
  language?: string;
  min_volume?: number;
  max_silence_duration_secs?: number;
  turn_start_threshold?: number;
  turn_eager_end_threshold?: number;
  turn_end_threshold?: number;
  turn_end_timeout_ms?: number;
};

export function buildCartesiaSttUrl(modelId: string, token: string, config: CartesiaSttConfig = {}) {
  const parts = modelId.split("/");
  const [mode, model] = parts.slice(-2);
  if (!token || !["auto", "manual"].includes(mode) || !["ink-2", "ink-preview", "ink-whisper"].includes(model)
    || (mode === "auto" && model === "ink-whisper")) throw new Error("Invalid Cartesia realtime STT model or token");
  const url = new URL(`wss://api.cartesia.ai/stt/${mode === "auto" ? "turns/" : ""}websocket`);
  Object.entries({ model, encoding: "pcm_s16le", sample_rate: RATE, cartesia_version: VERSION, access_token: token }).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  const options = mode === "auto"
    ? ["turn_start_threshold", "turn_eager_end_threshold", "turn_end_threshold", "turn_end_timeout_ms"]
    : model === "ink-whisper" ? ["language", "min_volume", "max_silence_duration_secs"] : [];
  for (const key of options) {
    const value = (config as Record<string, unknown>)[key];
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }
  if (model !== "ink-whisper") for (const term of (config.keyterm ?? []).slice(0, 100)) {
    if (term.trim()) url.searchParams.append("keyterm", term.trim());
  }
  return url;
}

export async function startCartesiaRealtimeWsSession(args: {
  getEphemeralToken: () => Promise<RealtimeResponse>;
  modelId: string;
  config?: CartesiaSttConfig;
  events?: RealtimeTranscriptionEvents;
}) {
  const token = await args.getEphemeralToken();
  const mode = args.modelId.split("/").at(-2);
  const ws = new WebSocket(buildCartesiaSttUrl(args.modelId, token.value, args.config).toString());
  const events = args.events;
  let stream: MediaStream | undefined;
  let context: AudioContext | undefined;
  let source: MediaStreamAudioSourceNode | undefined;
  let processor: ScriptProcessorNode | undefined;
  let stopping = false;
  let closed = false;
  let committed = "";
  let partial = "";
  let resolveFlush: (() => void) | undefined;
  const flushed = new Promise<void>((resolve) => { resolveFlush = resolve; });

  ws.addEventListener("message", (event) => {
    try {
      const message = JSON.parse(String(event.data));
      events?.onEvent?.(message);
      if (message.type === "error") {
        events?.onError?.(`Cartesia STT: ${message.message ?? message.title ?? "Unknown error"} (${message.error_code ?? message.status_code ?? "unknown"})`);
        resolveFlush?.();
      } else if (mode === "auto") {
        if (message.type === "turn.update" || message.type === "turn.eager_end") {
          partial = String(message.transcript ?? "");
          events?.onTranscriptText?.([committed, partial].filter(Boolean).join(" "));
        } else if (message.type === "turn.end") {
          committed = [committed, String(message.transcript ?? "")].filter(Boolean).join(" ");
          partial = "";
          events?.onTranscriptText?.(committed);
        }
      } else if (message.type === "transcript") {
        if (message.is_final) {
          committed += String(message.text ?? ""); // Manual responses are deltas; preserve whitespace verbatim.
          partial = "";
        } else partial = String(message.text ?? "");
        events?.onTranscriptText?.(committed + partial);
      } else if (message.type === "flush_done" || message.type === "done") resolveFlush?.();
    } catch (error) { events?.onError?.("Failed to parse Cartesia STT event", error); }
  });
  ws.addEventListener("error", (error) => { if (!stopping) events?.onError?.("Cartesia STT WebSocket error", error); });
  ws.addEventListener("close", (event) => {
    resolveFlush?.();
    if (!stopping) events?.onError?.(`Cartesia STT connection closed (${event.code})`);
  });

  try {
    await new Promise<void>((resolve, reject) => {
      ws.addEventListener("open", () => resolve(), { once: true });
      ws.addEventListener("close", () => reject(new Error("Cartesia STT connection closed before opening")), { once: true });
      ws.addEventListener("error", () => reject(new Error("Cartesia STT connection failed")), { once: true });
    });
    events?.onSessionCreated?.({ provider: "cartesia", mode, model: args.modelId, sample_rate: RATE });
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    context = new AudioContext();
    source = context.createMediaStreamSource(stream);
    processor = context.createScriptProcessor(2048, 1, 1);
    const silent = context.createGain();
    silent.gain.value = 0;
    source.connect(processor);
    processor.connect(silent);
    silent.connect(context.destination);
    processor.onaudioprocess = (event) => {
      if (stopping || ws.readyState !== WebSocket.OPEN || ws.bufferedAmount > 1_000_000) return;
      const input = event.inputBuffer.getChannelData(0);
      const length = Math.max(1, Math.round(input.length * RATE / context!.sampleRate));
      const output = new ArrayBuffer(length * 2);
      const view = new DataView(output);
      for (let i = 0; i < length; i++) {
        const position = i * context!.sampleRate / RATE;
        const low = Math.floor(position);
        const sample = Math.max(-1, Math.min(1, (input[low] ?? 0) + ((input[Math.min(low + 1, input.length - 1)] ?? 0) - (input[low] ?? 0)) * (position - low)));
        view.setInt16(i * 2, sample < 0 ? sample * 32768 : sample * 32767, true);
      }
      ws.send(output);
    };
  } catch (error) {
    processor?.disconnect();
    source?.disconnect();
    stream?.getTracks().forEach((track) => track.stop());
    await context?.close();
    ws.close();
    throw error;
  }

  return {
    ws, stream, stop: async () => {
      if (closed) return;
      closed = true;
      stopping = true;
      if (processor) processor.onaudioprocess = null;
      processor?.disconnect();
      source?.disconnect();
      stream?.getTracks().forEach((track) => track.stop());
      await context?.close();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(mode === "auto" ? JSON.stringify({ type: "close" }) : "finalize");
        await Promise.race([flushed, new Promise<void>((resolve) => setTimeout(resolve, 1500))]);
        if (mode === "manual" && ws.readyState === WebSocket.OPEN) ws.send("close");
      }
      ws.close(1000);
    }
  };
}
