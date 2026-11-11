import type { RealtimeResponse } from "aihappey-ai";

export type OpenAiRealtimeWebrtcSession = {
  pc: RTCPeerConnection;
  dc: RTCDataChannel;
  stream: MediaStream;
  stop: () => Promise<void>;
  commitAudio: () => void;
};

export type OpenAiRealtimeWebrtcEvents = {
  onEvent?: (event: any) => void;
  onTranscriptText?: (text: string) => void;
  onSessionCreated?: (session: any) => void;
  /** Checkpoint confirmed text before replacing an OpenAI connection. */
  onSessionRenewing?: () => Promise<void>;
  onError?: (message: string, err?: unknown) => void;
};

const FINALIZATION_TIMEOUT_MS = 5000;
// RTP audio and reliable data-channel messages do not share an ordering guarantee.
const AUDIO_DRAIN_MS = 150;

/** Connect using a server-issued ephemeral token, never a provider API key. */
export async function startOpenAiRealtimeWebrtcSession(args: {
  getEphemeralToken: () => Promise<RealtimeResponse>;
  microphoneStream?: MediaStream;
  signal?: AbortSignal;
  events?: OpenAiRealtimeWebrtcEvents;
}): Promise<OpenAiRealtimeWebrtcSession> {
  const { events, signal } = args;
  signal?.throwIfAborted();
  // Token clients may not support cancellation. Do not let a pending token keep
  // Stop/navigation waiting, or let its late result open a new connection.
  const tokenRequest = args.getEphemeralToken();
  const token = signal ? await new Promise<RealtimeResponse>((resolve, reject) => {
    const cancelled = () => reject(signal.reason);
    signal.addEventListener("abort", cancelled, { once: true });
    tokenRequest.then(resolve, reject).finally(() => signal.removeEventListener("abort", cancelled));
    if (signal.aborted) cancelled();
  }) : await tokenRequest;
  signal?.throwIfAborted();

  const pc = new RTCPeerConnection();
  let dc: RTCDataChannel | undefined;
  let stream: MediaStream | undefined;
  let stopping = false;
  let closed = false;
  let captureStopped = false;
  let failure: Error | undefined;
  let stopPromise: Promise<void> | undefined;
  let notify: (() => void) | undefined;
  let manualTurns = false;
  let uncommittedSpeech = false;
  let activeItemId: string | undefined;
  let commitEventId: string | undefined;
  let awaitingCommit = false;
  const pending = new Set<string>();
  const completed = new Set<string>();

  const stopCapture = () => {
    if (!stream || captureStopped) return;
    captureStopped = true;
    // A sender's track is the same object as the stream's track: stop it once.
    stream.getTracks().forEach(track => { try { track.stop(); } catch { /* Still release the other tracks and transport. */ } });
  };
  const cleanup = () => {
    if (closed) return;
    closed = true;
    signal?.removeEventListener("abort", aborted);
    stopCapture();
    try { dc?.close(); } finally { pc.close(); }
    notify?.();
  };
  const aborted = () => { cleanup(); };
  const fail = (message: string, error?: unknown) => {
    if (closed || signal?.aborted || failure) return;
    failure = new Error(message);
    notify?.();
    // During finalization stop() reports the error after saving confirmed text.
    // Do not re-enter the controller's fatal-stop handler from inside stop().
    if (!stopping) events?.onError?.(message, error);
  };
  signal?.addEventListener("abort", aborted, { once: true });

  const commitAudio = () => {
    if (closed || dc?.readyState !== "open" || awaitingCommit) return;
    commitEventId = crypto.randomUUID();
    awaitingCommit = true;
    dc.send(JSON.stringify({ type: "input_audio_buffer.commit", event_id: commitEventId }));
  };

  try {
    stream = args.microphoneStream ?? await navigator.mediaDevices.getUserMedia({ audio: true });
    // Permission prompts cannot be aborted. Release a late stream immediately.
    if (signal?.aborted || closed) { stopCapture(); signal?.throwIfAborted(); throw new Error("Transcription startup cancelled."); }
    const track = stream.getAudioTracks?.()[0] ?? stream.getTracks()[0];
    if (track) pc.addTrack(track);
    dc = pc.createDataChannel("oai-events");
    dc.addEventListener("close", () => {
      if (!closed && !signal?.aborted) fail("Realtime transcription connection closed.");
      notify?.();
    });
    dc.addEventListener("error", () => fail("Realtime transcription data channel failed."));
    pc.addEventListener("connectionstatechange", () => {
      if (pc.connectionState === "failed" || pc.connectionState === "closed") fail("Realtime transcription connection failed.");
    });
    dc.addEventListener("message", e => {
      if (closed || signal?.aborted) return;
      let event: any;
      try { event = JSON.parse(String(e.data)); }
      catch (error) { fail("Failed to parse realtime event.", error); return; }

      const type = event?.type;
      const id = typeof event?.item_id === "string" ? event.item_id : undefined;
      if (type === "session.created" || type === "transcription_session.created" || type === "session.updated" || type === "transcription_session.updated") {
        const session = event.session;
        const input = session?.audio?.input;
        manualTurns = input && Object.hasOwn(input, "turn_detection")
          ? input.turn_detection === null : session?.turn_detection === null;
      }
      if (type === "input_audio_buffer.speech_started") {
        uncommittedSpeech = true;
        activeItemId = id;
      }
      if (type === "input_audio_buffer.committed") {
        awaitingCommit = false;
        if (!activeItemId || activeItemId === id) uncommittedSpeech = false;
      }
      if (id && (type === "input_audio_buffer.speech_started" || type === "input_audio_buffer.committed"
        || type === "conversation.item.input_audio_transcription.delta") && !completed.has(id)) pending.add(id);
      if (id && (type === "conversation.item.input_audio_transcription.completed" || type === "conversation.item.input_audio_transcription.failed")) {
        pending.delete(id);
        completed.add(id);
      }
      if (type === "error") {
        // VAD may commit between our check and our explicit commit. Only this
        // correlated empty-buffer response is benign; all other errors are real.
        if (awaitingCommit && event.error?.event_id === commitEventId && event.error?.code === "input_audio_buffer_commit_empty") {
          awaitingCommit = false;
          uncommittedSpeech = false;
          notify?.();
          return;
        }
        fail(event.error?.message ?? "OpenAI reported a realtime transcription error.", event.error);
      } else if (type === "conversation.item.input_audio_transcription.failed") {
        fail(event.error?.message ?? "OpenAI could not finalize the transcription.");
      }

      events?.onEvent?.(event);
      if (type === "session.created" || type === "transcription_session.created") events?.onSessionCreated?.(event.session);
      if (type === "conversation.item.input_audio_transcription.delta") events?.onTranscriptText?.(event.delta);
      notify?.();
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    const response = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST", body: offer.sdp, signal,
      headers: { Authorization: `Bearer ${token.value}`, "Content-Type": "application/sdp" },
    });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Realtime SDP exchange failed (${response.status}): ${body}`);
    }
    signal?.throwIfAborted();
    await pc.setRemoteDescription({ type: "answer", sdp: await response.text() });
    signal?.throwIfAborted();
    if (dc.readyState !== "open") {
      await new Promise<void>((resolve, reject) => {
        const channel = dc!;
        const timer = setTimeout(() => finish(new Error("Timed out opening the transcription data channel.")), 30000);
        const finish = (error?: unknown) => {
          clearTimeout(timer);
          channel.removeEventListener("open", opened);
          channel.removeEventListener("close", disconnected);
          channel.removeEventListener("error", disconnected);
          signal?.removeEventListener("abort", cancelled);
          error ? reject(error) : resolve();
        };
        const opened = () => finish();
        const disconnected = () => finish(signal?.aborted ? signal.reason : failure ?? new Error("Transcription data channel closed before opening."));
        const cancelled = () => finish(signal?.reason ?? new Error("Transcription startup cancelled."));
        channel.addEventListener("open", opened);
        channel.addEventListener("close", disconnected);
        channel.addEventListener("error", disconnected);
        signal?.addEventListener("abort", cancelled, { once: true });
        if (signal?.aborted) cancelled();
        else if (closed || failure || channel.readyState === "closed") disconnected();
      });
    }
    if (failure) throw failure;
  } catch (error) {
    cleanup();
    throw error;
  }

  const stop = (): Promise<void> => {
    if (stopPromise) return stopPromise;
    stopping = true;
    stopCapture();
    stopPromise = (async () => {
      try {
        if (closed || signal?.aborted || failure) return;
        // Let already-sent RTP arrive before sending the reliable commit command.
        await new Promise<void>(resolve => setTimeout(resolve, AUDIO_DRAIN_MS));
        if (closed || signal?.aborted) return;
        if (!failure && (uncommittedSpeech || manualTurns)) commitAudio();
        if (pending.size || awaitingCommit) {
          await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(() => finish(new Error("Timed out waiting for the final OpenAI transcription. Confirmed text has been retained.")), FINALIZATION_TIMEOUT_MS);
            const finish = (error?: Error) => { clearTimeout(timer); notify = undefined; error ? reject(error) : resolve(); };
            notify = () => {
              if (signal?.aborted) finish();
              else if (failure) finish(failure);
              else if (!pending.size && !awaitingCommit) finish();
            };
            notify();
          });
        }
        if (failure) throw failure;
      } finally { cleanup(); }
    })();
    return stopPromise;
  };
  return { pc, dc: dc!, stream: stream!, stop, commitAudio };
}
