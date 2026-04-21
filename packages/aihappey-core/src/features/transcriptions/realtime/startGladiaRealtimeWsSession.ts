import type { RealtimeResponse } from "aihappey-ai";
import type { RealtimeTranscriptionEvents } from "./startRealtimeWebrtcSession";

export type GladiaRealtimeWsSession = {
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

type GladiaTranscriptMsg = {
  type?: "transcript";
  session_id?: string;
  created_at?: string;
  data?: {
    id?: string;
    is_final?: boolean;
    utterance?: {
      text?: string;
      start?: number;
      end?: number;
      language?: string;
      channel?: number;
    };
  };
};

export async function startGladiaRealtimeWsSession(args: {
  /** Backend returns a connectable WSS URL (includes token query param). */
  getEphemeralToken: () => Promise<RealtimeResponse>;
  /** Optional UI-config (not required to connect). */
  config: any;
  events?: RealtimeTranscriptionEvents;
}): Promise<GladiaRealtimeWsSession> {
  const { events } = args;

  const token = await args.getEphemeralToken();
  const url = String((token as any)?.value ?? "");
  if (!url || !/^wss:\/\//i.test(url)) {
    throw new Error("Gladia realtime expected backend to return a full wss:// URL in RealtimeResponse.value");
  }

  const ws = new WebSocket(url);
  ws.binaryType = "arraybuffer";

  // Create media/audio nodes lazily (only after socket is confirmed open).
  // This avoids grabbing the microphone when the request is immediately rejected.
  let stream: MediaStream | undefined;
  let audioCtx: AudioContext | undefined;
  let source: MediaStreamAudioSourceNode | undefined;
  let processor: ScriptProcessorNode | undefined;

  // Audio defaults per Gladia docs quickstart example.
  const targetSampleRate = toNumber(args.config?.sample_rate ?? args.config?.sampleRate) ?? 16000;

  // Track committed text separately; partial transcripts are preview.
  let committedText = "";

  // Track fatal errors received before OPEN so we can reject `opened` with a useful message.
  let fatalBeforeOpen: string | null = null;

  ws.addEventListener("message", (ev) => {
    try {
      if (typeof ev.data !== "string") {
        // Gladia messages are JSON strings; ignore unexpected binary.
        return;
      }
      const msg = JSON.parse(ev.data) as GladiaTranscriptMsg | any;
      events?.onEvent?.(msg);

      if (msg?.type === "transcript") {
        const text = typeof msg?.data?.utterance?.text === "string" ? msg.data.utterance.text.trim() : "";
        if (!text) return;

        const isFinal = !!msg?.data?.is_final;
        if (isFinal) {
          committedText = (committedText + (committedText ? " " : "") + text).trim();
          events?.onTranscriptText?.(committedText);
        } else {
          // Preview: committed + current partial.
          events?.onTranscriptText?.((committedText + (committedText && text ? " " : "") + text).trim());
        }
        return;
      }

      // Best-effort: surface protocol errors if present.
      if (typeof msg?.error === "string" && msg.error) {
        const errMsg = msg.error;
        if (ws.readyState !== WebSocket.OPEN) fatalBeforeOpen = errMsg;
        events?.onError?.(errMsg);
      }
    } catch (e) {
      events?.onError?.(`Failed to parse Gladia realtime event: ${describeError(e)}`, e);
    }
  });

  ws.addEventListener("error", (e) => {
    events?.onError?.("Gladia realtime websocket error", e);
  });

  const opened = new Promise<void>((resolve, reject) => {
    const onOpen = () => {
      cleanup();
      resolve();
    };
    const onClose = () => {
      cleanup();
      reject(new Error(fatalBeforeOpen ?? "Gladia realtime websocket closed before opening"));
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
      const pcm16 = pcm16leFromFloat32(resampled);
      // Gladia accepts binary audio chunks over the socket (wav/pcm).
      const bytes = new Uint8Array(new ArrayBuffer(pcm16.byteLength));
      bytes.set(pcm16);
      ws.send(bytes);
    } catch (e) {
      events?.onError?.(`Failed processing Gladia audio chunk: ${describeError(e)}`, e);
    }
  };

  const stop = async () => {
    try {
      // Ask Gladia to stop recording so it can flush remaining audio.
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "stop_recording" }));
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
      events?.onError?.(`Failed stopping Gladia realtime session: ${describeError(e)}`, e);
    }
  };

  return { ws, stream: stream!, stop };
}

