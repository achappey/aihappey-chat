import type { RealtimeResponse } from "aihappey-ai";
import type { RealtimeTranscriptionEvents } from "./startRealtimeWebrtcSession";

export type ElevenLabsRealtimeWsSession = {
  ws: WebSocket;
  stream: MediaStream;
  stop: () => Promise<void>;
};

const describeError = (e: unknown) => {
  if (!e) return "unknown";
  if (e instanceof Error) return e.message || e.name;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
};

const base64FromUint8Array = (bytes: Uint8Array): string => {
  // Chunk to avoid call stack limits on large arrays.
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
};

const pcm16leFromFloat32 = (input: Float32Array): Uint8Array => {
  const out = new Uint8Array(input.length * 2);
  const view = new DataView(out.buffer);
  for (let i = 0; i < input.length; i++) {
    let s = input[i] ?? 0;
    // Clamp
    if (s > 1) s = 1;
    else if (s < -1) s = -1;
    // Convert
    const v = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(i * 2, v, true);
  }
  return out;
};

const toNumber = (v: any): number | undefined => {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : undefined;
};

const toBool = (v: any): boolean | undefined => {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    if (v.toLowerCase() === "true") return true;
    if (v.toLowerCase() === "false") return false;
  }
  return undefined;
};

const pickAudioFormat = (config: any): string => {
  // ElevenLabs defaults to pcm_16000; we avoid hardcoding by only using config if provided.
  const fmt = config?.audio_format ?? config?.audioFormat;
  return typeof fmt === "string" && fmt.length ? fmt : "pcm_16000";
};

const pickSampleRate = (config: any, audioFormat: string): number => {
  const fromConfig = toNumber(config?.sample_rate ?? config?.sampleRate);
  if (fromConfig) return fromConfig;
  // Derive from audio_format when possible.
  const m = /_(\d+)$/.exec(audioFormat);
  const fromFmt = m ? Number(m[1]) : NaN;
  return Number.isFinite(fromFmt) ? fromFmt : 16000;
};

const resampleLinear = (input: Float32Array, fromRate: number, toRate: number): Float32Array => {
  if (fromRate === toRate) return input;
  const ratio = fromRate / toRate;
  const outLength = Math.max(1, Math.round(input.length / ratio));
  const out = new Float32Array(outLength);
  for (let i = 0; i < outLength; i++) {
    const pos = i * ratio;
    const i0 = Math.floor(pos);
    const i1 = Math.min(i0 + 1, input.length - 1);
    const frac = pos - i0;
    out[i] = (1 - frac) * (input[i0] ?? 0) + frac * (input[i1] ?? 0);
  }
  return out;
};

const buildElevenLabsUrl = (args: { token: string; modelId: string; config: any }): string => {
  const url = new URL("wss://api.elevenlabs.io/v1/speech-to-text/realtime");

  // Required per docs.
  url.searchParams.set("model_id", args.modelId);
  // Client-side auth
  url.searchParams.set("token", args.token);

  // Optional params are taken from config (flat map). No hardcoded values beyond protocol defaults.
  const cfg = args.config ?? {};
  const optional: Array<[string, any]> = [
    ["include_timestamps", cfg.include_timestamps ?? cfg.includeTimestamps],
    ["include_language_detection", cfg.include_language_detection ?? cfg.includeLanguageDetection],
    ["audio_format", cfg.audio_format ?? cfg.audioFormat],
    ["language_code", cfg.language_code ?? cfg.languageCode],
    ["commit_strategy", cfg.commit_strategy ?? cfg.commitStrategy],
    ["vad_silence_threshold_secs", cfg.vad_silence_threshold_secs ?? cfg.vadSilenceThresholdSecs],
    ["vad_threshold", cfg.vad_threshold ?? cfg.vadThreshold],
    ["min_speech_duration_ms", cfg.min_speech_duration_ms ?? cfg.minSpeechDurationMs],
    ["min_silence_duration_ms", cfg.min_silence_duration_ms ?? cfg.minSilenceDurationMs],
    ["enable_logging", cfg.enable_logging ?? cfg.enableLogging],
  ];
  for (const [k, v] of optional) {
    if (v === undefined || v === null || v === "") continue;
    url.searchParams.set(k, String(v));
  }

  return url.toString();
};

