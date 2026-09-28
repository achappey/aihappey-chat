import type { RealtimeResponse } from "aihappey-ai";
import type { RealtimeConversationEvents, RealtimeConversationWsSession } from "./startRealtimeConversationWebrtc";

const PCM_FALLBACK_RATE = 24000;

const encodePcm16 = (samples: Float32Array): string => {
  const bytes = new Uint8Array(samples.length * 2);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < samples.length; i++) {
    const value = Math.max(-1, Math.min(1, samples[i] ?? 0));
    view.setInt16(i * 2, value < 0 ? value * 0x8000 : value * 0x7fff, true);
  }
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
};

const decodePcm16 = (base64: string): Float32Array => {
  const binary = atob(base64);
  const samples = new Float32Array(Math.floor(binary.length / 2));
  for (let i = 0; i < samples.length; i++) {
    const value = binary.charCodeAt(2 * i) | (binary.charCodeAt(2 * i + 1) << 8);
    samples[i] = (value & 0x8000 ? value - 0x10000 : value) / 32768;
  }
  return samples;
};

const resample = (input: Float32Array, from: number, to: number): Float32Array => {
  if (from === to) return input;
  const ratio = from / to;
  const output = new Float32Array(Math.max(1, Math.round(input.length / ratio)));
  for (let i = 0; i < output.length; i++) {
    const position = i * ratio;
    const first = Math.floor(position);
    const fraction = position - first;
    output[i] = (1 - fraction) * (input[first] ?? 0) + fraction * (input[Math.min(first + 1, input.length - 1)] ?? 0);
  }
  return output;
};

const sampleRate = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value > 0
  ? value : PCM_FALLBACK_RATE;

export async function startOpperAiRealtimeConversationWsSession(args: {
  config: Record<string, any>;
  getEphemeralToken: () => Promise<RealtimeResponse>;
  events?: RealtimeConversationEvents;
}): Promise<RealtimeConversationWsSession> {
  const ticket = (await args.getEphemeralToken()).value;
  if (!ticket) throw new Error("OpperAI realtime token response did not contain a ticket value.");

  // The ticket is a single-use credential. Never put it in the URL or log it.
  const ws = new WebSocket("wss://api.opper.ai/v3/realtime", [`opper-ticket.${ticket}`]);
  let stream: MediaStream | undefined;
  let inputContext: AudioContext | undefined;
  let outputContext: AudioContext | undefined;
  let source: MediaStreamAudioSourceNode | undefined;
  let processor: ScriptProcessorNode | undefined;
  let silentGain: GainNode | undefined;
  let outputRate = PCM_FALLBACK_RATE;
  let nextPlaybackTime = 0;
  let closed = false;
  let microphoneEnabled = true;
  const playbackNodes = new Set<AudioBufferSourceNode>();

  const send = (event: any) => {
    if (ws.readyState !== WebSocket.OPEN || closed) throw new Error("OpperAI realtime WebSocket is not open.");
    ws.send(JSON.stringify(event));
  };

  const cleanup = async () => {
    if (closed) return;
    closed = true;
    if (processor) processor.onaudioprocess = null;
    processor?.disconnect();
    source?.disconnect();
    silentGain?.disconnect();
    stream?.getTracks().forEach((track) => track.stop());
    for (const node of playbackNodes) {
      try { node.stop(); } catch { /* Already finished. */ }
      node.disconnect();
    }
    playbackNodes.clear();
    await Promise.allSettled([inputContext?.close(), outputContext?.close()]);
    if (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN) ws.close();
  };

  const playAudio = (audio: string) => {
    if (closed) return;
    const samples = decodePcm16(audio);
    if (!samples.length) return;
    outputContext ??= new AudioContext();
    void outputContext.resume();
    const buffer = outputContext.createBuffer(1, samples.length, outputRate);
    buffer.getChannelData(0).set(samples);
    const node = outputContext.createBufferSource();
    node.buffer = buffer;
    node.connect(outputContext.destination);
    node.onended = () => {
      playbackNodes.delete(node);
      node.disconnect();
    };
    playbackNodes.add(node);
    const startAt = Math.max(outputContext.currentTime, nextPlaybackTime);
    node.start(startAt);
    nextPlaybackTime = startAt + buffer.duration;
  };

  const session: RealtimeConversationWsSession = {
    kind: "ws",
    ws,
    get stream() { return stream!; },
    send,
    setMicrophoneEnabled: (enabled) => {
      microphoneEnabled = enabled;
      stream?.getAudioTracks().forEach((track) => { track.enabled = enabled; });
    },
    stop: cleanup,
  };

  return new Promise<RealtimeConversationWsSession>((resolve, reject) => {
    let settled = false;
    const fail = (message: string, error?: unknown) => {
      if (settled) {
        args.events?.onError?.(message, error);
      } else {
        settled = true;
        reject(error instanceof Error ? error : new Error(message));
      }
      void cleanup();
    };

    ws.addEventListener("open", () => {
      try {
        // The first frame must be session.start. Do not send microphone chunks
        // until session.started supplies the negotiated PCM16 sample rates.
        send({ type: "session.start", config: args.config });
      } catch (error) {
        fail("Failed starting OpperAI realtime session", error);
      }
    });

    ws.addEventListener("message", (message) => {
      void (async () => {
        let event: any;
        try {
          event = JSON.parse(String(message.data));
        } catch (error) {
          fail("Failed to parse OpperAI realtime event", error);
          return;
        }
        args.events?.onEvent?.(event);
        if (event?.type === "session.started" && !settled) {
          try {
            if (event.audio_format !== "pcm16") throw new Error(`Unsupported OpperAI audio format: ${event.audio_format}`);
            const inputRate = sampleRate(event.input_sample_rate);
            outputRate = sampleRate(event.output_sample_rate);
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (closed) { stream.getTracks().forEach((track) => track.stop()); return; }
            if (!stream.getAudioTracks().length) throw new Error("No microphone audio track available");
            stream.getAudioTracks().forEach((track) => { track.enabled = microphoneEnabled; });
            inputContext = new AudioContext();
            source = inputContext.createMediaStreamSource(stream);
            processor = inputContext.createScriptProcessor(4096, 1, 1);
            silentGain = inputContext.createGain();
            silentGain.gain.value = 0;
            source.connect(processor);
            processor.connect(silentGain);
            silentGain.connect(inputContext.destination);
            processor.onaudioprocess = (audioEvent) => {
              if (!microphoneEnabled || closed || ws.readyState !== WebSocket.OPEN) return;
              try {
                const chunk = resample(audioEvent.inputBuffer.getChannelData(0), inputContext!.sampleRate, inputRate);
                send({ type: "audio.append", audio: encodePcm16(chunk) });
              } catch (error) {
                args.events?.onError?.("Failed sending OpperAI microphone audio", error);
              }
            };
            settled = true;
            resolve(session);
            setTimeout(() => { if (!closed) args.events?.onOpen?.(); }, 0);
          } catch (error) {
            fail("Failed setting up OpperAI realtime microphone", error);
          }
        } else if (event?.type === "audio.delta" && typeof event.audio === "string") {
          try { playAudio(event.audio); } catch (error) { args.events?.onError?.("Failed playing OpperAI realtime audio", error); }
        } else if (event?.type === "session.terminating" || event?.type === "session.ended") {
          fail(event?.error?.message ?? "OpperAI realtime session ended.");
        }
      })();
    });
    ws.addEventListener("error", (error) => fail("OpperAI realtime WebSocket error", error));
    ws.addEventListener("close", () => {
      if (!closed) fail("OpperAI realtime WebSocket closed.");
    });
  });
}
