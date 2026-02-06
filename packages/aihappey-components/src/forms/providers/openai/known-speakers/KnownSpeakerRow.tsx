import React from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { AttachmentButton } from "../../../../buttons";
import { FileTags } from "../../../../fields";

export const KnownSpeakerRow: React.FC<{
  name: string;
  busy: boolean;
  recordingKey: string | null;
  isRecordingThis: boolean;
  recordingSupported: boolean;
  elapsedMs: number;
  formatTime: (ms: number) => string;
  sampleExists: boolean;
  sampleTagLabel?: string;
  onEdit: () => void;
  onDelete: () => void;
  onUploadSample?: (files: File[]) => void;
  onToggleRecording: () => void;
  onPreview?: () => void;
  onClearSample?: () => void;
  t: (key: string, params?: any) => string;
}> = ({
  name,
  busy,
  recordingKey,
  isRecordingThis,
  recordingSupported,
  elapsedMs,
  formatTime,
  sampleExists,
  sampleTagLabel,
  onEdit,
  onDelete,
  onUploadSample,
  onToggleRecording,
  onPreview,
  onClearSample,
  t,
}) => {
  const theme = useTheme();

  const sampleFileForTags = sampleTagLabel
    ? new File([], sampleTagLabel)
    : undefined;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: 12,
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ fontWeight: 600, flex: 1 }}>{name}</div>
        <theme.Button
          size="small"
          variant="subtle"
          icon="edit"
          disabled={busy || recordingKey != null}
          onClick={onEdit}
        />
        <theme.Button
          size="small"
          variant="subtle"
          icon="delete"
          disabled={busy || recordingKey != null}
          onClick={onDelete}
        />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <AttachmentButton
          disabled={busy || recordingKey != null || !onUploadSample}
          icon="attachment"
          onFilesSelected={onUploadSample ?? (() => undefined)}
        />

        <theme.Button
          type="button"
          size="small"
          variant={isRecordingThis ? "primary" : "transparent"}
          icon={isRecordingThis ? "stop" : "transcription"}
          title={t("transcriptionRecord")}
          disabled={
            busy ||
            (!isRecordingThis && (recordingKey != null || !recordingSupported))
          }
          onClick={onToggleRecording}
        >
          {isRecordingThis ? formatTime(elapsedMs) : undefined}
        </theme.Button>

        <theme.Button
          size="small"
          variant="subtle"
          icon="preview"
          disabled={!sampleExists || busy || recordingKey != null || !onPreview}
          onClick={onPreview ?? (() => undefined)}
          title={t("preview")}
        />

        <theme.Button
          size="small"
          variant="subtle"
          icon="dismiss"
          disabled={!sampleExists || busy || recordingKey != null || !onClearSample}
          onClick={onClearSample ?? (() => undefined)}
          title={t("delete")}
        />

        {sampleFileForTags && (
          <div style={{ flex: 1, minWidth: 220 }}>
            <FileTags
              size="extra-small"
              icon="speech"
              files={[sampleFileForTags]}
            />
          </div>
        )}

        {!sampleExists && (
          <div style={{ color: "rgba(0,0,0,0.6)" }}>
            {t("providers:openai.knownSpeakersSampleMissing")}
          </div>
        )}
      </div>
    </div>
  );
};

