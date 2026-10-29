import type { RealtimeResponse } from "aihappey-ai";
import type { RealtimeTranscriptionEvents } from "./startRealtimeWebrtcSession";

const RATE = 16000;
export type MistralRealtimeConfig = { language?: string; context_bias?: string[]; target_streaming_delay_ms?: number; ttl_seconds?: number };

export function buildMistralSessionUpdate(config: MistralRealtimeConfig = {}) {
  const delay = config.target_streaming_delay_ms ?? 480;
  if (!Number.isInteger(delay) || !((delay >= 80 && delay <= 1200) || delay === 2400))
    throw new Error("Mistral streaming delay must be an integer from 80 to 1200, or 2400 ms.");
  if (config.language && !/^[a-z]{2}$/.test(config.language)) throw new Error("Mistral language must be a two-letter ISO 639-1 code.");
  if (config.context_bias !== undefined && (!Array.isArray(config.context_bias) || config.context_bias.some(term => typeof term !== "string")))
    throw new Error("Mistral vocabulary hints must be a list of strings.");
  return { type: "session.update", session: {
    audio_format: { encoding: "pcm_s16le", sample_rate: RATE }, target_streaming_delay_ms: delay,
    ...(config.language ? { language: config.language } : {}),
    ...(config.context_bias?.length ? { context_bias: config.context_bias } : {}),
  } };
}

