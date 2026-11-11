import { startOpenAiRealtimeWebrtcSession, type OpenAiRealtimeWebrtcSession } from "./openaiRealtimeWebrtc";

const RENEW_AFTER_MS = 55 * 60 * 1000;

/** Do not mistake token expiry, authentication errors, or a network failure for a session duration limit. */
export function isOpenAiTranscriptionDurationLimit(error: unknown, message = ""): boolean {
  const detail = error as { code?: string; message?: string } | undefined;
  return ["session_duration_exceeded", "session_duration_limit_exceeded"].includes(detail?.code ?? "")
    || /session[^\r\n]*(?:maximum|max)[^\r\n]*duration/i.test(detail?.message ?? message);
}

/** One recording/capture owner, with a fresh single-use credential and transport per connection. */
export async function startRenewingOpenAiTranscription(
  args: Parameters<typeof startOpenAiRealtimeWebrtcSession>[0],
): Promise<Pick<OpenAiRealtimeWebrtcSession, "stop" | "commitAudio">> {
  const { events, signal } = args;
  signal?.throwIfAborted();
  const stream = args.microphoneStream ?? await navigator.mediaDevices.getUserMedia({ audio: true });
  const startedAt = performance.now();
  let current: OpenAiRealtimeWebrtcSession | undefined;
  let opening: AbortController | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let renewal: Promise<void> | undefined;
  let stopPromise: Promise<void> | undefined;
  let stopping = false;
  let captureStopped = false;
  let failed = false;
  let failure: Error | undefined;
  let generation = 0;

  const stopCapture = () => {
    if (captureStopped) return;
    captureStopped = true;
    stream.getTracks().forEach(track => { try { track.stop(); } catch { /* Release all tracks. */ } });
  };
  const clearTimer = () => { clearTimeout(timer); timer = undefined; };
  const fail = (message: string, error?: unknown) => {
    if (stopping || failed || signal?.aborted) return;
    failed = true;
    clearTimer();
    events?.onError?.(message, error);
  };

  const open = async () => {
    if (stopping || signal?.aborted) return;
    const connection = ++generation;
    const offsetMs = Math.max(0, performance.now() - startedAt);
    const startup = new AbortController();
    opening = startup;
    // Each transport owns only its cloned tracks. Finalizing it must not end the
    // recording's source track or require a new microphone permission prompt.
    const capture = stream.clone();
    let announced = false;
    const announce = () => {
      if (announced) return;
      announced = true;
      events?.onEvent?.({ type: "aihappey.transcription.connection", connection, offset_ms: Math.max(offsetMs, performance.now() - startedAt) });
    };
    try {
      const session = await startOpenAiRealtimeWebrtcSession({
        getEphemeralToken: args.getEphemeralToken,
        microphoneStream: capture,
        signal: startup.signal,
        events: {
          onEvent: event => {
            if (connection === generation && !signal?.aborted) { announce(); events?.onEvent?.(event); }
          },
          onSessionCreated: session => {
            if (connection === generation && !signal?.aborted) events?.onSessionCreated?.(session);
          },
          onError: (message, error) => {
            if (connection !== generation || stopping || signal?.aborted) return;
            // Startup failures are reported by the rejected open(), once.
            if (opening === startup) return;
            if (isOpenAiTranscriptionDurationLimit(error, message)) void renew();
            else fail(message, error);
          },
        },
      });
      if (stopping || startup.signal.aborted || signal?.aborted) { await session.stop(); return; }
      announce();
      current = session;
      timer = setTimeout(() => { void renew(); }, RENEW_AFTER_MS);
    } catch (error) {
      // Token retrieval can fail before the transport takes ownership of capture.
      capture.getTracks().forEach(track => { if (track.readyState !== "ended") track.stop(); });
      throw error;
    } finally {
      if (opening === startup) opening = undefined;
    }
  };

  const renew = (): Promise<void> => {
    if (renewal) return renewal;
    if (stopping || failed || signal?.aborted) return Promise.resolve();
    clearTimer();
    renewal = (async () => {
      // Publish renewal before a transport can synchronously report more errors.
      await Promise.resolve();
      const previous = current;
      current = undefined;
      try { await previous?.stop(); }
      catch (error) {
        if (!isOpenAiTranscriptionDurationLimit(error, error instanceof Error ? error.message : "")) throw error;
      }
      if (stopping || signal?.aborted) return;
      await events?.onSessionRenewing?.();
      if (stopping || signal?.aborted) return;
      await open();
    })().catch(error => {
      if (stopping && error instanceof Error && error.name === "AbortError") return;
      failure = error instanceof Error ? error : new Error("Could not renew the OpenAI transcription session.");
      fail(error instanceof Error ? error.message : "Could not renew the OpenAI transcription session.");
    }).finally(() => { renewal = undefined; });
    return renewal;
  };

  const stop = (): Promise<void> => {
    if (stopPromise) return stopPromise;
    stopping = true;
    clearTimer();
    opening?.abort();
    stopCapture();
    signal?.removeEventListener("abort", aborted);
    stopPromise = (async () => {
      await renewal;
      const session = current;
      current = undefined;
      await session?.stop();
      if (failure) throw failure;
    })();
    return stopPromise;
  };
  const aborted = () => { void stop().catch(() => {}); };
  signal?.addEventListener("abort", aborted, { once: true });
  try {
    signal?.throwIfAborted();
    await open();
    signal?.throwIfAborted();
    return { stop, commitAudio: () => current?.commitAudio() };
  } catch (error) {
    await stop().catch(() => {});
    throw error;
  }
}
