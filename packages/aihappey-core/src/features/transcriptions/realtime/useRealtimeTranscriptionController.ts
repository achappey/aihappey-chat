import { useCallback, useEffect, useMemo, useRef } from "react";
import { getRealtimeToken } from "aihappey-ai";
import { useAppStore } from "aihappey-state";
import type { ChatConfig } from "../../chat/context/ChatContext";
import type { TranscriptionsContextType } from "aihappey-transcriptions";
import { startRealtimeWebrtcSession } from "./startRealtimeWebrtcSession";
import { parseProviderIdFromModelId } from "./realtimeProviders";
import { getTranscriptionErrorMessage } from "../transcriptionErrors";
import { ModelOption } from "aihappey-types";

const describeError = (e: unknown) => {
  if (!e) return "unknown";
  if (e instanceof Error) return e.message || e.name;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
};

const debounce = <T extends (...args: any[]) => void>(fn: T, waitMs: number) => {
  let t: any;
  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), waitMs);
  };
};

export function useRealtimeTranscriptionController(args: {
  config: ChatConfig;
  selectedModel?: ModelOption;
  transcriptions: TranscriptionsContextType;
  onErrorAlert?: (message: string) => void;
}) {
  const { config, selectedModel, transcriptions, onErrorAlert } = args;

  const customHeaders = useAppStore((a) => a.customHeaders);
  const providerRealtimeMetadata = useAppStore((a) => a.providerRealtimeMetadata);
  const setRealtimeSessionState = useAppStore((a) => a.setRealtimeSessionState);
  const resetRealtimeSessionState = useAppStore((a) => a.resetRealtimeSessionState);
  const realtimeStatus = useAppStore((a) => a.realtimeStatus);
  const realtimeText = useAppStore((a) => a.realtimeText);
  const realtimeActiveTranscriptionId = useAppStore((a) => a.realtimeActiveTranscriptionId);

  const sessionRef = useRef<Awaited<ReturnType<typeof startRealtimeWebrtcSession>> | null>(null);
  const bufferRef = useRef<string>("");
  const stopInFlightRef = useRef<Promise<void> | null>(null);

  // Used to prevent double-handling of fatal errors (e.g. multiple error events)
  // which could otherwise trigger double-stop / double-delete races.
  const fatalErrorHandledRef = useRef<boolean>(false);

  type RealtimeSegmentDraft = {
    itemId: string;
    startMs?: number;
    endMs?: number;
    text?: string;
  };

  // Track segment timing/text keyed by OpenAI item_id.
  const segmentsRef = useRef<Map<string, RealtimeSegmentDraft>>(new Map());

  // For ElevenLabs we don't have OpenAI item_ids; use a monotonically increasing counter.
  const elevenCommitCounterRef = useRef<number>(0);

  // For Deepgram we also don't have OpenAI item_ids; use a monotonically increasing counter.
  const deepgramCommitCounterRef = useRef<number>(0);

  // For Gladia we also don't have OpenAI item_ids; use a monotonically increasing counter.
  const gladiaCommitCounterRef = useRef<number>(0);

  // For AssemblyAI we also don't have OpenAI item_ids; use a monotonically increasing counter.
  const assemblyAiCommitCounterRef = useRef<number>(0);

  const sessionInfoRef = useRef<any>(null);

  const providerId = useMemo(() => parseProviderIdFromModelId(selectedModel?.id), [selectedModel]);
  //const supportsRealtime = useMemo(() => providerSupportsRealtime(providerId), [providerId]);
  const supportsRealtime = selectedModel?.tags?.includes("real-time");

  const canStart = useMemo(
    () => !!selectedModel && !!config?.baseUrl && supportsRealtime,
    [config?.baseUrl, selectedModel, supportsRealtime]
  );

  const persistUpdate = useMemo(
    () => debounce(async (id: string, next: { text: string; segments: Array<{ text: string; startSecond: number; endSecond: number }>; durationInSeconds?: number; session?: any }) => {
      if (!selectedModel) return;
      await transcriptions.update(id, {
        transcription: {
          text: next.text,
          segments: next.segments,
          language: undefined,
          durationInSeconds: next.durationInSeconds,
          warnings: [],
          response: {
            timestamp: new Date(),
            modelId: selectedModel.id,
            body: { kind: "realtime", session: next.session },
          },
        },
      });
    }, 400),
    [selectedModel, transcriptions]
  );

  // For committed chunks we want to persist immediately (no debounce) to avoid losing text on refresh/crash.
  const persistUpdateNow = useCallback(
    async (
      id: string,
      next: {
        text: string;
        segments: Array<{ text: string; startSecond: number; endSecond: number }>;
        durationInSeconds?: number;
        session?: any;
      }
    ) => {
      if (!selectedModel) return;
      await transcriptions.update(id, {
        transcription: {
          text: next.text,
          segments: next.segments,
          language: undefined,
          durationInSeconds: next.durationInSeconds,
          warnings: [],
          response: {
            timestamp: new Date(),
            modelId: selectedModel.id,
            body: { kind: "realtime", session: next.session },
          },
        },
      });
    },
    [selectedModel, transcriptions]
  );

  const computeSnapshot = useCallback(
    (opts?: { preferText?: string }) => {
      const items = Array.from(segmentsRef.current.values());
      const complete = items
        .filter((s) => typeof s.text === "string" && typeof s.startMs === "number" && typeof s.endMs === "number")
        .sort((a, b) => (a.startMs ?? 0) - (b.startMs ?? 0));

      const segments = complete.map((s) => ({
        text: String(s.text ?? "").trim(),
        startSecond: Math.max(0, (s.startMs ?? 0) / 1000),
        endSecond: Math.max(0, (s.endMs ?? s.startMs ?? 0) / 1000),
      }));

      const textFromSegments = segments.map((s) => s.text).filter(Boolean).join(" ").trim();
      const preferred = String(opts?.preferText ?? "").trim();
      const text = preferred || textFromSegments;
      const durationInSeconds = segments.length ? Math.max(...segments.map((s) => s.endSecond)) : undefined;

      return {
        text,
        segments,
        durationInSeconds,
        session: sessionInfoRef.current ?? undefined,
      };
    },
    []
  );

  const parseElevenLabsTimestampSegments = useCallback((event: any) => {
    // ElevenLabs payload shape may vary; this is intentionally defensive.
    // Known message_type: "committed_transcript_with_timestamps".
    // We'll attempt to extract an array of word-level timings and then collapse into a single segment.

    const text = typeof event?.text === "string" ? event.text.trim() : "";
    if (!text) return null;

    const wordsRaw =
      (Array.isArray(event?.words) ? event.words : null) ??
      (Array.isArray(event?.timestamps) ? event.timestamps : null) ??
      (Array.isArray(event?.word_timestamps) ? event.word_timestamps : null) ??
      (Array.isArray(event?.wordTimestamps) ? event.wordTimestamps : null);

    const asNum = (v: any) => {
      const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
      return Number.isFinite(n) ? n : undefined;
    };

    type WordTs = { startSecond: number; endSecond: number };
    const wordTses: WordTs[] = [];
    if (Array.isArray(wordsRaw)) {
      for (const w of wordsRaw) {
        // support { start, end } in seconds; { start_ms, end_ms } in ms; { startTime, endTime } etc.
        const startS =
          asNum(w?.start) ??
          asNum(w?.start_time) ??
          asNum(w?.startTime) ??
          (asNum(w?.start_ms) !== undefined ? (asNum(w?.start_ms) as number) / 1000 : undefined) ??
          (asNum(w?.startMs) !== undefined ? (asNum(w?.startMs) as number) / 1000 : undefined);
        const endS =
          asNum(w?.end) ??
          asNum(w?.end_time) ??
          asNum(w?.endTime) ??
          (asNum(w?.end_ms) !== undefined ? (asNum(w?.end_ms) as number) / 1000 : undefined) ??
          (asNum(w?.endMs) !== undefined ? (asNum(w?.endMs) as number) / 1000 : undefined);
        if (typeof startS === "number" && typeof endS === "number") {
          wordTses.push({ startSecond: Math.max(0, startS), endSecond: Math.max(0, endS) });
        }
      }
    }

    // If we have word-level timings, create a segment spanning them.
    if (wordTses.length) {
      const startSecond = Math.min(...wordTses.map((x) => x.startSecond));
      const endSecond = Math.max(...wordTses.map((x) => x.endSecond));
      return { text, startSecond, endSecond };
    }

    // Fallback: no timestamps; still return a segment without duration.
    return { text, startSecond: 0, endSecond: 0 };
  }, []);

  const parseDeepgramResultSegment = useCallback((event: any) => {
    // Deepgram Results payload shape (docs):
    // {
    //   type: "Results",
    //   channel: { alternatives: [{ transcript, words: [{ start, end, punctuated_word, word }] }] },
    //   is_final: boolean,
    //   speech_final: boolean
    // }
    const alt = event?.channel?.alternatives?.[0];
    const transcript = typeof alt?.transcript === "string" ? alt.transcript.trim() : "";
    if (!transcript) return null;

    const words = Array.isArray(alt?.words) ? alt.words : [];
    const starts = words
      .map((w: any) => (typeof w?.start === "number" ? w.start : typeof w?.start === "string" ? Number(w.start) : NaN))
      .filter((n: number) => Number.isFinite(n));
    const ends = words
      .map((w: any) => (typeof w?.end === "number" ? w.end : typeof w?.end === "string" ? Number(w.end) : NaN))
      .filter((n: number) => Number.isFinite(n));

    if (starts.length && ends.length) {
      return {
        text: transcript,
        startSecond: Math.min(...starts),
        endSecond: Math.max(...ends),
      };
    }

    // Fallback: no word timestamps.
    return { text: transcript, startSecond: 0, endSecond: 0 };
  }, []);

  const parseGladiaTranscriptSegment = useCallback((event: any) => {
    // Gladia transcript message (docs):
    // {
    //   type: "transcript",
    //   data: {
    //     is_final: boolean,
    //     utterance: { text: string, start: number, end: number, language?: string, channel?: number }
    //   }
    // }
    const text = typeof event?.data?.utterance?.text === "string" ? event.data.utterance.text.trim() : "";
    if (!text) return null;

    const start = typeof event?.data?.utterance?.start === "number" ? event.data.utterance.start : Number(event?.data?.utterance?.start);
    const end = typeof event?.data?.utterance?.end === "number" ? event.data.utterance.end : Number(event?.data?.utterance?.end);

    if (Number.isFinite(start) && Number.isFinite(end)) {
      return { text, startSecond: Math.max(0, start), endSecond: Math.max(0, end) };
    }
    return { text, startSecond: 0, endSecond: 0 };
  }, []);

  const parseAssemblyAiTurnSegment = useCallback((event: any) => {
    // AssemblyAI Turn message (docs):
    // {
    //   type: "Turn",
    //   end_of_turn: boolean,
    //   transcript: string,
    //   words: [{ start, end, ... }]
    // }
    const text = typeof event?.transcript === "string" ? event.transcript.trim() : "";
    if (!text) return null;

    const words = Array.isArray(event?.words) ? event.words : [];
    const asNum = (v: any): number | undefined => {
      const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
      return Number.isFinite(n) ? n : undefined;
    };

    const toSeconds = (n: number): number => {
      // AssemblyAI word timings are commonly integers in milliseconds.
      // Heuristic:
      // - integers: treat as ms
      // - floats: treat as seconds
      if (Number.isInteger(n)) return n / 1000;
      return n;
    };

    const starts: number[] = [];
    const ends: number[] = [];
    for (const w of words) {
      const s = asNum(w?.start);
      const e = asNum(w?.end);
      if (typeof s === "number") starts.push(toSeconds(s));
      if (typeof e === "number") ends.push(toSeconds(e));
    }

    if (starts.length && ends.length) {
      return {
        text,
        startSecond: Math.max(0, Math.min(...starts)),
        endSecond: Math.max(0, Math.max(...ends)),
      };
    }

    return { text, startSecond: 0, endSecond: 0 };
  }, []);

  const stop = useCallback(async () => {
    if (stopInFlightRef.current) {
      await stopInFlightRef.current;
      return;
    }

    if (!sessionRef.current) {
      resetRealtimeSessionState();
      return;
    }

    // Immediately clear the ref so a subsequent `start()` isn't blocked if the user clicks quickly.
    const session = sessionRef.current;
    sessionRef.current = null;

    setRealtimeSessionState({ realtimeStatus: "stopping" });
    const p = (async () => {
      try {
        await session.stop();
      } finally {
        bufferRef.current = "";
        segmentsRef.current = new Map();
        sessionInfoRef.current = null;
        elevenCommitCounterRef.current = 0;
        deepgramCommitCounterRef.current = 0;
        gladiaCommitCounterRef.current = 0;
        assemblyAiCommitCounterRef.current = 0;
        resetRealtimeSessionState();
        stopInFlightRef.current = null;
      }
    })();
    stopInFlightRef.current = p;
    await p;
  }, [resetRealtimeSessionState, setRealtimeSessionState]);

  const start = useCallback(async () => {
    if (!canStart) return;
    if (sessionRef.current) return;
    if (!selectedModel) return;
    fatalErrorHandledRef.current = false;
    setRealtimeSessionState({
      realtimeStatus: "starting",
      realtimeError: null,
      realtimeActiveModel: selectedModel.id,
    });

    try {
      let merged = { ...(config?.headers ?? {}), ...(customHeaders ?? {}) } as Record<string, string>;
      if (config?.getAccessToken) {
        merged.Authorization = `Bearer ${await config.getAccessToken()}`;
      }

      const tokenClientFactory = await getRealtimeToken({
        baseUrl: config.baseUrl + config.endpoints.realtime,
        headers: merged,
      });

      const created = await transcriptions.add(
        `realtime-${new Date().toISOString()}`,
        new Blob([], { type: "application/octet-stream" }),
        {
          text: "",
          segments: [],
          language: undefined,
          durationInSeconds: undefined,
          warnings: [],
          response: {
            timestamp: new Date(),
            modelId: selectedModel.id,
            body: { kind: "realtime" },
          },
        }
      );

      setRealtimeSessionState({
        realtimeActiveTranscriptionId: created.id,
      });

        const session = await startRealtimeWebrtcSession({
          providerId: providerId ?? "",
          selectedModel: selectedModel.id,
          // NOTE: ElevenLabs backend does NOT need providerOptions; OpenAI does.
          getEphemeralToken: () =>
             tokenClientFactory(
              providerId === "elevenlabs" || providerId === "deepgram" || providerId === "gladia" || providerId === "assemblyai"
                 ? { model: selectedModel.id }
                 : {
                     model: selectedModel.id,
                     providerOptions: providerRealtimeMetadata,
                   }
             ),
          providerRealtimeMetadata,
          events: {
          // Parse raw events to build segments (start/end from speech events, text from completed transcript)
          onEvent: (event: any) => {
            try {
              if (providerId === "elevenlabs") {
                const mt = event?.message_type;
                if (mt === "committed_transcript_with_timestamps") {
                  const seg = parseElevenLabsTimestampSegments(event);
                  if (seg) {
                    const idx = ++elevenCommitCounterRef.current;
                    const key = `elevenlabs-${idx}`;
                    // Store as ms in segmentsRef to reuse computeSnapshot sorting logic.
                    segmentsRef.current.set(key, {
                      itemId: key,
                      text: seg.text,
                      startMs: seg.startSecond * 1000,
                      endMs: seg.endSecond * 1000,
                    });
                    if (created.id) {
                      // Persist immediately on committed chunks.
                      void persistUpdateNow(
                        created.id,
                        computeSnapshot({ preferText: bufferRef.current })
                      );
                    }
                  }
                }
                return;
              }

              if (providerId === "deepgram") {
                const type = event?.type;

                if (type === "Metadata") {
                  sessionInfoRef.current = event;
                  if (created.id) {
                    void persistUpdate(created.id, computeSnapshot({ preferText: bufferRef.current }));
                  }
                  return;
                }

                if (type === "Results") {
                  const isFinal = !!event?.is_final || !!event?.speech_final;
                  if (isFinal) {
                    const seg = parseDeepgramResultSegment(event);
                    if (seg) {
                      const idx = ++deepgramCommitCounterRef.current;
                      const key = `deepgram-${idx}`;
                      segmentsRef.current.set(key, {
                        itemId: key,
                        text: seg.text,
                        startMs: seg.startSecond * 1000,
                        endMs: seg.endSecond * 1000,
                      });
                      if (created.id) {
                        void persistUpdateNow(created.id, computeSnapshot({ preferText: bufferRef.current }));
                      }
                    }
                  }
                  return;
                }

                return;
              }

              if (providerId === "gladia") {
                const type = event?.type;

                // Gladia doesn't currently emit an explicit session metadata event in this client; but if it does,
                // keep it for persistence/debugging.
                if (type === "started" || type === "session_started" || type === "session.created") {
                  sessionInfoRef.current = event;
                  if (created.id) {
                    void persistUpdate(created.id, computeSnapshot({ preferText: bufferRef.current }));
                  }
                  return;
                }

                if (type === "transcript") {
                  const isFinal = !!event?.data?.is_final;
                  if (isFinal) {
                    const seg = parseGladiaTranscriptSegment(event);
                    if (seg) {
                      const idx = ++gladiaCommitCounterRef.current;
                      const key = `gladia-${idx}`;
                      segmentsRef.current.set(key, {
                        itemId: key,
                        text: seg.text,
                        startMs: seg.startSecond * 1000,
                        endMs: seg.endSecond * 1000,
                      });
                      if (created.id) {
                        void persistUpdateNow(created.id, computeSnapshot({ preferText: bufferRef.current }));
                      }
                    }
                  }
                  return;
                }

                return;
              }

              if (providerId === "assemblyai") {
                const type = event?.type;

                if (type === "Begin") {
                  sessionInfoRef.current = event;
                  if (created.id) {
                    void persistUpdate(created.id, computeSnapshot({ preferText: bufferRef.current }));
                  }
                  return;
                }

                if (type === "Turn") {
                  const isFinal = !!event?.end_of_turn;
                  if (isFinal) {
                    const seg = parseAssemblyAiTurnSegment(event);
                    if (seg) {
                      const idx = ++assemblyAiCommitCounterRef.current;
                      const key = `assemblyai-${idx}`;
                      segmentsRef.current.set(key, {
                        itemId: key,
                        text: seg.text,
                        startMs: seg.startSecond * 1000,
                        endMs: seg.endSecond * 1000,
                      });
                      if (created.id) {
                        void persistUpdateNow(created.id, computeSnapshot({ preferText: bufferRef.current }));
                      }
                    }
                  }
                  return;
                }

                if (type === "Termination") {
                  sessionInfoRef.current = event;
                  if (created.id) {
                    void persistUpdate(created.id, computeSnapshot({ preferText: bufferRef.current }));
                  }
                  return;
                }

                return;
              }

              const type = event?.type;
              const itemId = event?.item_id;
              if (!type || !itemId) return;

              if (type === "input_audio_buffer.speech_started") {
                const startMs = Number(event?.audio_start_ms);
                const existing: RealtimeSegmentDraft = segmentsRef.current.get(itemId) ?? { itemId };
                segmentsRef.current.set(itemId, {
                  ...existing,
                  startMs: isFinite(startMs) ? startMs : existing.startMs,
                });
              }

              if (type === "input_audio_buffer.speech_stopped") {
                const endMs = Number(event?.audio_end_ms);
                const existing: RealtimeSegmentDraft = segmentsRef.current.get(itemId) ?? { itemId };
                segmentsRef.current.set(itemId, {
                  ...existing,
                  endMs: isFinite(endMs) ? endMs : existing.endMs,
                });
              }

              if (type === "conversation.item.input_audio_transcription.completed") {
                const transcript = String(event?.transcript ?? "");
                const existing: RealtimeSegmentDraft = segmentsRef.current.get(itemId) ?? { itemId };
                segmentsRef.current.set(itemId, { ...existing, text: transcript });
              }

              // Persist whenever we learned something new about segments.
              if (created.id) void persistUpdate(created.id, computeSnapshot());
            } catch {
              // ignore
            }
          },
          onTranscriptText: (deltaText: string) => {
            // OpenAI emits deltas; ElevenLabs/Deepgram emit full-text snapshots (we pass the full text through).
            const next =
              providerId === "elevenlabs" || providerId === "deepgram" || providerId === "gladia" || providerId === "assemblyai"
                ? deltaText
                : (bufferRef.current + deltaText).trimStart();
            bufferRef.current = next;
            setRealtimeSessionState({ realtimeText: next, realtimeStatus: "connected" });

            if (created.id) {
              // For previews, debounce writes; but ensure ElevenLabs doesn't overwrite with empty text.
              void persistUpdate(created.id, computeSnapshot({ preferText: bufferRef.current }));
            }
          },
          onSessionCreated: (session: any) => {
            sessionInfoRef.current = session;
            if (created.id) void persistUpdate(created.id, computeSnapshot({ preferText: bufferRef.current }));
          },
          onError: (message: string, err?: unknown) => {
            // Fatal: stop mic + close WS. We also discard the transient transcription item.
            if (fatalErrorHandledRef.current) return;
            fatalErrorHandledRef.current = true;

            const full = `${message}${err ? ": " + describeError(err) : ""}`;
            setRealtimeSessionState({
              realtimeStatus: "error",
              realtimeError: full,
            });
            onErrorAlert?.(full);

            // Stop the underlying session and remove the item we created for this session.
            // We intentionally do NOT await here to keep the callback non-blocking.
            void (async () => {
              try {
                await stop();
              } finally {
                if (created.id) {
                  try {
                    await transcriptions.delete(created.id);
                  } catch {
                    // ignore
                  }
                }
              }
            })();
          },
        },
      });

      // If a fatal error arrived during startup (common with ElevenLabs invalid_request),
      // ensure we do NOT keep a live session around that would block subsequent starts.
      if (fatalErrorHandledRef.current) {
        try {
          await session.stop();
        } catch {
          // ignore
        }
        return;
      }

      sessionRef.current = session;

      // Only mark as connected if we didn't already receive a fatal error during startup.
      // (ElevenLabs can send `invalid_request` immediately after the socket opens, which may race
      // with this `start()` continuation.)
      if (!fatalErrorHandledRef.current) {
        setRealtimeSessionState({ realtimeStatus: "connected" });
      }
    } catch (e) {
      const message = getTranscriptionErrorMessage(e);
      setRealtimeSessionState({ realtimeStatus: "error", realtimeError: message });

      // Also bubble to page-level alerts when provided.
      onErrorAlert?.(message);
      await stop();
    }
  }, [
    canStart,
    config,
    customHeaders,
    persistUpdate,
    providerRealtimeMetadata,
    selectedModel,
    setRealtimeSessionState,
    stop,
    transcriptions,
    onErrorAlert,
    computeSnapshot,
    providerId,
  ]);

  // Stop when leaving the page / unmounting.
  useEffect(() => {
    return () => {
      void stop();
    };
  }, [stop]);

  return {
    start,
    stop,
    realtimeStatus,
    realtimeText,
    realtimeActiveTranscriptionId,
    canStart,
  };
}