export function mistralRealtimeUrl(modelId: string) {
  const model = modelId.replace(/^mistral\//, "");
  if (!["voxtral-mini-transcribe-realtime-2602", "voxtral-mini-transcribe-realtime-3", "voxtral-mini-transcribe-realtime-3-0"].includes(model))
    throw new Error("Select a supported Mistral realtime transcription model.");
  return `wss://api.mistral.ai/v1/audio/transcriptions/realtime?model=${encodeURIComponent(model)}`;
}

export async function startMistralRealtimeWsSession(args: {
  getEphemeralToken: () => Promise<RealtimeResponse>; modelId: string; config?: MistralRealtimeConfig;
  microphoneStream?: MediaStream; signal?: AbortSignal; events?: RealtimeTranscriptionEvents;
}) {
  const update = buildMistralSessionUpdate(args.config);
  const url = mistralRealtimeUrl(args.modelId);
  args.signal?.throwIfAborted();
  const token = await args.getEphemeralToken();
  args.signal?.throwIfAborted();
  if (!/^rt_[!#$%&'*+.^_`|~A-Za-z0-9-]+$/.test(token.value) || !Number.isFinite(token.expires_at) || token.expires_at * 1000 <= Date.now())
    throw new Error("Mistral returned an invalid or expired ephemeral token.");
  const ws = new WebSocket(url, ["realtime", token.value]);
  let stream: MediaStream | undefined, context: AudioContext | undefined;
  let source: MediaStreamAudioSourceNode | undefined, processor: ScriptProcessorNode | undefined, silent: GainNode | undefined;
  let stopping = false, finished = false, configured = false, created = false, failed = false, text = "";
  let stopPromise: Promise<void> | undefined;
  let resolveReady!: () => void, rejectReady!: (error: Error) => void;
  let resolveDone!: () => void, rejectDone!: (error: Error) => void;
  const ready = new Promise<void>((resolve, reject) => { resolveReady = resolve; rejectReady = reject; });
  const done = new Promise<void>((resolve, reject) => { resolveDone = resolve; rejectDone = reject; });
  void done.catch(() => {});
  const releaseAudio = async () => {
    if (processor) processor.onaudioprocess = null;
    processor?.disconnect(); source?.disconnect(); silent?.disconnect();
    if (!args.microphoneStream) stream?.getTracks().forEach(track => track.stop());
    if (context && context.state !== "closed") await context.close();
  };
  const fail = (message: string) => {
    if (failed || finished) return;
    failed = true;
    clearTimeout(timeout); args.signal?.removeEventListener("abort", abort);
    const error = new Error(message);
    rejectReady(error); rejectDone(error);
    args.events?.onError?.(message);
    void releaseAudio().catch(() => {});
    ws.close();
  };
  const abort = () => fail("Mistral transcription was cancelled.");
  args.signal?.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(() => fail("Mistral transcription setup timed out."), 30000);
  ws.addEventListener("error", () => fail("Mistral transcription connection failed."));
  ws.addEventListener("close", () => { if (!finished) fail("Mistral disconnected before confirming the final transcription."); });
  ws.addEventListener("message", event => {
    try {
      const message = JSON.parse(String(event.data));
      if (failed || finished) return;
      if (message.type === "error") { fail("Mistral reported a transcription error. Check the selected model and settings."); return; }
      if (message.type === "session.created" && !created) {
        created = true; ws.send(JSON.stringify(update));
      } else if (message.type === "session.updated" && created && !configured) {
        const session = message.session;
        if (session?.audio_format?.encoding !== "pcm_s16le" || session?.audio_format?.sample_rate !== RATE
          || session?.target_streaming_delay_ms !== update.session.target_streaming_delay_ms)
          throw new Error("Mistral did not apply the requested audio settings.");
        configured = true; clearTimeout(timeout);
        args.events?.onSessionCreated?.({ provider: "mistral", model: args.modelId, session });
        resolveReady();
      } else if (message.type === "transcription.text.delta" && configured) {
        if (typeof message.text !== "string" || text.length + message.text.length > 2_000_000) throw new Error("Invalid transcript.");
        text += message.text;
        args.events?.onTranscriptText?.(text);
        args.events?.onEvent?.(message);
      } else if (message.type === "transcription.done" && configured) {
        if (!stopping || typeof message.text !== "string" || message.text.length > 2_000_000) throw new Error("Invalid final transcript.");
        text = message.text;
        args.events?.onTranscriptText?.(text);
        args.events?.onEvent?.(message);
        finished = true; resolveDone();
      }
    } catch { fail("Mistral returned an invalid transcription event or incompatible session settings."); }
  });
  try {
    await ready;
    args.signal?.throwIfAborted();
    stream = args.microphoneStream ?? await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1 } });
    args.signal?.throwIfAborted();
    if (failed) throw new Error("Mistral transcription connection failed.");
    context = new AudioContext({ sampleRate: RATE });
    source = context.createMediaStreamSource(stream);
    processor = context.createScriptProcessor(2048, 1, 1);
    silent = context.createGain(); silent.gain.value = 0;
    source.connect(processor); processor.connect(silent); silent.connect(context.destination);
    // Preserve resampling position across audio callbacks instead of dropping fractional samples.
    let position = 0;
    let carry = new Float32Array(0);
    processor.onaudioprocess = event => {
      if (stopping || failed || ws.readyState !== WebSocket.OPEN) return;
      if (ws.bufferedAmount > 1_000_000) { fail("Mistral cannot keep up with microphone audio. Transcription stopped to avoid losing speech."); return; }
      const samples = event.inputBuffer.getChannelData(0);
      const input = new Float32Array(carry.length + samples.length); input.set(carry); input.set(samples, carry.length);
      const output: number[] = [], ratio = context!.sampleRate / RATE;
      while (position + 1 < input.length) {
        const low = Math.floor(position), fraction = position - low;
        const sample = Math.max(-1, Math.min(1, input[low] + (input[low + 1] - input[low]) * fraction));
        const value = Math.round(sample < 0 ? sample * 32768 : sample * 32767);
        output.push(value & 255, (value >> 8) & 255); position += ratio;
      }
      const consumed = Math.min(Math.floor(position), input.length);
      carry = input.slice(consumed); position -= consumed;
      if (output.length) ws.send(JSON.stringify({ type: "input_audio.append", audio: btoa(String.fromCharCode(...output)) }));
    };
    await context.resume();
  } catch (error) {
    clearTimeout(timeout); args.signal?.removeEventListener("abort", abort);
    await releaseAudio(); ws.close(); throw error;
  }
  return { stop: () => stopPromise ??= (async () => {
    stopping = true;
    try {
      await releaseAudio();
      if (!failed && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "input_audio.end" }));
        let timer: ReturnType<typeof setTimeout> | undefined;
        try { await Promise.race([done, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("Mistral did not confirm the final transcription.")), 10000); })]); }
        finally { clearTimeout(timer); }
      } else if (!finished && !failed) throw new Error("Mistral transcription connection is closed.");
    } catch { fail("Mistral could not confirm the final transcription."); }
    finally { clearTimeout(timeout); args.signal?.removeEventListener("abort", abort); ws.close(); }
  })() };
}
