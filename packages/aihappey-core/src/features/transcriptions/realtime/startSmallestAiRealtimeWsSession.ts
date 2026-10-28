import type { RealtimeResponse } from "aihappey-ai";
import type { RealtimeTranscriptionEvents } from "./startRealtimeWebrtcSession";
import { createSmallestAiCapture, smallestAiConnectionError, smallestAiProviderError, waitForSmallestAiSocket } from "../../realtime/smallestAiAudio";

const RATE = 16000;
export function buildSmallestAiSttUrl(modelId: string, token: string, config: Record<string, unknown> = {}) {
  const model = modelId.replace(/^smallestai\//i, "");
  if (!["pulse", "pulse-2"].includes(model)) throw new Error("Smallest AI live transcription supports Pulse and Pulse 2, not Pulse Pro.");
  if (!token.startsWith("wat_")) throw new Error("Smallest AI transcription requires a short-lived Waves access token.");
  const language = String(config.language ?? "en");
  if (model === "pulse-2" && language !== "en") throw new Error("Smallest AI Pulse 2 supports English only.");
  const url = new URL("wss://api.smallest.ai/waves/v1/stt/live");
  Object.entries({ model, api_key: token, language, sample_rate: RATE, encoding: "linear16", word_timestamps: true }).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  const options = ["word_timestamps", "diarize", "vad_events", "vad", "endpointing", "format", "punctuate", "capitalize", "itn_normalize", "no_format_delay", "redact_pii", "redact_pci", "sentence_timestamps", "keywords", "emotion_detection", "gender_detection"];
  if (model === "pulse") options.push("eou_timeout_ms", "finalize_on_words", "max_words");
  for (const key of options) {
    const value = config[key];
    if (value !== undefined && value !== null && value !== "") {
      if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") throw new Error(`Invalid Smallest AI ${key} option.`);
      url.searchParams.set(key, String(value));
    }
  }
  return url;
}

export async function startSmallestAiRealtimeWsSession(args: {
  getEphemeralToken: () => Promise<RealtimeResponse>;
  microphoneStream?: MediaStream;
  signal?: AbortSignal;
  modelId: string;
  config?: Record<string, unknown>;
  events?: RealtimeTranscriptionEvents;
}) {
  args.signal?.throwIfAborted();
  // Validate the model before asking the server for a credential.
  buildSmallestAiSttUrl(args.modelId, "wat_validation", args.config);
  const token = await args.getEphemeralToken();
  args.signal?.throwIfAborted();
  const ws = new WebSocket(buildSmallestAiSttUrl(args.modelId, token.value, args.config).toString());
  let capture: Awaited<ReturnType<typeof createSmallestAiCapture>> | undefined;
  let stopping = false, failed = false, terminal = false;
  let stopPromise: Promise<void> | undefined;
  let keepalive: ReturnType<typeof setInterval> | undefined;
  let committed = "", counter = 0, lastEnd = 0;
  const started = Date.now();
  let resolveTerminal!: () => void;
  const drained = new Promise<void>(resolve => { resolveTerminal = resolve; });
  const report = (message: string) => {
    if (failed) return;
    failed = true; resolveTerminal();
    args.events?.onError?.(message);
    void stop();
  };
  const stop = () => stopPromise ??= (async () => {
    stopping = true;
    clearInterval(keepalive);
    args.signal?.removeEventListener("abort", abort);
    await capture?.stop();
    if (!failed && !terminal && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "close_stream" }));
      let timer: ReturnType<typeof setTimeout> | undefined;
      await Promise.race([drained, new Promise<void>(resolve => { timer = setTimeout(resolve, 1500); })]);
      clearTimeout(timer);
    }
    if (ws.readyState !== WebSocket.CLOSED) ws.close(1000);
  })();
  const abort = () => { failed = true; resolveTerminal(); void stop(); };
  args.signal?.addEventListener("abort", abort, { once: true });
  ws.addEventListener("message", event => {
    if (terminal || failed) return;
    try {
      const message = JSON.parse(String(event.data));
      if (message.type === "error") { report(smallestAiProviderError(message)); return; }
      if (message.type !== "transcription") { args.events?.onEvent?.(message); return; }
      const text = String(message.transcript ?? message.transcription ?? "");
      if (message.is_final === true) committed = [committed, text].filter(Boolean).join(" ");
      args.events?.onTranscriptText?.(message.is_final === true ? committed : [committed, text].filter(Boolean).join(" "));
      if (message.is_final === true && text.trim()) {
        const timings = (Array.isArray(message.words) ? message.words : []).filter((word: any) => Number.isFinite(word.start) && Number.isFinite(word.end));
        const start = timings.length ? Math.min(...timings.map((word: any) => word.start)) : lastEnd;
        const end = timings.length ? Math.max(...timings.map((word: any) => word.end)) : Math.max(lastEnd, (Date.now() - started) / 1000);
        lastEnd = end;
        args.events?.onEvent?.({ type: "smallestai.transcript.final", item_id: `smallestai-${++counter}`, text, start, end });
      }
      args.events?.onEvent?.(message);
      if (message.is_last === true) { terminal = true; resolveTerminal(); void stop(); }
    } catch { report("Invalid Smallest AI transcription event."); }
  });
  ws.addEventListener("error", () => { if (!stopping) report(smallestAiConnectionError); });
  ws.addEventListener("close", () => {
    resolveTerminal();
    if (!stopping && !terminal) report(smallestAiConnectionError);
  });
  try {
    await waitForSmallestAiSocket(ws, args.signal);
    args.signal?.throwIfAborted();
    if (failed || stopping) throw new Error("Smallest AI transcription ended during startup.");
    capture = await createSmallestAiCapture({ microphoneStream: args.microphoneStream, signal: args.signal, rate: RATE, onAudio: bytes => {
      if (stopping || ws.readyState !== WebSocket.OPEN) return;
      if (ws.bufferedAmount > 1_000_000) { report("Smallest AI transcription audio could not be sent fast enough."); return; }
      ws.send(bytes);
    } });
    if (failed || stopping || args.signal?.aborted) { await capture.stop(); throw new Error("Smallest AI transcription cancelled during startup."); }
    keepalive = setInterval(() => { if (!stopping && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "keepalive" })); }, 10000);
    args.events?.onSessionCreated?.({ provider: "smallestai", model: args.modelId, sample_rate: RATE });
    return { ws, stream: capture.stream, stop, commitAudio: () => {
      if (!stopping && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "finalize" }));
    } };
  } catch (error) { failed = true; await stop(); throw error; }
}
