import type { RealtimeResponse } from "aihappey-ai";
import type { RealtimeConversationEvents, RealtimeConversationWsSession } from "./startRealtimeConversationWebrtc";

const SAMPLE_RATE = 16000;

export async function startCartesiaRealtimeConversationWsSession(args: {
  agentId: string;
  getEphemeralToken: () => Promise<RealtimeResponse>;
  outputDelivery?: "speaking_pace" | "as_available";
  events?: RealtimeConversationEvents;
}): Promise<RealtimeConversationWsSession> {
  if (!/^agent_[\w-]+$/.test(args.agentId)) throw new Error("Invalid Cartesia agent ID");
  const token = await args.getEphemeralToken();
  if (!token.value) throw new Error("Missing Cartesia agent access token");
  const url = new URL(`wss://api.cartesia.ai/v1/agents/websocket/${encodeURIComponent(args.agentId)}`);
  url.searchParams.set("cartesia_version", "2026-08-14");
  url.searchParams.set("access_token", token.value);
  const ws = new WebSocket(url.toString());
  const events = args.events;
  let stream: MediaStream | undefined;
  let inputContext: AudioContext | undefined;
  let outputContext: AudioContext | undefined;
  let source: MediaStreamAudioSourceNode | undefined;
  let processor: ScriptProcessorNode | undefined;
  let stopped = false;
  let ready = false;
  let playbackTime = 0;
  const playing = new Set<AudioBufferSourceNode>();

  const send = (event: any) => {
    if (ws.readyState !== WebSocket.OPEN) throw new Error("Cartesia agent WebSocket is not open");
    ws.send(JSON.stringify(event));
  };
  const clearPlayback = () => {
    playbackTime = outputContext?.currentTime ?? 0;
    for (const node of playing) { try { node.stop(); } catch { /* already stopped */ } }
    playing.clear();
  };
  const play = (base64: string) => {
    outputContext ??= new AudioContext();
    void outputContext.resume();
    const raw = atob(base64);
    const buffer = outputContext.createBuffer(1, Math.floor(raw.length / 2), SAMPLE_RATE);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) {
      const value = raw.charCodeAt(i * 2) | (raw.charCodeAt(i * 2 + 1) << 8);
      samples[i] = (value >= 32768 ? value - 65536 : value) / 32768;
    }
    const node = outputContext.createBufferSource();
    node.buffer = buffer;
    node.connect(outputContext.destination);
    playing.add(node);
    node.onended = () => playing.delete(node);
    const at = Math.max(outputContext.currentTime, playbackTime);
    node.start(at);
    playbackTime = at + buffer.duration;
  };

  ws.addEventListener("message", (event) => {
    try {
      const message = JSON.parse(String(event.data));
      if (message.type === "session_ready") {
        ready = true;
        events?.onOpen?.();
      } else if (message.type === "audio_output" && typeof message.audio === "string") play(message.audio);
      else if (message.type === "audio_output_clear") clearPlayback();
      else if (message.type === "error" && message.fatal) events?.onError?.(`Cartesia: ${message.message ?? message.code}`);
      events?.onEvent?.(message);
    } catch (error) { events?.onError?.("Invalid Cartesia agent event", error); }
  });
  ws.addEventListener("error", (event) => { if (!stopped) events?.onError?.("Cartesia agent WebSocket error", event); });
  ws.addEventListener("close", (event) => { if (!stopped) events?.onError?.(`Cartesia agent connection closed (${event.code})`); });

  try {
    await new Promise<void>((resolve, reject) => {
      ws.addEventListener("open", () => resolve(), { once: true });
      ws.addEventListener("close", () => reject(new Error("Cartesia agent closed before opening")), { once: true });
      ws.addEventListener("error", () => reject(new Error("Cartesia agent connection failed")), { once: true });
    });
    // session_create must be the first message, within ten seconds. Browser tokens cannot set dynamic_variables.
    send({ type: "session_create", audio: { input_format: "pcm_16000", output_delivery: args.outputDelivery ?? "speaking_pace" } });
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    inputContext = new AudioContext();
    source = inputContext.createMediaStreamSource(stream);
    processor = inputContext.createScriptProcessor(2048, 1, 1);
    const silent = inputContext.createGain();
    silent.gain.value = 0;
    source.connect(processor);
    processor.connect(silent);
    silent.connect(inputContext.destination);
    processor.onaudioprocess = (event) => {
      if (!ready || stopped || ws.readyState !== WebSocket.OPEN || ws.bufferedAmount > 1_000_000) return;
      const input = event.inputBuffer.getChannelData(0);
      const size = Math.max(1, Math.round(input.length * SAMPLE_RATE / inputContext!.sampleRate));
      const bytes = new Uint8Array(size * 2);
      const view = new DataView(bytes.buffer);
      for (let i = 0; i < size; i++) {
        const position = i * inputContext!.sampleRate / SAMPLE_RATE;
        const low = Math.floor(position);
        const sample = Math.max(-1, Math.min(1, (input[low] ?? 0) + ((input[Math.min(low + 1, input.length - 1)] ?? 0) - (input[low] ?? 0)) * (position - low)));
        view.setInt16(i * 2, sample < 0 ? sample * 32768 : sample * 32767, true);
      }
      let binary = "";
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      send({ type: "audio_input", audio: btoa(binary) });
    };
  } catch (error) {
    processor?.disconnect();
    source?.disconnect();
    stream?.getTracks().forEach((track) => track.stop());
    await inputContext?.close();
    ws.close();
    throw error;
  }

  return {
    kind: "ws", ws,
    get stream() { return stream!; },
    send,
    setMicrophoneEnabled: (enabled) => stream?.getAudioTracks().forEach((track) => { track.enabled = enabled; }),
    stop: async () => {
      if (stopped) return;
      stopped = true;
      ready = false;
      clearPlayback();
      if (processor) processor.onaudioprocess = null;
      processor?.disconnect();
      source?.disconnect();
      stream?.getTracks().forEach((track) => track.stop());
      await inputContext?.close();
      await outputContext?.close();
      ws.close(1000);
    },
  };
}
