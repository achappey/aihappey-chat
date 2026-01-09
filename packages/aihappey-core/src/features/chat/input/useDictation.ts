import { useEffect, useMemo, useRef, useState } from "react";
import { useChatContext } from "../context/ChatContext";
import { useAppStore } from "aihappey-state";
import { useTranslation } from "aihappey-i18n";
import { createTranscriptionProvider, TranscriptionResponse } from "aihappey-ai";
import { fileToBase64 } from "../files/file";

export type UseDictationOptions = {
  disabled?: boolean;
  /**
   * If provided, called with the returned transcript text (already trimmed).
   */
  onTranscript?: (text: string) => void;
};

const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const stopTracks = (stream: MediaStream | null) => {
  stream?.getTracks().forEach((t) => t.stop());
};

const pickMimeType = () => {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    // Prefer webm because it is widely supported and used elsewhere in the app.
    "audio/webm",
  ];
  for (const mt of candidates) {
    if (MediaRecorder.isTypeSupported(mt)) return mt;
  }
  return undefined;
};

const getTranscriptText = (result: unknown): string | undefined => {
  const r = result as Partial<TranscriptionResponse> | undefined;
  if (!r) return undefined;
  if (typeof r.text === "string") return r.text;
  return undefined;
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

const safeBool = (v: any) => !!v;

export function useDictation(options: UseDictationOptions) {
  const { t } = useTranslation();
  const { config } = useChatContext();
  const customHeaders = useAppStore((s) => s.customHeaders);
  const userPreferredTranscriptionModel = useAppStore((s) => s.userPreferredTranscriptionModel);

  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startAtRef = useRef<number>(0);

  const recordingSupported = typeof window !== "undefined"
    && typeof navigator !== "undefined"
    && !!navigator.mediaDevices?.getUserMedia
    && typeof MediaRecorder !== "undefined";

  const elapsedLabel = useMemo(() => formatTime(elapsedMs), [elapsedMs]);

  const resolvedModelId = useMemo(() => {
    if (userPreferredTranscriptionModel) return userPreferredTranscriptionModel;
    // Fallback only when Entra / getAccessToken is configured.
    if (config?.getAccessToken) return "openai/gpt-4o-mini-transcribe-2025-12-15";
    return "";
  }, [config?.getAccessToken, userPreferredTranscriptionModel]);

  const transcriptionEnabled = !!resolvedModelId;

  const transcribeBlob = async (blob: Blob, mimeType: string) => {
    if (!transcriptionEnabled) {
      setError(t("transcriptionRecordingSendFailed"));
      return;
    }

    setTranscribing(true);

    const requestId = `dictation_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    try {
      // DIAGNOSTIC LOGGING (to investigate random failures)
      // Note: do NOT log tokens. Only log presence/absence.
      console.info("[dictation] transcribe start", {
        requestId,
        resolvedModelId,
        blobSize: blob.size,
        blobType: blob.type,
        recorderMimeType: mimeType,
        transcriptionEnabled,
        hasGetAccessToken: safeBool(config?.getAccessToken),
        baseUrl: (config?.api?.replace("/api/chat", "") ?? "") || "(empty)",
      });

      let merged = { ...(config?.headers ?? {}), ...(customHeaders ?? {}) } as Record<string, string>;
      if (config?.getAccessToken) {
        try {
          const token = await config.getAccessToken();
          merged.Authorization = `Bearer ${token}`;
          console.info("[dictation] token acquired", {
            requestId,
            tokenPresent: !!token,
            tokenLength: token?.length,
          });
        } catch (e) {
          console.error("[dictation] token acquisition failed", {
            requestId,
            error: describeError(e),
          });
          throw e;
        }
      }

      const provider = createTranscriptionProvider({
        baseUrl: config?.api?.replace("/api/chat", "") ?? "",
        headers: merged,
      });

      const model = provider.transcriptionModel(resolvedModelId);

      const file = new File([blob], `recording-${Date.now()}.webm`, { type: "audio/webm" });
      let audioBase64: string;
      try {
        audioBase64 = await fileToBase64(file);
        console.info("[dictation] base64 encoded", {
          requestId,
          base64Length: audioBase64.length,
        });
      } catch (e) {
        console.error("[dictation] base64 encoding failed", {
          requestId,
          fileSize: file.size,
          fileType: file.type,
          error: describeError(e),
        });
        throw e;
      }

      const result = await model.doGenerate({
        audio: audioBase64,
        mediaType: "audio/webm",
        // Use default provider options for chat dictation.
        providerOptions: undefined,
      });

      const text = getTranscriptText(result)?.trim();
      if (text) options.onTranscript?.(text);
      console.info("[dictation] transcribe success", {
        requestId,
        transcriptChars: text?.length ?? 0,
      });
    } catch (e) {
      console.error("[dictation] transcribe failed", {
        requestId,
        error: describeError(e),
      });

      // Keep user-facing message but include a short diagnostic tail.
      const detail = describeError(e);
      setError(`${t("transcriptionRecordingSendFailed")} (${detail})`);
    } finally {
      setTranscribing(false);
    }
  };

  const startRecording = async () => {
    setError(null);

    if (options.disabled) return;
    if (!recordingSupported) {
      setError(t("transcriptionRecordingUnsupported"));
      return;
    }
    if (!transcriptionEnabled) {
      // No model available; treat as unsupported from user perspective.
      setError(t("transcriptionRecordingSendFailed"));
      return;
    }
    if (recording) return;
    if (transcribing) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (ev: BlobEvent) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };

      recorder.onerror = (ev) => {
        setError(t("transcriptionRecordingFailed") + ev.error);
      };

      recorder.onstop = async () => {
        const streamToStop = streamRef.current;
        stopTracks(streamToStop);
        streamRef.current = null;

        const blobType = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: blobType });
        chunksRef.current = [];

        if (blob.size === 0) {
          setError(t("transcriptionRecordingEmpty"));
          return;
        }

        await transcribeBlob(blob, blobType);
      };

      startAtRef.current = Date.now();
      setElapsedMs(0);
      setRecording(true);
      recorder.start(250);
    } catch {
      setError(t("microphonePermissionDenied"));
      stopTracks(streamRef.current);
      streamRef.current = null;
    }
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    if (recorder.state === "inactive") return;
    recorder.stop();
    recorderRef.current = null;
    setRecording(false);
  };

  // timer updates
  useEffect(() => {
    if (!recording) return;
    const id = window.setInterval(() => {
      setElapsedMs(Date.now() - startAtRef.current);
    }, 250);
    return () => window.clearInterval(id);
  }, [recording]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        recorderRef.current?.stop();
      } catch {
        // ignore
      }
      recorderRef.current = null;
      stopTracks(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  return {
    recordingSupported,
    transcriptionEnabled,
    recording,
    transcribing,
    elapsedLabel,
    error,
    startRecording,
    stopRecording,
    clearError: () => setError(null),
  };
}

