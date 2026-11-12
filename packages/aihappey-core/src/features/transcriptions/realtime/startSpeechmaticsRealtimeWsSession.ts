import type { RealtimeResponse } from "aihappey-ai";
import type { RealtimeTranscriptionEvents } from "./startRealtimeWebrtcSession";
import { speechmaticsConnection, speechmaticsStart, type SpeechmaticsRealtimeConfig } from "./speechmaticsRealtime";

export async function startSpeechmaticsRealtimeWsSession(args: {
  getEphemeralToken: () => Promise<RealtimeResponse>; modelId: string; config?: SpeechmaticsRealtimeConfig;
  microphoneStream?: MediaStream; signal?: AbortSignal; events?: RealtimeTranscriptionEvents;
}) {
  const setup = speechmaticsStart(args.modelId, args.config), url = new URL(speechmaticsConnection(args.modelId, args.config));
  args.signal?.throwIfAborted();
  const token = await args.getEphemeralToken();
  args.signal?.throwIfAborted();
  if (typeof token.value !== "string" || !token.value || token.value.length > 64000 || /\s/.test(token.value)
    || !Number.isFinite(token.expires_at) || token.expires_at * 1000 <= Date.now()) throw new Error("Speechmatics returned an invalid or expired temporary key.");
  url.searchParams.set("jwt", token.value);
  const ws = new WebSocket(url.toString());
  let stream: MediaStream | undefined, context: AudioContext | undefined;
  let source: MediaStreamAudioSourceNode | undefined, processor: ScriptProcessorNode | undefined, silent: GainNode | undefined;
  let stopping = false, finished = false, configured = false, failure: Error | undefined;
  let sent = 0, acknowledged = 0, stopPromise: Promise<void> | undefined;
  let resolveReady!: () => void, rejectReady!: (error: Error) => void;
  let resolveDone!: () => void, rejectDone!: (error: Error) => void;
  const ready = new Promise<void>((resolve, reject) => { resolveReady = resolve; rejectReady = reject; });
  const done = new Promise<void>((resolve, reject) => { resolveDone = resolve; rejectDone = reject; });
  void done.catch(() => {});
  const releaseAudio = async () => {
    if (processor) processor.onaudioprocess = null;
    processor?.disconnect(); source?.disconnect(); silent?.disconnect();
    processor = undefined; source = undefined; silent = undefined;
    const captured = stream, capturedContext = context; stream = undefined; context = undefined;
    if (!args.microphoneStream) captured?.getTracks().forEach(track => track.stop());
    if (capturedContext && capturedContext.state !== "closed") await capturedContext.close();
  };
  const fail = (message: string) => {
    if (failure || finished) return;
    failure = new Error(message); clearTimeout(timeout);
    args.signal?.removeEventListener("abort", abort);
    rejectReady(failure); rejectDone(failure);
    void releaseAudio().catch(() => {});
    ws.close(); args.events?.onError?.(message);
  };
  const abort = () => fail("Speechmatics transcription was cancelled.");
  const timeout = setTimeout(() => fail("Speechmatics recognition setup timed out."), 40000);
  args.signal?.addEventListener("abort", abort, { once: true });
  ws.addEventListener("open", () => {
    if (!failure && !stopping) ws.send(JSON.stringify(setup));
  });
  ws.addEventListener("error", () => fail("Speechmatics connection failed. Check credentials and account access."));
  ws.addEventListener("close", () => { if (!finished) fail("Speechmatics disconnected before confirming the final transcript."); });
  ws.addEventListener("message", event => {
    if (failure || finished) return;
    try {
      const message = JSON.parse(String(event.data));
      if (message.message === "Error") { fail("Speechmatics reported a transcription error. Check the model, language, settings, and account quota."); return; }
      if (message.message === "RecognitionStarted" && !configured) {
        configured = true; clearTimeout(timeout);
        args.events?.onEvent?.(message);
        // Persist only explicit non-secret session details, never the connection URL/JWT.
        args.events?.onSessionCreated?.({ provider: "speechmatics", model: args.modelId, id: message.id, region: args.config?.region ?? "global" });
        resolveReady();
      } else if (message.message === "AudioAdded") {
        if (!Number.isInteger(message.seq_no) || message.seq_no < acknowledged || message.seq_no > sent) throw new Error("Invalid audio acknowledgement.");
        acknowledged = message.seq_no;
      } else if (message.message === "EndOfTranscript") {
        if (!stopping) { fail("Speechmatics ended the transcription unexpectedly."); return; }
        args.events?.onEvent?.(message); finished = true; resolveDone();
      } else if (configured) args.events?.onEvent?.(message);
    } catch { fail("Speechmatics returned an invalid transcription event."); }
  });
  try {
    await ready; args.signal?.throwIfAborted();
    stream = args.microphoneStream ?? await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1 } });
    args.signal?.throwIfAborted();
    if (failure) throw failure;
    context = new AudioContext({ sampleRate: 16000 });
    source = context.createMediaStreamSource(stream); processor = context.createScriptProcessor(2048, 1, 1);
    silent = context.createGain(); silent.gain.value = 0;
    source.connect(processor); processor.connect(silent); silent.connect(context.destination);
    let position = 0, carry = new Float32Array(0);
    processor.onaudioprocess = event => {
      if (stopping || failure || ws.readyState !== WebSocket.OPEN) return;
      if (ws.bufferedAmount > 1_000_000 || sent - acknowledged >= 1000) { fail("Speechmatics cannot keep up with microphone audio. Transcription stopped to avoid losing speech."); return; }
      const samples = event.inputBuffer.getChannelData(0), input = new Float32Array(carry.length + samples.length);
      input.set(carry); input.set(samples, carry.length);
      const bytes: number[] = [], ratio = context!.sampleRate / 16000;
      while (position + 1 < input.length) {
        const low = Math.floor(position), fraction = position - low;
        const sample = Math.max(-1, Math.min(1, input[low] + (input[low + 1] - input[low]) * fraction));
        const value = Math.round(sample < 0 ? sample * 32768 : sample * 32767);
        bytes.push(value & 255, (value >> 8) & 255); position += ratio;
      }
      const consumed = Math.min(Math.floor(position), input.length); carry = input.slice(consumed); position -= consumed;
      if (bytes.length) {
        try { ws.send(new Uint8Array(bytes)); sent++; }
        catch { fail("Speechmatics microphone upload failed."); }
      }
    };
    await context.resume();
  } catch (error) {
    clearTimeout(timeout); args.signal?.removeEventListener("abort", abort);
    await releaseAudio(); ws.close(); throw error;
  }
  return { stop: () => stopPromise ??= (async () => {
    stopping = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await releaseAudio();
      if (failure) throw failure;
      if (ws.readyState !== WebSocket.OPEN) throw new Error("Speechmatics connection is closed.");
      // WebSocket sends are ordered: all preceding binary frames drain before EOS.
      ws.send(JSON.stringify({ message: "EndOfStream", last_seq_no: sent }));
      await Promise.race([done, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("Speechmatics did not confirm the final transcript.")), 15000); })]);
    } catch (error) { fail("Speechmatics could not confirm the final transcript."); throw failure ?? error; }
    finally { clearTimeout(timer); clearTimeout(timeout); args.signal?.removeEventListener("abort", abort); ws.close(); }
  })() };
}
