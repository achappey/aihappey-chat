import { AttachmentButton, FileTags, useTheme } from "aihappey-components";
import { useCallback, useRef, type CSSProperties, type KeyboardEvent } from "react";
import { useTranslation } from "aihappey-i18n";
import { useChatFileDrop } from "../chat/input/useChatFileDrop";

type PlaygroundInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  sendDisabled: boolean;
  attachmentsDisabled: boolean;
  streaming: boolean;
  error?: string;
  attachments: File[];
  onAddAttachments: (files: File[]) => void;
  onRemoveAttachment: (name: string) => void;
};

export const PlaygroundInput = ({
  value,
  onChange,
  onSend,
  sendDisabled,
  attachmentsDisabled,
  streaming,
  error,
  attachments,
  onAddAttachments,
  onRemoveAttachment,
}: PlaygroundInputProps) => {
  const { Button, Text, TextArea, Spinner } = useTheme();
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isOver, dropRef, handleDrop, handleDragOver } = useChatFileDrop(
    (file) => onAddAttachments([file]),
    onAddAttachments,
  );
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) dropRef(node);
  }, [dropRef]);

  const resizeTextarea = () => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    const newHeight = Math.min(textareaRef.current.scrollHeight, 100);
    textareaRef.current.style.height = `${newHeight}px`;
  };

  const handleChange = (nextValue: string) => {
    onChange(nextValue);
    window.setTimeout(resizeTextarea, 0);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!sendDisabled) onSend();
    }
  };

  const attachmentsElement = attachments.length > 0 ? (
    <div style={styles.tagRow}>
      <FileTags
        files={attachments}
        removeFile={onRemoveAttachment}
      />
    </div>
  ) : null;

  return (
    <div
      ref={containerRef}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      style={{
        ...styles.container,
        ...(isOver ? styles.containerDragOver : undefined),
      }}
    >
      {attachmentsElement}

      <TextArea
        ref={textareaRef}
        value={value}
        autoFocus
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={t("promptPlaceholder")}
        style={styles.textArea}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <div style={styles.buttonRow}>
        <div style={styles.leftGroup}>
          <AttachmentButton
            disabled={attachmentsDisabled}
            icon="attachment"
            onFilesSelected={onAddAttachments}
          />
          {isOver ? <Text style={styles.dropHint}>{t("attachments")}</Text> : null}
        </div>

        {streaming ? (
          <div style={styles.streamingIndicator}>
            <Spinner />
          </div>
        ) : null}
        <Button
          onClick={onSend}
          disabled={sendDisabled}
          size="large"
          icon="send"
        />
      </div>
    </div>
  );
};

const styles: Record<string, CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    border: "1px solid transparent",
    borderRadius: 8,
    padding: 8,
    transition: "border-color 120ms ease, background-color 120ms ease",
  },
  containerDragOver: {
    borderColor: "var(--aihappey-color-border-accent, #5b5fc7)",
    backgroundColor: "rgba(91, 95, 199, 0.06)",
  },
  tagRow: {
    display: "flex",
    gap: 8,
    width: "100%",
  },
  textArea: {
    resize: "vertical",
    maxHeight: 120,
    flex: 1,
  },
  buttonRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
  },
  leftGroup: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  streamingIndicator: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  error: {
    color: "#d13438",
  },
  dropHint: {
    opacity: 0.7,
    fontSize: 12,
  },
};

export default PlaygroundInput;
