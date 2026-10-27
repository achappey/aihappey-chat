import type { RealtimeResponse } from "aihappey-ai";
import type { RealtimeConversationEvents, RealtimeConversationWsSession } from "./startRealtimeConversationWebrtc";
import { parseGoogleLiveMessageData } from "./googleLiveConfig";

const GOOGLE_LIVE_CONSTRAINED_URL =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained";
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const SETUP_TIMEOUT_MS = 30_000;

const describeError = (error: unknown) => {
  if (error instanceof Error) return error.message || error.name;
  try { return JSON.stringify(error); } catch { return String(error ?? "unknown"); }
};

export const clampGoogleCameraFrameRate = (value: unknown) => {
  const parsed = Number(value);
  return Math.max(0.1, Math.min(1, Number.isFinite(parsed) ? parsed : 1));
};

const base64FromBytes = (bytes: Uint8Array) => {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
};

const bytesFromBase64 = (value: string) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return bytes;
};

export const resampleGooglePcm = (input: Float32Array, fromRate: number, toRate: number) => {
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

export const googlePcm16leFromFloat32 = (input: Float32Array) => {
  const output = new Uint8Array(input.length * 2);
  const view = new DataView(output.buffer);
  for (let index = 0; index < input.length; index++) {
    const sample = Math.max(-1, Math.min(1, input[index] ?? 0));
    view.setInt16(index * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }
  return output;
};

const float32FromPcm16leBase64 = (value: string) => {
  const bytes = bytesFromBase64(value);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const output = new Float32Array(Math.floor(bytes.byteLength / 2));
  for (let index = 0; index < output.length; index++) output[index] = view.getInt16(index * 2, true) / 32768;
  return output;
};

const dataUrlPayload = (value: string) => value.slice(value.indexOf(",") + 1);

export async function startGoogleRealtimeConversationWsSession(args: {
  setup: Record<string, any>;
  getEphemeralToken: () => Promise<RealtimeResponse>;
  cameraFrameRate?: number;
  jpegQuality?: number;
  events?: RealtimeConversationEvents;
}): Promise<RealtimeConversationWsSession> {
  const { events } = args;
  let currentWs: WebSocket;
  let microphoneStream: MediaStream | undefined;
  let cameraStream: MediaStream | undefined;
  let inputContext: AudioContext | undefined;
  let outputContext: AudioContext | undefined;
  let microphoneSource: MediaStreamAudioSourceNode | undefined;
  let processor: ScriptProcessorNode | undefined;
  let silentGain: GainNode | undefined;
  let video: HTMLVideoElement | undefined;
  let canvas: HTMLCanvasElement | undefined;
  let cameraTimer: number | undefined;
  let playbackTime = 0;
  let stopped = false;
  let reconnecting = false;
  let latestHandle: string | undefined;
  let inputTranscript = "";
  let outputTranscript = "";
  let responseId = crypto.randomUUID();
  const playbackNodes = new Set<AudioBufferSourceNode>();
  const intentionallyClosed = new WeakSet<WebSocket>();
  const token = await args.getEphemeralToken();
  if (!token?.value) throw new Error("Google Live token response did not contain a value.");

  // Server diagnostics can echo request URLs. Never send credentials (or the
  // credential-bearing WebSocket/Event objects) to the UI error callbacks.
  const sanitizeDiagnostic = (value: string) => {
    let result = value;
    for (const secret of [token.value, encodeURIComponent(token.value)]) {
      result = result.split(secret).join("[redacted]");
    }
    return result.replace(/\b(?:wss?|https?):\/\/[^\s"'<>]+/gi, (url) => url.replace(/[?#].*$/, "?[redacted]"));
  };
  const connectionError = (message: string, stage: string) => sanitizeDiagnostic(
    `Google Live ${message} (model '${args.setup.model}', API v1alpha, ephemeral-token connection; stage: ${stage}).`
  );
  const serverErrorDetails = (error: any) => {
    const code = [error?.status, error?.code].filter((value) => value !== undefined && value !== null).join(", ");
    return `${code ? `[${code}] ` : ""}${error?.message ?? describeError(error)}`;
  };

  const cancelPlayback = () => {
    for (const node of playbackNodes) {
      try { node.stop(); } catch { /* already stopped */ }
    }
    playbackNodes.clear();
    playbackTime = outputContext?.currentTime ?? 0;
  };

  const playAudio = (data: string) => {
    if (!data) return;
    outputContext ??= new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });
    void outputContext.resume?.();
    const samples = float32FromPcm16leBase64(data);
    if (!samples.length) return;
    const buffer = outputContext.createBuffer(1, samples.length, OUTPUT_SAMPLE_RATE);
    buffer.getChannelData(0).set(samples);
    const node = outputContext.createBufferSource();
    node.buffer = buffer;
    node.connect(outputContext.destination);
    node.addEventListener("ended", () => playbackNodes.delete(node));
    const startAt = Math.max(outputContext.currentTime, playbackTime);
    node.start(startAt);
    playbackTime = startAt + buffer.duration;
    playbackNodes.add(node);
  };

  const emitTurnComplete = (content: any) => {
    if (inputTranscript.trim()) {
      events?.onEvent?.({
        type: "conversation.item.input_audio_transcription.completed",
        item_id: `google-input-${responseId}`,
        transcript: inputTranscript.trim(),
      });
    }
    if (outputTranscript.trim()) {
      events?.onEvent?.({
        type: "response.done",
        response: {
          id: responseId,
          status: content?.interrupted ? "cancelled" : "completed",
          output: [{ type: "message", role: "assistant", content: [{ type: "audio", transcript: outputTranscript.trim() }] }],
          usage: content?.usageMetadata,
        },
      });
    }
    inputTranscript = "";
    outputTranscript = "";
    responseId = crypto.randomUUID();
  };

  const handleMessage = (message: any, ws: WebSocket) => {
    events?.onEvent?.({ type: "google.live.event", message });

    const update = message?.sessionResumptionUpdate;
    if (update?.resumable && update?.newHandle) latestHandle = update.newHandle;

    const content = message?.serverContent;
    if (content?.interrupted) {
      cancelPlayback();
      events?.onEvent?.({ type: "response.cancelled", response_id: responseId });
    }
    const inputDelta = content?.inputTranscription?.text ?? content?.interimInputTranscription?.text;
    if (typeof inputDelta === "string" && inputDelta) {
      inputTranscript += inputDelta;
      events?.onEvent?.({
        type: "conversation.item.input_audio_transcription.delta",
        item_id: `google-input-${responseId}`,
        delta: inputDelta,
      });
    }
    const outputDelta = content?.outputTranscription?.text;
    if (typeof outputDelta === "string" && outputDelta) {
      outputTranscript += outputDelta;
      events?.onEvent?.({ type: "response.output_audio_transcript.delta", response_id: responseId, delta: outputDelta });
    }
    for (const part of content?.modelTurn?.parts ?? []) {
      if (part?.inlineData?.data) playAudio(part.inlineData.data);
      if (typeof part?.text === "string" && !outputDelta) {
        outputTranscript += part.text;
        events?.onEvent?.({ type: "response.output_text.delta", response_id: responseId, delta: part.text });
      }
    }
    for (const call of message?.toolCall?.functionCalls ?? []) {
      events?.onEvent?.({
        type: "response.output_item.done",
        response_id: responseId,
        item: {
          type: "function_call",
          call_id: call.id,
          name: call.name,
          arguments: JSON.stringify(call.args ?? {}),
        },
      });
    }
    if (message?.usageMetadata) events?.onEvent?.({ type: "response.usage", usage: message.usageMetadata });
    if (content?.turnComplete || content?.generationComplete) emitTurnComplete({ ...content, usageMetadata: message?.usageMetadata });
    if (message?.goAway && ws === currentWs) void reconnect();
  };

  const connect = async (handle?: string) => {
    const url = `${GOOGLE_LIVE_CONSTRAINED_URL}?access_token=${encodeURIComponent(token.value)}`;
    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch (error) {
      throw new Error(connectionError(`could not create WebSocket: ${describeError(error)}`, "opening WebSocket"));
    }
    ws.binaryType = "arraybuffer";
    await new Promise<void>((resolve, reject) => {
      let ready = false;
      let settled = false;
      let closed = false;
      let serverErrorReported = false;
      let transportError = false;
      let stage = "opening WebSocket";
      // Blob decoding is asynchronous. Preserve frame order and let an error
      // frame finish decoding before a subsequent close can hide its details.
      let pendingMessages = Promise.resolve();
      const timeout = setTimeout(() => {
        fail(connectionError(`setup timed out after ${SETUP_TIMEOUT_MS / 1000}s${transportError ? " following a WebSocket transport error" : ""}`, stage));
      }, SETUP_TIMEOUT_MS);
      const cleanup = () => {
        clearTimeout(timeout);
        ws.removeEventListener("open", onOpen);
        ws.removeEventListener("message", onMessage);
        ws.removeEventListener("error", onError);
        ws.removeEventListener("close", onClose);
      };
      const fail = (reason: string) => {
        if (settled) return;
        settled = true;
        cleanup();
        intentionallyClosed.add(ws);
        try { ws.close(); } catch { /* best effort, including CONNECTING sockets */ }
        reject(new Error(reason));
      };
      const onOpen = () => {
        if (settled) return;
        try {
          const setup = {
            ...args.setup,
            ...(args.setup.sessionResumption !== undefined
              ? { sessionResumption: { ...(args.setup.sessionResumption ?? {}), ...(handle ? { handle } : {}) } }
              : {}),
          };
          stage = "sending setup";
          ws.send(JSON.stringify({ setup }));
          stage = "waiting for setupComplete";
        } catch (error) {
          fail(connectionError(`failed to send setup: ${describeError(error)}`, stage));
        }
      };
      const onMessage = (event: MessageEvent) => {
        pendingMessages = pendingMessages.then(async () => {
          if (settled && !ready) return;
          try {
            const message = await parseGoogleLiveMessageData(event.data);
            if (settled && !ready) return;
            if (message?.error) {
              const messageText = connectionError(`server error: ${serverErrorDetails(message.error)}`, stage);
              if (!ready) fail(messageText);
              else {
                serverErrorReported = true;
                events?.onError?.(messageText);
              }
              return;
            }
            if (message?.setupComplete && !ready && !closed) {
              ready = true;
              settled = true;
              stage = "connected";
              clearTimeout(timeout);
              resolve();
            }
            if (!closed) handleMessage(message, ws);
          } catch (error) {
            // SyntaxError messages can contain fragments of the raw frame.
            const detail = error instanceof SyntaxError ? "invalid JSON" : describeError(error);
            const messageText = connectionError(`failed to parse event: ${detail}`, stage);
            if (!ready) fail(messageText);
            else events?.onError?.(messageText);
          }
        });
      };
      const onError = () => {
        // Browsers expose no useful details on this event. The following close
        // carries the code/reason; the setup timeout bounds a missing close.
        transportError = true;
      };
      const onClose = (event: CloseEvent) => {
        closed = true;
        void pendingMessages.then(() => {
          const reason = event.reason ? `, reason: ${event.reason}` : ", no close reason supplied";
          const hint = event.code === 1006
            ? " The browser did not disclose a server reason; check network access and the token's validity/new-session expiry."
            : "";
          const messageText = connectionError(
            `WebSocket closed${ready ? "" : " before setup completed"} (code ${event.code}${reason}, clean: ${event.wasClean})${hint}`,
            stage,
          );
          if (!ready) fail(messageText);
          else {
            cleanup();
            if (stopped || intentionallyClosed.has(ws) || ws !== currentWs || serverErrorReported) return;
            if (latestHandle) void reconnect();
            else events?.onError?.(messageText);
          }
        });
      };
      ws.addEventListener("open", onOpen);
      ws.addEventListener("message", onMessage);
      ws.addEventListener("error", onError);
      ws.addEventListener("close", onClose);
    });
    return ws;
  };

  const reconnect = async () => {
    if (stopped || reconnecting || !latestHandle) return;
    reconnecting = true;
    try {
      const previous = currentWs;
      const replacement = await connect(latestHandle);
      currentWs = replacement;
      if (previous && previous !== replacement) {
        intentionallyClosed.add(previous);
        previous.close(1000, "Session resumed");
      }
      events?.onEvent?.({ type: "session.resumed", handle: latestHandle });
    } catch (error) {
      events?.onError?.(sanitizeDiagnostic(`Failed to resume Google Live session: ${describeError(error)}`));
    } finally {
      reconnecting = false;
    }
  };

  const stopMicrophone = async () => {
    if (processor) processor.onaudioprocess = null;
    try { processor?.disconnect(); } catch { /* ignore */ }
    try { microphoneSource?.disconnect(); } catch { /* ignore */ }
    try { silentGain?.disconnect(); } catch { /* ignore */ }
    microphoneStream?.getTracks().forEach((track) => track.stop());
    await inputContext?.close().catch(() => undefined);
  };

  currentWs = await connect();
  try {
    microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    inputContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    microphoneSource = inputContext.createMediaStreamSource(microphoneStream);
    processor = inputContext.createScriptProcessor(2048, 1, 1);
    silentGain = inputContext.createGain();
    silentGain.gain.value = 0;
    microphoneSource.connect(processor);
    processor.connect(silentGain);
    silentGain.connect(inputContext.destination);
    processor.onaudioprocess = (event) => {
      if (stopped || currentWs.readyState !== WebSocket.OPEN) return;
      const samples = resampleGooglePcm(event.inputBuffer.getChannelData(0), inputContext!.sampleRate, INPUT_SAMPLE_RATE);
      currentWs.send(JSON.stringify({
        realtimeInput: {
          audio: {
            data: base64FromBytes(googlePcm16leFromFloat32(samples)),
            mimeType: `audio/pcm;rate=${INPUT_SAMPLE_RATE}`,
          },
        },
      }));
    };
  } catch (error) {
    stopped = true;
    intentionallyClosed.add(currentWs);
    try { currentWs.close(); } catch { /* best effort */ }
    await stopMicrophone();
    cancelPlayback();
    await outputContext?.close().catch(() => undefined);
    throw new Error(sanitizeDiagnostic(`Google Live microphone startup failed: ${describeError(error)}`));
  }

  const stopCamera = () => {
    if (cameraTimer !== undefined) window.clearInterval(cameraTimer);
    cameraTimer = undefined;
    cameraStream?.getTracks().forEach((track) => track.stop());
    cameraStream = undefined;
    if (video) video.srcObject = null;
    video = undefined;
    canvas = undefined;
  };

  const setCameraEnabled = async (enabled: boolean) => {
    if (!enabled) {
      stopCamera();
      return;
    }
    if (cameraStream) return;
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
    video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.srcObject = cameraStream;
    await video.play();
    canvas = document.createElement("canvas");
    const frameRate = clampGoogleCameraFrameRate(args.cameraFrameRate);
    cameraTimer = window.setInterval(() => {
      if (!video || !canvas || currentWs.readyState !== WebSocket.OPEN || video.readyState < 2) return;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const quality = Math.max(0.1, Math.min(1, Number(args.jpegQuality) || 0.8));
      const data = dataUrlPayload(canvas.toDataURL("image/jpeg", quality));
      currentWs.send(JSON.stringify({ realtimeInput: { video: { data, mimeType: "image/jpeg" } } }));
    }, 1000 / frameRate);
  };

  const safeSend = (event: any) => {
    if (currentWs.readyState !== WebSocket.OPEN) throw new Error("Google Live websocket is not open.");
    if (event?.type === "response.create" || event?.type === "session.update") return;
    if (event?.type === "conversation.item.create" && event?.item?.type === "message") {
      const parts = (event.item.content ?? []).map((part: any) => {
        if (part?.type === "input_text") return { text: part.text };
        if (part?.type === "input_image" && typeof part.image_url === "string") {
          const match = part.image_url.match(/^data:([^;,]+);base64,(.+)$/);
          return match ? { inlineData: { mimeType: match[1], data: match[2] } } : { text: part.image_url };
        }
        return undefined;
      }).filter(Boolean);
      currentWs.send(JSON.stringify({ clientContent: { turns: [{ role: "user", parts }], turnComplete: true } }));
      return;
    }
    if (event?.type === "conversation.item.create" && event?.item?.type === "function_call_output") {
      let response: any = event.item.output;
      try { response = JSON.parse(response); } catch { /* retain string */ }
      currentWs.send(JSON.stringify({
        toolResponse: {
          functionResponses: [{
            id: event.item.call_id,
            name: event.item.name,
            response: { result: response },
          }],
        },
      }));
      return;
    }
    currentWs.send(JSON.stringify(event));
  };

  const session: RealtimeConversationWsSession = {
    kind: "ws",
    get ws() { return currentWs; },
    get stream() { return microphoneStream!; },
    get localCameraStream() { return cameraStream; },
    get cameraEnabled() { return !!cameraStream; },
    send: safeSend,
    setMicrophoneEnabled: (enabled) => microphoneStream?.getAudioTracks().forEach((track) => { track.enabled = enabled; }),
    setCameraEnabled,
    stop: async () => {
      stopped = true;
      stopCamera();
      cancelPlayback();
      try {
        if (currentWs.readyState === WebSocket.OPEN) currentWs.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } }));
      } catch { /* best effort */ }
      await stopMicrophone();
      await outputContext?.close().catch(() => undefined);
      try { intentionallyClosed.add(currentWs); currentWs.close(1000); } catch { /* ignore */ }
    },
  };

  setTimeout(() => { if (!stopped) events?.onOpen?.(); }, 0);
  return session;
}
