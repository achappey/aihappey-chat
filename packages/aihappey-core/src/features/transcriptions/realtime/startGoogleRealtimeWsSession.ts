import type { RealtimeResponse } from "aihappey-ai";
import type { RealtimeTranscriptionEvents } from "./startRealtimeWebrtcSession";

const GOOGLE_LIVE_WEBSOCKET_URL =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent";
const GOOGLE_SAMPLE_RATE = 16000;
const FINAL_TRANSCRIPT_WAIT_MS = 1500;

export type GoogleRealtimeTranscriptionMode = "VERBATIM" | "SMART";

export type GoogleRealtimeConfig = {
  uses?: number;
  expireTime?: string;
  liveConnectConstraints?: {
    model?: string;
    config?: {
      responseModalities?: string[];
      inputAudioTranscription?: {
        languageCodes?: string[];
        customVocabulary?: string[];
        mode?: GoogleRealtimeTranscriptionMode;
      };
    };
  };
};

export type GoogleRealtimeWsSession = {
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

const normalizeModel = (modelId: string): string => {
  const withoutProvider = modelId.includes("/") ? modelId.slice(modelId.indexOf("/") + 1) : modelId;
  return withoutProvider.startsWith("models/") ? withoutProvider : `models/${withoutProvider}`;
};

const resampleLinear = (input: Float32Array, fromRate: number, toRate: number): Float32Array => {
  if (fromRate === toRate) return input;
  const ratio = fromRate / toRate;
  const output = new Float32Array(Math.max(1, Math.round(input.length / ratio)));
  for (let index = 0; index < output.length; index++) {
    const position = index * ratio;
    const lower = Math.floor(position);
    const upper = Math.min(lower + 1, input.length - 1);
    const fraction = position - lower;
    output[index] = (1 - fraction) * (input[lower] ?? 0) + fraction * (input[upper] ?? 0);
  }
  return output;
};

const pcm16leFromFloat32 = (input: Float32Array): Uint8Array => {
  const output = new Uint8Array(input.length * 2);
  const view = new DataView(output.buffer);
  for (let index = 0; index < input.length; index++) {
    const sample = Math.max(-1, Math.min(1, input[index] ?? 0));
    view.setInt16(index * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }
  return output;
};

const toBase64 = (bytes: Uint8Array): string => {
  let binary = "";
  for (let index = 0; index < bytes.length; index++) binary += String.fromCharCode(bytes[index]);
  return window.btoa(binary);
};

const getLiveConfig = (config?: GoogleRealtimeConfig) => {
  const constrained = config?.liveConnectConstraints?.config;
  const inputAudioTranscription = constrained?.inputAudioTranscription ?? {};
  return {
    responseModalities: ["TEXT"],
    inputAudioTranscription: {
      languageCodes: Array.isArray(inputAudioTranscription.languageCodes)
        ? inputAudioTranscription.languageCodes
        : [],
      ...(Array.isArray(inputAudioTranscription.customVocabulary) && inputAudioTranscription.customVocabulary.length
        ? { customVocabulary: inputAudioTranscription.customVocabulary }
        : {}),
      ...(inputAudioTranscription.mode ? { mode: inputAudioTranscription.mode } : {}),
    },
  };
};

export async function startGoogleRealtimeWsSession(args: {
  getEphemeralToken: () => Promise<RealtimeResponse>;
  modelId: string;
  config?: GoogleRealtimeConfig;
  events?: RealtimeTranscriptionEvents;
}): Promise<GoogleRealtimeWsSession> {
  const { events } = args;
  const token = await args.getEphemeralToken();
  const model = normalizeModel(args.modelId);
  const liveConfig = getLiveConfig(args.config);
  const url = `${GOOGLE_LIVE_WEBSOCKET_URL}?access_token=${encodeURIComponent(token.value)}`;
  const ws = new WebSocket(url);

  let stream: MediaStream | undefined;
  let audioContext: AudioContext | undefined;
  let source: MediaStreamAudioSourceNode | undefined;
  let processor: ScriptProcessorNode | undefined;
  let stopping = false;
  let stopped = false;
  let setupComplete = false;
  let finalTranscriptVersion = 0;
  const committedTranscripts: string[] = [];
  let resolveSetup: (() => void) | undefined;
  let rejectSetup: ((error: Error) => void) | undefined;
  const setupReady = new Promise<void>((resolve, reject) => {
    resolveSetup = resolve;
    rejectSetup = reject;
  });

  const opened = new Promise<void>((resolve, reject) => {
    const onOpen = () => {
      cleanup();
      try {
        ws.send(JSON.stringify({
          setup: {
            model,
            generationConfig: { responseModalities: liveConfig.responseModalities },
            inputAudioTranscription: liveConfig.inputAudioTranscription,
          },
        }));
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    const onClose = () => {
      cleanup();
      reject(new Error("Google Live websocket closed before opening"));
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
      const message = JSON.parse(event.data);
      events?.onEvent?.(message);

      if (message?.error) {
        const details = message.error?.message ?? JSON.stringify(message.error);
        const error = new Error(`Google Live: ${details}`);
        rejectSetup?.(error);
        events?.onError?.(error.message, message.error);
        return;
      }

      if (message?.setupComplete) {
        setupComplete = true;
        resolveSetup?.();
        events?.onSessionCreated?.({
          provider: "google",
          model,
          sampleRate: GOOGLE_SAMPLE_RATE,
          config: liveConfig,
          tokenExpiresAt: token.expires_at,
        });
      }

      const content = message?.serverContent;
      const interim = content?.interimInputTranscription?.text;
      const final = content?.inputTranscription?.text;
      if (typeof interim === "string") {
        events?.onTranscriptText?.([...committedTranscripts, interim].filter(Boolean).join(" ").trim());
      }
      if (typeof final === "string") {
        finalTranscriptVersion += 1;
        if (final.trim()) committedTranscripts.push(final.trim());
        events?.onTranscriptText?.(committedTranscripts.join(" ").trim());
      }
    } catch (error) {
      events?.onError?.(`Failed to parse Google Live event: ${describeError(error)}`, error);
    }
  });

  ws.addEventListener("error", (error) => {
    if (!stopping) events?.onError?.("Google Live websocket error", error);
  });

  ws.addEventListener("close", (event) => {
    if (!setupComplete) rejectSetup?.(new Error("Google Live websocket closed before setup completed"));
    if (!stopping) {
      events?.onError?.(
        `Google Live websocket closed unexpectedly${event.code ? ` (${event.code})` : ""}${event.reason ? `: ${event.reason}` : ""}`,
        event,
      );
    }
  });

  await opened;
  await setupReady;

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
        const samples = event.inputBuffer.getChannelData(0);
        const pcm16 = pcm16leFromFloat32(resampleLinear(samples, audioContext!.sampleRate, GOOGLE_SAMPLE_RATE));
        ws.send(JSON.stringify({
          realtimeInput: {
            audio: {
              data: toBase64(pcm16),
              mimeType: `audio/pcm;rate=${GOOGLE_SAMPLE_RATE}`,
            },
          },
        }));
      } catch (error) {
        events?.onError?.(`Failed processing Google Live audio chunk: ${describeError(error)}`, error);
      }
    };
  } catch (error) {
    try {
      ws.close();
    } catch {
      // Ignore cleanup failure while propagating the microphone error.
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
      source?.disconnect();
      stream?.getTracks().forEach((track) => track.stop());
      await audioContext?.close();
    } catch {
      // Continue graceful protocol shutdown after media cleanup failures.
    }

    try {
      if (ws.readyState === WebSocket.OPEN) {
        const versionBeforeEnd = finalTranscriptVersion;
        ws.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } }));
        await new Promise<void>((resolve) => {
          const startedAt = Date.now();
          const poll = () => {
            if (finalTranscriptVersion > versionBeforeEnd || Date.now() - startedAt >= FINAL_TRANSCRIPT_WAIT_MS) {
              resolve();
              return;
            }
            window.setTimeout(poll, 50);
          };
          poll();
        });
      }
    } catch {
      // Continue closing even if stream finalization fails.
    }

    try {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) ws.close(1000);
    } catch {
      // Ignore final cleanup failure.
    }
  };

  return { ws, stream, stop };
}
