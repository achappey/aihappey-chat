import type { RealtimeResponse } from "aihappey-ai";
import type { RealtimeConversationEvents, RealtimeConversationWsSession } from "./startRealtimeConversationWebrtc";

const describeError = (e: unknown) => {
  if (!e) return "unknown";
  if (e instanceof Error) return e.message || e.name;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
};

const toNumber = (value: any): number | undefined => {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
};

const getAudioFormatRate = (session: any, direction: "input" | "output", fallback = 24000) => {
  const format = session?.audio?.[direction]?.format;
  if (format?.type === "audio/pcma" || format?.type === "audio/pcmu") return 8000;
  return toNumber(format?.rate) ?? fallback;
};

const base64FromUint8Array = (bytes: Uint8Array): string => {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
};

const uint8ArrayFromBase64 = (value: string): Uint8Array => {
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
};

const pcm16leFromFloat32 = (input: Float32Array): Uint8Array => {
  const out = new Uint8Array(input.length * 2);
  const view = new DataView(out.buffer);
  for (let i = 0; i < input.length; i++) {
    let s = input[i] ?? 0;
    if (s > 1) s = 1;
    else if (s < -1) s = -1;
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return out;
};

const float32FromPcm16leBase64 = (base64: string): Float32Array => {
  const bytes = uint8ArrayFromBase64(base64);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const samples = Math.floor(bytes.byteLength / 2);
  const out = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    out[i] = view.getInt16(i * 2, true) / 32768;
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

const normalizeXAiClientSecretProtocol = (value: string) => {
  const raw = String(value ?? "").trim();
  return raw.startsWith("xai-client-secret.") ? raw : `xai-client-secret.${raw}`;
};

export async function startXAiRealtimeConversationWsSession(args: {
  model: string;
  session: any;
  getEphemeralToken: () => Promise<RealtimeResponse>;
  events?: RealtimeConversationEvents;
}): Promise<RealtimeConversationWsSession> {
  const { events } = args;
  const token = await args.getEphemeralToken();
  const ephemeralKey = token.value;

  if (!ephemeralKey) {
    throw new Error("xAI realtime token response did not contain a value.");
  }

  const inputSampleRate = getAudioFormatRate(args.session, "input", 24000);
  const outputSampleRate = getAudioFormatRate(args.session, "output", inputSampleRate);
  const url = new URL("wss://api.x.ai/v1/realtime");
  url.searchParams.set("model", args.model);

  const ws = new WebSocket(url.toString(), [normalizeXAiClientSecretProtocol(ephemeralKey)]);
  let stream: MediaStream | undefined;
  let inputCtx: AudioContext | undefined;
  let outputCtx: AudioContext | undefined;
  let source: MediaStreamAudioSourceNode | undefined;
  let processor: ScriptProcessorNode | undefined;
  let silentGain: GainNode | undefined;
  let playbackTime = 0;

  const safeSend = (event: any) => {
    if (ws.readyState !== WebSocket.OPEN) {
      throw new Error(`xAI realtime WebSocket is not open (${ws.readyState}).`);
    }
    ws.send(JSON.stringify(event));
  };

  const playOutputAudioDelta = (delta: string) => {
    try {
      if (!delta) return;
      outputCtx = outputCtx ?? new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: outputSampleRate });
      void outputCtx.resume?.();
      const samples = float32FromPcm16leBase64(delta);
      if (samples.length === 0) return;
      const buffer = outputCtx.createBuffer(1, samples.length, outputSampleRate);
      buffer.getChannelData(0).set(samples);
      const node = outputCtx.createBufferSource();
      node.buffer = buffer;
      node.connect(outputCtx.destination);
      const startAt = Math.max(outputCtx.currentTime, playbackTime || outputCtx.currentTime);
      node.start(startAt);
      playbackTime = startAt + buffer.duration;
    } catch (e) {
      events?.onError?.(`Failed playing xAI realtime audio delta: ${describeError(e)}`, e);
    }
  };

  ws.addEventListener("message", (e) => {
    try {
      const event = JSON.parse(String(e.data));
      if (event?.type === "response.output_audio.delta" && typeof event?.delta === "string") {
        playOutputAudioDelta(event.delta);
      }
      events?.onEvent?.(event);
    } catch (err) {
      events?.onError?.("Failed to parse xAI realtime event", err);
    }
  });

  ws.addEventListener("error", (e) => events?.onError?.("xAI realtime WebSocket error", e));

  const session: RealtimeConversationWsSession = {
    kind: "ws",
    ws,
    get stream() {
      return stream!;
    },
    send: safeSend,
    setMicrophoneEnabled: (enabled: boolean) => {
      stream?.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
    },
    stop: async () => {
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
          silentGain?.disconnect();
        } catch {
          // ignore
        }
        try {
          if (processor) processor.onaudioprocess = null;
        } catch {
          // ignore
        }
        try {
          await inputCtx?.close();
        } catch {
          // ignore
        }
        try {
          await outputCtx?.close();
        } catch {
          // ignore
        }
        try {
          ws.close();
        } catch {
          // ignore
        }
        try {
          stream?.getTracks().forEach((track) => track.stop());
        } catch {
          // ignore
        }
      } catch (e) {
        events?.onError?.(`Failed stopping xAI realtime session: ${describeError(e)}`, e);
      }
    },
  };

  return new Promise<RealtimeConversationWsSession>((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      ws.removeEventListener("open", onOpen);
      ws.removeEventListener("close", onCloseBeforeOpen);
    };
    const onCloseBeforeOpen = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("xAI realtime WebSocket closed before opening."));
    };
    const onOpen = async () => {
      if (settled) return;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const track = stream.getAudioTracks()[0];
        if (!track) throw new Error("No microphone audio track available");

        inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        source = inputCtx.createMediaStreamSource(stream);
        processor = inputCtx.createScriptProcessor(4096, 1, 1);
        silentGain = inputCtx.createGain();
        silentGain.gain.value = 0;
        source.connect(processor);
        processor.connect(silentGain);
        silentGain.connect(inputCtx.destination);

        processor.onaudioprocess = (event) => {
          try {
            if (ws.readyState !== WebSocket.OPEN) return;
            const input = event.inputBuffer.getChannelData(0);
            const resampled = resampleLinear(input, inputCtx!.sampleRate, inputSampleRate);
            const audio = base64FromUint8Array(pcm16leFromFloat32(resampled));
            safeSend({
              type: "input_audio_buffer.append",
              audio,
            });
          } catch (e) {
            events?.onError?.(`Failed sending xAI realtime audio chunk: ${describeError(e)}`, e);
          }
        };

        settled = true;
        cleanup();
        resolve(session);
        setTimeout(() => events?.onOpen?.(), 0);
      } catch (e) {
        settled = true;
        cleanup();
        reject(e);
      }
    };

    ws.addEventListener("open", onOpen);
    ws.addEventListener("close", onCloseBeforeOpen);
  });
}

