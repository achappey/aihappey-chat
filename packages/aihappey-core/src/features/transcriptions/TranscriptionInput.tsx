import { AttachmentButton, FileTags, TranscriptionSettingsButton, useTheme } from "aihappey-components";
import { defaultProviderTranscriptionMetadata, useAppStore } from "aihappey-state";
import { useTranslation } from "aihappey-i18n";
import { useFileAttachments, fileAttachmentRuntime } from "../../runtime/files/fileAttachmentRuntime";
import { addFilesToRuntime } from "../chat/input/MessageInput";
import { useEffect, useMemo, useRef, useState } from "react";
import { DictateWarningModal } from "./components/DictateWarningModal";

export type KnownSpeakerSamplesBinding = {
  getSampleInfo?: (speakerName: string) => { exists: boolean; tagLabel?: string };
  onUploadSample?: (speakerName: string, files: File[]) => Promise<void> | void;
  onClearSample?: (speakerName: string) => Promise<void> | void;
  onRenameSample?: (fromSpeakerName: string, toSpeakerName: string) => Promise<void> | void;
  onPreviewSample?: (speakerName: string) => Promise<void> | void;
};

type TranscriptionInputProps = {
  disabled?: boolean;
  onFilesSelected?: (files: File[]) => Promise<void> | void;
  knownSpeakerSamples?: KnownSpeakerSamplesBinding;

  // Realtime transcription controls (optional)
  realtime?: {
    canStart?: boolean;
    status?: "idle" | "starting" | "connected" | "stopping" | "error";
    onStart?: () => void;
    onStop?: () => void;
  };
};

const DICTATE_WARNING_SKIP_STORAGE_KEY = "aihappey:transcription:skipDictateWarning";