export async function startElevenLabsRealtimeWsSession(args: {
  getEphemeralToken: () => Promise<RealtimeResponse>;
  modelId: string;
  config: any;
  events?: RealtimeTranscriptionEvents;
}): Promise<ElevenLabsRealtimeWsSession> {
  const { events } = args;
  const token = await args.getEphemeralToken();

  const url = buildElevenLabsUrl({ token: token.value, modelId: args.modelId, config: args.config });
  const ws = new WebSocket(url);

  // Create media/audio nodes lazily (only after socket is confirmed open).
  // This avoids grabbing the microphone when the request is immediately rejected (e.g. invalid model_id).
  let stream: MediaStream | undefined;
  let audioCtx: AudioContext | undefined;
  let source: MediaStreamAudioSourceNode | undefined;
  let processor: ScriptProcessorNode | undefined;

  const audioFormat = pickAudioFormat(args.config);
  const targetSampleRate = pickSampleRate(args.config, audioFormat);

  const commitStrategy = String(args.config?.commit_strategy ?? args.config?.commitStrategy ?? "manual");
  const shouldAutoCommit = commitStrategy !== "vad";
  // ElevenLabs enforces a minimum uncommitted audio duration (~0.3s) before committing.
  // We'll only set `commit: true` after we have buffered enough audio since the last commit.
  const minCommitSeconds = toNumber(args.config?.min_commit_seconds ?? args.config?.minCommitSeconds) ?? 0.35;
  let uncommittedSamples = 0;

  // Track committed text separately; `partial_transcript` is just preview.
  let committedText = "";

  const safeSend = (obj: any) => {
    if (ws.readyState !== WebSocket.OPEN) return;
    try {
      ws.send(JSON.stringify(obj));
    } catch (e) {
      events?.onError?.(`Failed sending ElevenLabs realtime message: ${describeError(e)}`, e);
    }
  };

  // Track a fatal error received before OPEN so we can reject `opened` with a useful message.
  let fatalBeforeOpen: string | null = null;

  ws.addEventListener("message", (ev) => {
    try {
      const msg = JSON.parse(String(ev.data ?? ""));
      events?.onEvent?.(msg);

      const mt = msg?.message_type;
      if (mt === "session_started") {
        events?.onSessionCreated?.(msg);
      }

      // ElevenLabs sends certain protocol-level failures as normal WS messages (not a WS error event).
      // Example: { message_type: "invalid_request", error: "The model_id ... is invalid" }
      // Treat these as fatal so the caller can stop recording and surface the error.
      if (mt === "invalid_request") {
        const errMsg = typeof msg?.error === "string" ? msg.error : "Invalid ElevenLabs realtime request";
        if (ws.readyState !== WebSocket.OPEN) fatalBeforeOpen = errMsg;
        events?.onError?.(errMsg);
        return;
      }

      if (mt === "partial_transcript") {
        const t = typeof msg?.text === "string" ? msg.text : "";
        // Emit best-effort streaming text: committed + current partial.
        events?.onTranscriptText?.((committedText + (committedText && t ? " " : "") + t).trim());
      }

      if (mt === "committed_transcript" || mt === "committed_transcript_with_timestamps") {
        const t = typeof msg?.text === "string" ? msg.text : "";
        if (t) {
          committedText = (committedText + (committedText ? " " : "") + t).trim();
          events?.onTranscriptText?.(committedText);
        }
      }

      if (mt === "commit_throttled") {
        // Non-fatal; we'll adjust commit cadence on the client.
        // Still surface to logs via onEvent already.
        return;
      }

      if (mt === "error" || mt === "auth_error" || mt === "quota_exceeded" || mt === "rate_limited") {
        const errMsg = typeof msg?.error === "string" ? msg.error : "Unknown ElevenLabs realtime error";
        events?.onError?.(errMsg);
      }
    } catch (e) {
      events?.onError?.(`Failed to parse ElevenLabs realtime event: ${describeError(e)}`, e);
    }
  });

  ws.addEventListener("error", (e) => {
    events?.onError?.("ElevenLabs realtime websocket error", e);
  });

  // Stream audio after socket is open.
  const opened = new Promise<void>((resolve, reject) => {
    const onOpen = () => {
      cleanup();
      resolve();
    };
    const onClose = () => {
      cleanup();
      reject(new Error(fatalBeforeOpen ?? "ElevenLabs realtime websocket closed before opening"));
    };
    const cleanup = () => {
      ws.removeEventListener("open", onOpen);
      ws.removeEventListener("close", onClose);
    };
    ws.addEventListener("open", onOpen);
    ws.addEventListener("close", onClose);
  });

  await opened;

  // Only now do we acquire the microphone and start producing audio.
  stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const track = stream.getAudioTracks()[0];
  if (!track) throw new Error("No microphone audio track available");

  audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  source = audioCtx.createMediaStreamSource(stream);

  // ScriptProcessorNode is deprecated but widely supported and fine for MVP.
  const bufferSize = 4096;
  processor = audioCtx.createScriptProcessor(bufferSize, 1, 1);
  source.connect(processor);
  processor.connect(audioCtx.destination);

  processor.onaudioprocess = (event) => {
    try {
      if (ws.readyState !== WebSocket.OPEN) return;

      const input = event.inputBuffer.getChannelData(0);
      const resampled = resampleLinear(input, audioCtx.sampleRate, targetSampleRate);
      uncommittedSamples += resampled.length;

      const canCommit = shouldAutoCommit && uncommittedSamples >= targetSampleRate * minCommitSeconds;
      const commit = !!canCommit;
      const pcm16 = pcm16leFromFloat32(resampled);
      const audio_base_64 = base64FromUint8Array(pcm16);

      safeSend({
        message_type: "input_audio_chunk",
        audio_base_64,
        commit,
        sample_rate: targetSampleRate,
      });

      if (commit) {
        uncommittedSamples = 0;
      }
    } catch (e) {
      events?.onError?.(`Failed processing audio chunk: ${describeError(e)}`, e);
    }
  };

  const stop = async () => {
    try {
      try {
        processor?.disconnect();
      } catch {
        // ignore
      }
      try {
        source?.disconnect();
      } catch {
        // ignore
      }
      try {
        if (processor) processor.onaudioprocess = null;
      } catch {
        // ignore
      }

      try {
        await audioCtx?.close();
      } catch {
        // ignore
      }

      try {
        ws.close();
      } catch {
        // ignore
      }

      try {
        stream?.getTracks().forEach((t) => t.stop());
      } catch {
        // ignore
      }
    } catch (e) {
      events?.onError?.(`Failed stopping ElevenLabs realtime session: ${describeError(e)}`, e);
    }
  };

  // `stream` is guaranteed to be set after `await opened` succeeds.
  return { ws, stream: stream!, stop };
}

