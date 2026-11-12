import type { RealtimeResponse } from "aihappey-ai";
import type { RealtimeTranscriptionEvents } from "./startRealtimeWebrtcSession";
import { deepLConnection, deepLTargetLanguage, deepLTranscriptEvent } from "./deepLRealtime";

const RATE = 16000, CHUNK_BYTES = 3200; // 100 ms, mono PCM16 little-endian.

export async function startDeepLRealtimeWsSession(args: {
  getEphemeralToken: () => Promise<RealtimeResponse>; modelId: string;
  microphoneStream?: MediaStream; signal?: AbortSignal; events?: RealtimeTranscriptionEvents;
}) {
  const target = deepLTargetLanguage(args.modelId);
  args.signal?.throwIfAborted();
  const token = await args.getEphemeralToken();
  args.signal?.throwIfAborted();
  const ws = new WebSocket(deepLConnection(token));
  let stream: MediaStream | undefined, context: AudioContext | undefined;
  let source: MediaStreamAudioSourceNode | undefined, processor: ScriptProcessorNode | undefined, silent: GainNode | undefined;
  let stopping = false, finished = false, failed = false, opened = false;
  let lastSend = 0, lastDuration = 0;
  let pending: number[] = [];
  let timer: ReturnType<typeof setInterval> | undefined, stopPromise: Promise<void> | undefined;
  let resolveReady!: () => void, rejectReady!: (error: Error) => void;
  let resolveDone!: () => void, rejectDone!: (error: Error) => void;
  const ready = new Promise<void>((resolve, reject) => { resolveReady = resolve; rejectReady = reject; });
  const done = new Promise<void>((resolve, reject) => { resolveDone = resolve; rejectDone = reject; });
  void ready.catch(() => {}); void done.catch(() => {});
  const close = () => { try { ws.close(); } catch { /* A cancelled connecting socket may already be closed. */ } };
  const releaseAudio = async () => {
    clearInterval(timer);
    if (processor) processor.onaudioprocess = null;
    processor?.disconnect(); source?.disconnect(); silent?.disconnect();
    processor = undefined; source = undefined; silent = undefined;
    const captured = stream, capturedContext = context; stream = undefined; context = undefined;
    if (!args.microphoneStream) captured?.getTracks().forEach(track => track.stop());
    if (capturedContext && capturedContext.state !== "closed") await capturedContext.close();
  };
  const fail = (message: string) => {
    if (failed || finished) return;
    failed = true; clearTimeout(timeout); args.signal?.removeEventListener("abort", abort);
    const error = new Error(message); rejectReady(error); rejectDone(error);
    args.events?.onError?.(message); void releaseAudio().catch(() => {}); close();
  };
  const abort = () => fail("DeepL transcription was cancelled.");
  const timeout = setTimeout(() => fail("DeepL transcription connection timed out."), 30000);
  args.signal?.addEventListener("abort", abort, { once: true });
  ws.addEventListener("open", () => {
    if (failed) { close(); return; }
    opened = true; clearTimeout(timeout);
    // No token, URL, or provider session identifier enters persistence/debug events.
    args.events?.onSessionCreated?.({ provider: "deepl", model: args.modelId, ...(target ? { language: target } : {}) });
    resolveReady();
  });
  ws.addEventListener("error", () => fail("DeepL transcription connection failed."));
  ws.addEventListener("close", () => { if (!finished) fail("DeepL disconnected before confirming the final transcription."); });
  ws.addEventListener("message", event => {
    if (failed || finished) return;
    try {
      if (typeof event.data !== "string" || event.data.length > 4_000_000) throw new Error("Invalid message.");
      const message = JSON.parse(event.data);
      if (message.error) { fail("DeepL reported a transcription error. Check your Voice access, quota, and settings."); return; }
      const update = deepLTranscriptEvent(message, target);
      if (update) args.events?.onEvent?.(update);
      if (message.end_of_stream) {
        if (!stopping) throw new Error("Unexpected stream completion.");
        finished = true; resolveDone();
      }
    } catch { fail("DeepL returned an invalid transcription event."); }
  });
  const sendChunk = () => {
    if (!pending.length || failed || ws.readyState !== WebSocket.OPEN) return;
    if (ws.bufferedAmount > 64_000) throw new Error("DeepL cannot keep up with microphone audio.");
    const bytes = pending.splice(0, CHUNK_BYTES);
    ws.send(JSON.stringify({ source_media_chunk: { data: btoa(String.fromCharCode(...bytes)) } }));
    lastSend = Date.now(); lastDuration = bytes.length / 32;
  };
  try {
    await ready; args.signal?.throwIfAborted();
    stream = args.microphoneStream ?? await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1 } });
    args.signal?.throwIfAborted();
    if (failed) throw new Error("DeepL transcription connection failed.");
    context = new AudioContext({ sampleRate: RATE });
    source = context.createMediaStreamSource(stream); processor = context.createScriptProcessor(2048, 1, 1);
    silent = context.createGain(); silent.gain.value = 0;
    source.connect(processor); processor.connect(silent); silent.connect(context.destination);
    let position = 0, carry = new Float32Array(0);
    processor.onaudioprocess = event => {
      if (stopping || failed || !opened) return;
      const samples = event.inputBuffer.getChannelData(0);
      const input = new Float32Array(carry.length + samples.length); input.set(carry); input.set(samples, carry.length);
      const ratio = context!.sampleRate / RATE;
      while (position + 1 < input.length) {
        const low = Math.floor(position), fraction = position - low;
        const sample = Math.max(-1, Math.min(1, input[low] + (input[low + 1] - input[low]) * fraction));
        const value = Math.round(sample < 0 ? sample * 32768 : sample * 32767);
        pending.push(value & 255, (value >> 8) & 255); position += ratio;
      }
      const consumed = Math.min(Math.floor(position), input.length); carry = input.slice(consumed); position -= consumed;
      if (pending.length > 64_000) fail("DeepL cannot keep up with microphone audio. Transcription stopped to avoid losing speech.");
    };
    timer = setInterval(() => {
      if (stopping || pending.length < CHUNK_BYTES || Date.now() - lastSend < lastDuration / 2) return;
      try { sendChunk(); } catch { fail("Microphone audio could not be sent to DeepL."); }
    }, 100);
    await context.resume();
    if (failed) throw new Error("DeepL transcription connection failed.");
  } catch (error) {
    clearTimeout(timeout); args.signal?.removeEventListener("abort", abort);
    await releaseAudio(); close(); throw error;
  }
  return { stop: () => stopPromise ??= (async () => {
    stopping = true;
    try {
      await releaseAudio();
      if (failed) throw new Error("DeepL transcription failed before finalization.");
      while (pending.length) {
        await new Promise(resolve => setTimeout(resolve, Math.max(0, lastDuration / 2 - (Date.now() - lastSend))));
        if (failed || ws.readyState !== WebSocket.OPEN) throw new Error("DeepL transcription connection is closed.");
        sendChunk();
      }
      ws.send(JSON.stringify({ end_of_source_media: {} }));
      let drain: ReturnType<typeof setTimeout> | undefined;
      try { await Promise.race([done, new Promise<never>((_, reject) => { drain = setTimeout(() => reject(new Error("DeepL did not confirm the final transcription.")), 15000); })]); }
      finally { clearTimeout(drain); }
    } catch (error) { fail("DeepL could not confirm the final transcription."); throw error; }
    finally { clearTimeout(timeout); args.signal?.removeEventListener("abort", abort); pending = []; close(); }
  })() };
}
