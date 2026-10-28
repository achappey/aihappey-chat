import type { RealtimeResponse } from "aihappey-ai";
import type { RealtimeConversationEvents, RealtimeConversationWsSession } from "./startRealtimeConversationWebrtc";
import { createSmallestAiCapture, smallestAiConnectionError, smallestAiProviderError, waitForSmallestAiSocket } from "./smallestAiAudio";

export function buildSmallestAiAgentUrl(token: string, inputRate: number) {
  if (!token.startsWith("wct_")) throw new Error("Smallest AI agents require a short-lived, single-use Atoms call token.");
  if (![8000, 16000, 22050, 24000, 44100, 48000].includes(inputRate)) throw new Error("Unsupported Smallest AI microphone sample rate.");
  const url = new URL("wss://api.smallest.ai/atoms/v1/agent/connect");
  url.searchParams.set("token", token);
  // This is the one per-direction option explicitly permitted with a registered token.
  url.searchParams.set("input_audio_format", `pcm_${inputRate}`);
  return url;
}

export async function startSmallestAiRealtimeConversationWsSession(args: {
  getEphemeralToken: () => Promise<RealtimeResponse>;
  signal?: AbortSignal;
  events?: RealtimeConversationEvents;
}): Promise<RealtimeConversationWsSession> {
  args.signal?.throwIfAborted();
  let ws: WebSocket | undefined;
  let capture: Awaited<ReturnType<typeof createSmallestAiCapture>> | undefined;
  let output: AudioContext | undefined;
  let ready = false, closing = false, closed = false, failed = false;
  let stopPromise: Promise<void> | undefined;
  let playbackTime = 0, outputRate = 24000;
  let carry: number | undefined;
  const playing = new Set<AudioBufferSourceNode>();
  let resolveClosed!: () => void;
  const sessionClosed = new Promise<void>(resolve => { resolveClosed = resolve; });
  let resolveReady!: () => void, rejectReady!: (error: Error) => void;
  const sessionReady = new Promise<void>((resolve, reject) => { resolveReady = resolve; rejectReady = reject; });
  // Startup can fail before the socket is created; keep the rejection observed throughout.
  void sessionReady.catch(() => {});
  const clearPlayback = () => {
    playbackTime = output?.currentTime ?? 0; carry = undefined;
    for (const node of playing) { try { node.stop(); } catch { /* already ended */ } }
    playing.clear();
  };
  const stop = () => stopPromise ??= (async () => {
    closing = true;
    args.signal?.removeEventListener("abort", abort);
    await capture?.stop();
    if (!closed && ready && !failed && ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "session.close" }));
      let timer: ReturnType<typeof setTimeout> | undefined;
      await Promise.race([sessionClosed, new Promise<void>(resolve => { timer = setTimeout(resolve, 1500); })]);
      clearTimeout(timer);
    }
    closed = true; clearPlayback();
    if (output && output.state !== "closed") await output.close();
    if (ws && ws.readyState !== WebSocket.CLOSED) ws.close(1000);
  })();
  const report = (message: string) => {
    if (failed || closed) return;
    failed = true; rejectReady(new Error(message)); resolveClosed();
    args.events?.onError?.(message);
    void stop();
  };
  const abort = () => { failed = true; rejectReady(new Error("Smallest AI session cancelled.")); resolveClosed(); void stop(); };
  args.signal?.addEventListener("abort", abort, { once: true });
  const play = (base64: string) => {
    const raw = atob(base64);
    const bytes = new Uint8Array(raw.length + (carry === undefined ? 0 : 1));
    let offset = 0;
    if (carry !== undefined) bytes[offset++] = carry;
    for (let i = 0; i < raw.length; i++) bytes[offset + i] = raw.charCodeAt(i);
    carry = bytes.length % 2 ? bytes[bytes.length - 1] : undefined;
    const length = Math.floor(bytes.length / 2);
    if (!length) return;
    const buffer = output!.createBuffer(1, length, outputRate);
    const view = new DataView(bytes.buffer);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) samples[i] = view.getInt16(i * 2, true) / 32768;
    const node = output!.createBufferSource(); node.buffer = buffer;
    node.connect(output!.destination); playing.add(node);
    node.onended = () => { playing.delete(node); node.disconnect(); };
    const at = Math.max(output!.currentTime, playbackTime);
    node.start(at); playbackTime = at + buffer.duration;
  };
  try {
    output = new AudioContext(); await output.resume();
    capture = await createSmallestAiCapture({ signal: args.signal, onAudio: bytes => {
      if (!ready || closing || ws?.readyState !== WebSocket.OPEN) return;
      if (ws.bufferedAmount > 1_000_000) { report("Smallest AI microphone audio could not be sent fast enough."); return; }
      let binary = "";
      for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
      ws.send(JSON.stringify({ type: "input_audio_buffer.append", audio: btoa(binary) }));
    } });
    args.signal?.throwIfAborted();
    const token = await args.getEphemeralToken();
    args.signal?.throwIfAborted();
    ws = new WebSocket(buildSmallestAiAgentUrl(token.value, capture.rate).toString());
    ws.addEventListener("message", event => {
      if (closed) return;
      try {
        const message = JSON.parse(String(event.data));
        if (message.type === "error") { report(smallestAiProviderError(message)); return; }
        if (message.type === "session.created") {
          if (![8000, 16000, 24000, 44100].includes(message.sample_rate)
            || (message.output_audio_format && message.output_audio_format !== `pcm_${message.sample_rate}`)
            || (message.input_audio_format && message.input_audio_format !== `pcm_${capture!.rate}`)) {
            report("Smallest AI session audio formats do not match the negotiated PCM streams."); return;
          }
          outputRate = message.sample_rate; ready = true; resolveReady();
          args.events?.onOpen?.();
        } else if (message.type === "output_audio.delta" && ready && !closing) play(message.audio);
        else if (message.type === "interruption") clearPlayback();
        else if (message.type === "transcript" || message.type === "transcript.delta") {
          if (!["user", "assistant"].includes(message.role) || typeof message.text !== "string") throw new Error("Invalid transcript");
          args.events?.onEvent?.({ type: message.role === "user"
            ? (message.type === "transcript" ? "transcript.user" : "transcript.user.delta")
            : (message.type === "transcript" ? "transcript.agent" : "transcript.agent.delta"), text: message.text });
          return;
        } else if (message.type === "session.closed") {
          resolveClosed();
          if (!ready || message.reason === "setup_failed") { report(`Smallest AI session closed: ${message.reason}`); return; }
          args.events?.onEvent?.({ type: "smallestai.session.closed", reason: message.reason });
          closed = true; void stop(); return;
        }
        args.events?.onEvent?.(message);
      } catch { report("Invalid Smallest AI agent event or PCM audio."); }
    });
    ws.addEventListener("error", () => { if (!closing) report(smallestAiConnectionError); });
    ws.addEventListener("close", () => {
      resolveClosed();
      if (!closing && !closed) report(smallestAiConnectionError);
    });
    const timer = setTimeout(() => report("Smallest AI agent session setup timed out."), 15000);
    try { await Promise.all([waitForSmallestAiSocket(ws, args.signal), sessionReady]); }
    finally { clearTimeout(timer); }
    if (closing || closed || failed) throw new Error("Smallest AI agent session ended during startup.");
    return {
      kind: "ws", ws, stream: capture.stream, stop,
      setMicrophoneEnabled: enabled => capture!.stream.getAudioTracks().forEach(track => { track.enabled = enabled; }),
      send: event => {
        if (closing || ws!.readyState !== WebSocket.OPEN) throw new Error("Smallest AI agent WebSocket is not open.");
        if (event.type === "response.create") return; // input_text.send automatically generates a response.
        if (event.type === "conversation.item.create") {
          const content = event.item?.content;
          if (event.item?.role !== "user" || !Array.isArray(content) || content.some((part: any) => !["input_text", "text"].includes(part.type)))
            throw new Error("Smallest AI agent text input does not support attachments or tool results.");
          const text = content.map((part: any) => String(part.text ?? "")).join("");
          if (!text.trim()) throw new Error("Smallest AI text input cannot be empty.");
          ws!.send(JSON.stringify({ type: "input_text.send", text })); return;
        }
        if (event.type === "input_audio_buffer.commit") { ws!.send(JSON.stringify({ type: event.type })); return; }
        throw new Error(`Unsupported Smallest AI client event: ${event.type}`);
      },
    };
  } catch (error) {
    failed = true; rejectReady(new Error("Smallest AI startup failed."));
    await stop();
    // A capture request may have resolved after an abort-triggered cleanup started.
    await capture?.stop();
    if (output && output.state !== "closed") await output.close();
    throw error;
  }
}
