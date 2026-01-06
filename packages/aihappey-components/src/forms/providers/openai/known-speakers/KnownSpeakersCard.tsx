import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type { OpenAIITranscriptionConfig } from "../OpenAIITranscriptionConfigForm";
import { KnownSpeakerEditor } from "./KnownSpeakerEditor";
import { KnownSpeakerRow } from "./KnownSpeakerRow";

export type KnownSpeakerSampleInfo = {
  exists: boolean;
  tagLabel?: string;
};

export type KnownSpeakerSampleHandlers = {
  /**
   * Return info about whether a sample exists for a given speaker name.
   * Used only for rendering (eg preview/delete enablement + tag label).
   */
  getSampleInfo?: (speakerName: string) => KnownSpeakerSampleInfo;

  /** Persist a sample (first file wins). */
  onUploadSample?: (speakerName: string, files: File[]) => Promise<void> | void;

  /** Remove sample(s) for the given speaker name. */
  onClearSample?: (speakerName: string) => Promise<void> | void;

  /** Migrate sample(s) when renaming a speaker name. */
  onRenameSample?: (
    fromSpeakerName: string,
    toSpeakerName: string
  ) => Promise<void> | void;

  /** Optional: play/preview the latest stored sample. */
  onPreviewSample?: (speakerName: string) => Promise<void> | void;
};