export const TranscriptionInput = (props: TranscriptionInputProps) => {
  const { t } = useTranslation();
  const { Button } = useTheme();
  const providerTranscriptionMetadata = useAppStore((s) => s.providerTranscriptionMetadata);
  const setProviderTranscriptionMetadata = useAppStore((s) => s.setProviderTranscriptionMetadata);
  const providerRealtimeMetadata = useAppStore((s) => s.providerRealtimeMetadata);
  const setProviderRealtimeMetadata = useAppStore((s) => s.setProviderRealtimeMetadata);
  const fileAttachments = useFileAttachments(fileAttachmentRuntime)
  const enabledProviders = useAppStore((a) => a.enabledProvidersByType?.transcription ?? []);

  const [recording, setRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [showDictateWarning, setShowDictateWarning] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startAtRef = useRef<number>(0);

  const recordingSupported = typeof window !== "undefined"
    && typeof navigator !== "undefined"
    && !!navigator.mediaDevices?.getUserMedia
    && typeof MediaRecorder !== "undefined";

  const pickMimeType = () => {
    if (typeof MediaRecorder === "undefined") return undefined;
    const candidates = [
      //  "audio/webm;codecs=opus",
      "audio/webm",
      //   "audio/ogg;codecs=opus",
      //  "audio/ogg",
    ];

    for (const mt of candidates) {
      if (MediaRecorder.isTypeSupported(mt)) return mt;
    }
    return undefined;
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const elapsedLabel = useMemo(() => formatTime(elapsedMs), [elapsedMs]);

  const stopTracks = (stream: MediaStream | null) => {
    stream?.getTracks().forEach((t) => t.stop());
  };

  const startRecordingInternal = async () => {
    setRecordError(null);

    if (!recordingSupported) {
      setRecordError(t("transcriptionRecordingUnsupported"));
      return;
    }

    if (recording) return;
    if (props.disabled) return;

    // clear previous preview
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);

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

      recorder.onerror = () => {
        setRecordError(t("transcriptionRecordingFailed"));
      };

      recorder.onstop = async () => {
        const streamToStop = streamRef.current;
        stopTracks(streamToStop);
        streamRef.current = null;

        const blobType = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: blobType });
        chunksRef.current = [];

        if (blob.size === 0) {
          setRecordError(t("transcriptionRecordingEmpty"));
          return;
        }

        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);

        const safeType = "audio/webm";
        const ext = safeType.includes("ogg") ? "ogg" : safeType.includes("wav") ? "wav" : "webm";
        const file = new File([blob], `recording-${Date.now()}.${ext}`, {
          type: safeType,
        });

        try {
          await props.onFilesSelected?.([file]);
        } catch {
          setRecordError(t("transcriptionRecordingSendFailed"));
        }
      };

      startAtRef.current = Date.now();
      setElapsedMs(0);
      setRecording(true);
      recorder.start(250);
    } catch {
      setRecordError(t("microphonePermissionDenied"));
      stopTracks(streamRef.current);
      streamRef.current = null;
    }
  };

  const shouldSkipDictateWarning = () => {
    if (typeof window === "undefined") return true;
    try {
      return window.localStorage.getItem(DICTATE_WARNING_SKIP_STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  };

  const persistSkipDictateWarning = (skip: boolean) => {
    if (typeof window === "undefined") return;
    try {
      if (skip) {
        window.localStorage.setItem(DICTATE_WARNING_SKIP_STORAGE_KEY, "1");
      } else {
        window.localStorage.removeItem(DICTATE_WARNING_SKIP_STORAGE_KEY);
      }
    } catch {
      // ignore storage issues
    }
  };

  const handleRecordClick = () => {
    if (recording || props.disabled) return;

    if (shouldSkipDictateWarning()) {
      void startRecordingInternal();
      return;
    }

    setShowDictateWarning(true);
  };

  const handleConfirmDictateWarning = (dontShowAgain: boolean) => {
    persistSkipDictateWarning(dontShowAgain);
    setShowDictateWarning(false);
    void startRecordingInternal();
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
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const attachmentsElement =
    fileAttachments.length > 0 ? (
      <div style={styles.tagRow}>
        {fileAttachments.length > 0 && (
          <FileTags
            icon="transcription"
            files={fileAttachments}
            removeFile={(a) => fileAttachmentRuntime.remove(a)}
          />
        )}
      </div>
    ) : null;

  return (
    <div style={styles.form}>
      <h1>{t('transcriptions')}</h1>

      {/* TAG ROW  */}
      {attachmentsElement}
      {/* FIRST ROW – TEXT INPUT */}
      <div style={{ height: 52 }}>
        {t('transcriptionDropPlaceholder')}
      </div>

      <div style={styles.buttonRow}>
        <div style={styles.leftGroup}>

          <TranscriptionSettingsButton
            enabledProviders={enabledProviders}
            realtimeProviderMetadata={providerRealtimeMetadata}
            setRealtimeProviderMetadata={setProviderRealtimeMetadata}
            providerMetadata={providerTranscriptionMetadata}
            setProviderMetadata={setProviderTranscriptionMetadata}
            resetDefaults={() => setProviderTranscriptionMetadata(defaultProviderTranscriptionMetadata)}
            knownSpeakerSamples={props.knownSpeakerSamples}
          />

          <AttachmentButton
            disabled={props.disabled}
            icon="attachment"
            onFilesSelected={props.onFilesSelected ?? addFilesToRuntime}
          />

          <Button
            type="button"
            size="large"
            title={t('transcriptionRecord')}
            variant={recording ? "primary" : "transparent"}
            icon={recording ? "stop" : "transcription"}
            disabled={recording ? false : props.disabled || !recordingSupported}
            onClick={recording ? stopRecording : handleRecordClick}
          >
            {recording ? elapsedLabel : undefined}
          </Button>

          {props.realtime?.onStart && (
            <Button
              type="button"
              size="large"
              title={props.realtime.status === "connected" ? t('stop') : t('realtime')}
              variant={props.realtime.status === "connected" ? "primary" : "transparent"}
              icon={props.realtime.status === "connected" ? "stop" : "realtime"}
              disabled={
                props.disabled
                || props.realtime.status === "starting"
                || props.realtime.status === "stopping"
                || !props.realtime.canStart
              }
              onClick={props.realtime.status === "connected" ? props.realtime.onStop : props.realtime.onStart}
            >
            </Button>
          )}
        </div>
      </div>

      <DictateWarningModal
        open={showDictateWarning}
        onClose={() => setShowDictateWarning(false)}
        onConfirm={handleConfirmDictateWarning}
      />

      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
        {recordError && (
          <div style={{ color: "#b00020" }}>
            {recordError}
          </div>
        )}
      </div>

      <div style={{ marginTop: 44 }}>
        <h2>{t('myTranscriptions')}</h2>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  form: {
    maxWidth: 1056,
    margin: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    width: "100%",
  },
  tagRow: {
    display: "flex",
    gap: 8,
    marginBottom: 4,
    width: "100%",
  },
  textArea: {
    resize: "vertical",
    maxHeight: 120,
    flex: 1,
  },
  buttonRow: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    gap: 8,
  },
  leftGroup: {
    display: "flex",
    gap: 8,
    flex: 1,
  },
};
