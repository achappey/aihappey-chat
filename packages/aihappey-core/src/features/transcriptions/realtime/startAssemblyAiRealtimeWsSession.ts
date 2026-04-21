import type { RealtimeResponse } from "aihappey-ai";
import type { RealtimeTranscriptionEvents } from "./startRealtimeWebrtcSession";

export type AssemblyAiRealtimeWsSession = {
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

const toNumber = (v: any): number | undefined => {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : undefined;
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

type AssemblyAiBeginMsg = {
  type?: "Begin";
  id?: string;
  expires_at?: string | number;
};

type AssemblyAiTurnMsg = {
  type?: "Turn";
  turn_order?: number;
  turn_is_formatted?: boolean;
  end_of_turn?: boolean;
  transcript?: string;
  utterance?: string;
  end_of_turn_confidence?: number;
  words?: Array<{
    start?: number | string;
    end?: number | string;
    text?: string;
    word?: string;
    confidence?: number;
  }>;
  language_code?: string;
  language_confidence?: number;
};

type AssemblyAiTerminationMsg = {
  type?: "Termination";
  audio_duration_seconds?: number;
  session_duration_seconds?: number;
};

const buildAssemblyAiUrl = (args: { token: string; modelId?: string; config: any }): { url: string; sampleRate: number } => {
  // EU region per product decision.
  const url = new URL("wss://streaming.eu.assemblyai.com/v3/ws");
  const cfg = args.config ?? {};

  // Required by AssemblyAI.
  const sampleRate = toNumber(cfg.sample_rate ?? cfg.sampleRate) ?? 16000;
  url.searchParams.set("sample_rate", String(sampleRate));

  // Auth via query token (backend returns ephemeral streaming token).
  url.searchParams.set("token", args.token);

  // Audio format: this client streams PCM16LE.
  const encoding = String(cfg.encoding ?? "pcm_s16le");
  if (encoding !== "pcm_s16le") {
    // We can only generate pcm_s16le in this browser implementation.
    // Still set it to avoid server-side mismatch if user configured something else.
    url.searchParams.set("encoding", "pcm_s16le");
  } else {
    url.searchParams.set("encoding", encoding);
  }

  // Model selection.
  // UI passes a model suffix like `universal-streaming-english` or `universal-streaming-multilingual`.
  if (args.modelId) {
    url.searchParams.set("speech_model", String(args.modelId));
  }

  // VAD threshold appears as "Required" in docs (while also having a default).
  // Set a safe default so sessions don't fail when config is empty.
  const vadThreshold = cfg.vad_threshold ?? cfg.vadThreshold;
  url.searchParams.set("vad_threshold", String(vadThreshold ?? 0.4));

  // Optional params from config (flat map). We keep this permissive.
  for (const [k, v] of Object.entries(cfg)) {
    if (v === undefined || v === null || v === "") continue;
    if (k === "sample_rate" || k === "sampleRate" || k === "token") continue;
    if (k === "encoding" || k === "speech_model" || k === "speechModel" || k === "vad_threshold" || k === "vadThreshold") continue;

    if (Array.isArray(v)) {
      // keyterms_prompt is documented as list of strings; represent as comma-separated for query params.
      // If AssemblyAI expects repeated params, the backend should encode a full URL instead.
      url.searchParams.set(k, v.map(String).join(","));
    } else {
      url.searchParams.set(k, String(v));
    }
  }

  return { url: url.toString(), sampleRate };
};

export async function startAssemblyAiRealtimeWsSession(args: {
  getEphemeralToken: () => Promise<RealtimeResponse>;
  /** Model suffix mapped to AssemblyAI `speech_model` query param. */
  modelId: string;
  /** Optional UI-configured query params. */
  config: any;
  events?: RealtimeTranscriptionEvents;
}): Promise<AssemblyAiRealtimeWsSession> {
  const { events } = args;
  const token = await args.getEphemeralToken();
  const connect = buildAssemblyAiUrl({ token: token.value, modelId: args.modelId, config: args.config });

  const ws = new WebSocket(connect.url);
  ws.binaryType = "arraybuffer";

  // Create media/audio nodes lazily (only after socket is confirmed open).
  // This avoids grabbing the microphone when the request is immediately rejected.
  let stream: MediaStream | undefined;
  let audioCtx: AudioContext | undefined;
  let source: MediaStreamAudioSourceNode | undefined;
  let processor: ScriptProcessorNode | undefined;

  // Track committed vs preview transcript.
  let committedText = "";

  let fatalBeforeOpen: string | null = null;

  ws.addEventListener("message", (ev) => {
    try {
      if (typeof ev.data !== "string") {
        // AssemblyAI messages are JSON strings; ignore unexpected binary.
        return;
      }
      const msg = JSON.parse(ev.data) as AssemblyAiBeginMsg | AssemblyAiTurnMsg | AssemblyAiTerminationMsg | any;
      events?.onEvent?.(msg);

      if (msg?.type === "Begin") {
        events?.onSessionCreated?.(msg);
        return;
      }

      if (msg?.type === "Turn") {
        const transcript = typeof msg?.transcript === "string" ? msg.transcript.trim() : "";
        if (!transcript) return;

        const isFinal = !!msg?.end_of_turn;
        if (isFinal) {
          committedText = (committedText + (committedText ? " " : "") + transcript).trim();
          events?.onTranscriptText?.(committedText);
        } else {
          // Preview: committed + current transcript snapshot.
          events?.onTranscriptText?.((committedText + (committedText && transcript ? " " : "") + transcript).trim());
        }
        return;
      }

      if (msg?.type === "Termination") {
        // no-op; surfaced via onEvent already.
        return;
      }

      // Best-effort: surface protocol errors if present.
      if (typeof msg?.error === "string" && msg.error) {
        const errMsg = msg.error;
        if (ws.readyState !== WebSocket.OPEN) fatalBeforeOpen = errMsg;
        events?.onError?.(errMsg);
      }
    } catch (e) {
      events?.onError?.(`Failed to parse AssemblyAI realtime event: ${describeError(e)}`, e);
    }
  });

  ws.addEventListener("error", (e) => {
    events?.onError?.("AssemblyAI realtime websocket error", e);
  });

  const opened = new Promise<void>((resolve, reject) => {
    const onOpen = () => {
      cleanup();
      resolve();
    };
    const onClose = () => {
      cleanup();
      reject(new Error(fatalBeforeOpen ?? "AssemblyAI realtime websocket closed before opening"));
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
      const resampled = resampleLinear(input, audioCtx.sampleRate, connect.sampleRate);
      const pcm16 = pcm16leFromFloat32(resampled);
      // AssemblyAI expects binary audio data chunks (bytes).
      const bytes = new Uint8Array(new ArrayBuffer(pcm16.byteLength));
      bytes.set(pcm16);
      ws.send(bytes);
    } catch (e) {
      events?.onError?.(`Failed processing AssemblyAI audio chunk: ${describeError(e)}`, e);
    }
  };

  const stop = async () => {
    try {
      // Graceful termination per docs.
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "Terminate" }));
        }
      } catch {
        // ignore
      }

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
        ws.close(1000);
      } catch {
        // ignore
      }

      try {
        stream?.getTracks().forEach((t) => t.stop());
      } catch {
        // ignore
      }
    } catch (e) {
      events?.onError?.(`Failed stopping AssemblyAI realtime session: ${describeError(e)}`, e);
    }
  };

  return { ws, stream: stream!, stop };
}