const sanitizeKnownSpeakerNameLocal = (name: string): string => {
  return (name ?? "")
    .trim()
    // collapse whitespace
    .replace(/\s+/g, " ")
    // avoid path-like characters
    .replace(/[\\/]/g, "-")
    // avoid characters that are often reserved in filenames
    .replace(/[<>:\"|?*]/g, "");
};

export const KnownSpeakersCard: React.FC<{
  config: OpenAIITranscriptionConfig;
  updateConfig: (val: OpenAIITranscriptionConfig) => void;
} & KnownSpeakerSampleHandlers> = ({
  config,
  updateConfig,
  getSampleInfo,
  onUploadSample,
  onClearSample,
  onRenameSample,
  onPreviewSample,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draftName, setDraftName] = useState<string>("");
  const [speakerError, setSpeakerError] = useState<string | null>(null);
  const [speakerBusy, setSpeakerBusy] = useState<Record<string, boolean>>({});

  const [recordingKey, setRecordingKey] = useState<string | null>(null);
  const [recordError, setRecordError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startAtRef = useRef<number>(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  const speakerNames = useMemo(() => {
    const n = config?.known_speaker_names;
    return Array.isArray(n) ? n : [];
  }, [config?.known_speaker_names]);

  const recordingSupported =
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined";

  const pickMimeType = () => {
    if (typeof MediaRecorder === "undefined") return undefined;
    const candidates = ["audio/webm", "audio/ogg"];
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

  // timer updates
  useEffect(() => {
    if (!recordingKey) return;
    const id = window.setInterval(() => {
      setElapsedMs(Date.now() - startAtRef.current);
    }, 250);
    return () => window.clearInterval(id);
  }, [recordingKey]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        recorderRef.current?.stop();
      } catch {
        // ignore
      }
      recorderRef.current = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const setBusy = (key: string, val: boolean) =>
    setSpeakerBusy((prev) => ({ ...prev, [key]: val }));

  const validateAndNormalizeName = (name: string, ignoreIndex?: number) => {
    const normalized = sanitizeKnownSpeakerNameLocal(name);
    if (!normalized)
      return { ok: false as const, value: "", err: t("required") };
    const lower = normalized.toLowerCase();
    const clash = speakerNames.some((n, i) =>
      i === ignoreIndex
        ? false
        : sanitizeKnownSpeakerNameLocal(n).toLowerCase() === lower
    );
    if (clash)
      return {
        ok: false as const,
        value: normalized,
        err: t("providers:openai.knownSpeakersNameExists"),
      };
    if (speakerNames.length >= 4 && ignoreIndex == null) {
      return {
        ok: false as const,
        value: normalized,
        err: t("providers:openai.knownSpeakersMax"),
      };
    }
    return { ok: true as const, value: normalized, err: null };
  };

  const beginAdd = () => {
    setSpeakerError(null);
    setEditingIndex(speakerNames.length);
    setDraftName("");
  };

  const beginEdit = (idx: number) => {
    setSpeakerError(null);
    setEditingIndex(idx);
    setDraftName(speakerNames[idx] ?? "");
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setDraftName("");
    setSpeakerError(null);
  };

  const commitEdit = async () => {
    if (editingIndex == null) return;
    const isNew = editingIndex >= speakerNames.length;
    const v = validateAndNormalizeName(
      draftName,
      isNew ? undefined : editingIndex
    );
    if (!v.ok) {
      setSpeakerError(v.err);
      return;
    }

    const next = [...speakerNames];
    if (isNew) {
      next.push(v.value);
      updateConfig({ ...config, known_speaker_names: next });
      cancelEdit();
      return;
    }

    const oldName = speakerNames[editingIndex];
    if (sanitizeKnownSpeakerNameLocal(oldName) === v.value) {
      // no-op
      cancelEdit();
      return;
    }

    // migrate stored sample mapping-by-name
    const busyKey = `rename:${oldName}`;
    setBusy(busyKey, true);
    try {
      await onRenameSample?.(oldName, v.value);
    } catch (e: any) {
      setSpeakerError(e?.message ?? String(e));
      return;
    } finally {
      setBusy(busyKey, false);
    }

    next[editingIndex] = v.value;
    updateConfig({ ...config, known_speaker_names: next });
    cancelEdit();
  };

  const deleteSpeaker = async (idx: number) => {
    const name = speakerNames[idx];
    if (!name) return;
    const hasSample = !!getSampleInfo?.(name)?.exists;
    if (hasSample) {
      const ok = window.confirm(
        t("providers:openai.knownSpeakersDeleteConfirm")
      );
      if (!ok) return;
    }

    const busyKey = `delete:${name}`;
    setBusy(busyKey, true);
    try {
      await onClearSample?.(name);
    } finally {
      setBusy(busyKey, false);
    }

    const next = speakerNames.filter((_, i) => i !== idx);
    updateConfig({
      ...config,
      known_speaker_names: next.length ? next : undefined,
    });
    if (editingIndex != null) cancelEdit();
  };

  const saveSampleFiles = async (speakerName: string, selected: File[]) => {
    if (!selected.length) return;
    const busyKey = `sample:${speakerName}`;
    setBusy(busyKey, true);
    setRecordError(null);
    try {
      await onUploadSample?.(speakerName, selected);
    } finally {
      setBusy(busyKey, false);
    }
  };

  const clearSample = async (speakerName: string) => {
    const busyKey = `sample:${speakerName}`;
    setBusy(busyKey, true);
    try {
      await onClearSample?.(speakerName);
    } finally {
      setBusy(busyKey, false);
    }
  };

  const startRecording = async (speakerName: string) => {
    setRecordError(null);
    if (!recordingSupported) {
      setRecordError(t("transcriptionRecordingUnsupported"));
      return;
    }
    if (recordingKey) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (ev: BlobEvent) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };

      recorder.onerror = () => {
        setRecordError(t("transcriptionRecordingFailed"));
      };

      recorder.onstop = async () => {
        // stop tracks
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        const blobType = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: blobType });
        chunksRef.current = [];

        if (blob.size === 0) {
          setRecordError(t("transcriptionRecordingEmpty"));
          return;
        }

        const durationMs = Date.now() - startAtRef.current;
        const seconds = durationMs / 1000;
        if (seconds < 2 || seconds > 10) {
          setRecordError(t("providers:openai.knownSpeakersSampleDuration"));
          return;
        }

        const ext = blobType.includes("ogg")
          ? "ogg"
          : blobType.includes("wav")
            ? "wav"
            : "webm";
        const file = new File([blob], `recording-${Date.now()}.${ext}`, {
          type: blobType,
        });

        try {
          await saveSampleFiles(speakerName, [file]);
        } catch (e: any) {
          setRecordError(e?.message ?? String(e));
        }
      };

      startAtRef.current = Date.now();
      setElapsedMs(0);
      setRecordingKey(speakerName);
      recorder.start(250);
    } catch {
      setRecordError(t("microphonePermissionDenied"));
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    if (recorder.state === "inactive") return;
    recorder.stop();
    recorderRef.current = null;
    setRecordingKey(null);
  };

  const playLatestSample = async (speakerName: string) => {
    await onPreviewSample?.(speakerName);
  };

  return (
    <theme.Card
      size="small"
      title={t("providers:openai.knownSpeakersTitle")}
      description={t("providers:openai.knownSpeakersDescription")}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {speakerError && <div style={{ color: "#b00020" }}>{speakerError}</div>}

        {speakerNames.map((name, idx) => {
          const busy =
            !!speakerBusy[`delete:${name}`] ||
            !!speakerBusy[`sample:${name}`] ||
            !!speakerBusy[`rename:${name}`];
          const sample = getSampleInfo?.(name);
          const isRecordingThis = recordingKey === name;

          return (
            <KnownSpeakerRow
              key={`${name}-${idx}`}
              name={name}
              busy={busy}
              recordingKey={recordingKey}
              isRecordingThis={isRecordingThis}
              recordingSupported={recordingSupported}
              elapsedMs={elapsedMs}
              formatTime={formatTime}
              sampleExists={!!sample?.exists}
              sampleTagLabel={sample?.tagLabel}
              onEdit={() => beginEdit(idx)}
              onDelete={() => void deleteSpeaker(idx)}
              onUploadSample={
                onUploadSample ? (fs) => void saveSampleFiles(name, fs) : undefined
              }
              onToggleRecording={
                isRecordingThis
                  ? stopRecording
                  : () => void startRecording(name)
              }
              onPreview={
                onPreviewSample ? () => void playLatestSample(name) : undefined
              }
              onClearSample={onClearSample ? () => void clearSample(name) : undefined}
              t={t}
            />
          );
        })}

        {editingIndex != null && (
          <KnownSpeakerEditor
            draftName={draftName}
            setDraftName={setDraftName}
            onSave={() => void commitEdit()}
            onCancel={cancelEdit}
            t={t}
          />
        )}

        {recordError && <div style={{ color: "#b00020" }}>{recordError}</div>}

        <div>
          <theme.Button
            size="small"
            variant="subtle"
            icon="add"
            disabled={
              speakerNames.length >= 4 ||
              editingIndex != null ||
              recordingKey != null
            }
            onClick={beginAdd}
          >
            {t("providers:openai.knownSpeakersAdd")}
          </theme.Button>
        </div>
      </div>
    </theme.Card>
  );
};

