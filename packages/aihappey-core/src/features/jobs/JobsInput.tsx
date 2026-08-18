import React, { useRef } from "react";
import { AttachmentButton, FileTags, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { ResizableTextArea } from "../chat/input/ResizableTextArea";
import { usePromptDictationControls } from "../chat/input/usePromptDictationControls";

export const JobsInput = ({
  value,
  onChange,
  onSend,
  files,
  onFilesSelected,
  onRemoveFile,
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  onSend: (text: string) => Promise<void>;
  files: File[];
  onFilesSelected: (files: File[]) => void;
  onRemoveFile: (name: string) => void;
  disabled?: boolean;
}) => {
  const { Button, TextArea } = useTheme();
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { dictationButton, dictationError } = usePromptDictationControls({
    value,
    onChange,
    textareaRef,
    disabled,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() && files.length === 0) return;
    await onSend(value.trim());
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h1>{t("jobs", "Jobs")}</h1>

      {files.length > 0 && (
        <div style={styles.tagRow}>
          <FileTags
            icon="attachment"
            files={files}
            removeFile={onRemoveFile}
          />
        </div>
      )}

      <ResizableTextArea
        TextArea={TextArea as any}
        textareaRef={textareaRef}
        value={value}
        autoFocus
        onChange={onChange}
        placeholder={t("jobsPromptPlaceholder", "Ask an agent to run a background job")}
        style={styles.textArea}
      />

      <div style={styles.buttonRow}>
        <div style={styles.leftGroup}>
          <AttachmentButton
            icon="attachment"
            onFilesSelected={onFilesSelected}
            disabled={disabled}
          />
        </div>

        {dictationButton}

        <Button
          type="submit"
          size="large"
          disabled={disabled || (!value.trim() && files.length === 0)}
          icon="send"
        />
      </div>

      {dictationError}

      <div style={{ marginTop: 44 }}>
        <h2>{t("myJobs", "My jobs")}</h2>
      </div>
    </form>
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
    resize: "none",
    width: "100%",
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

