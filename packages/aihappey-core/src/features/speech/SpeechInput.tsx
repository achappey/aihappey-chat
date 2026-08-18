import { AttachmentButton, FileTags, useTheme } from "aihappey-components";
import { defaultProviderSpeechMetadata, useAppStore } from "aihappey-state";
import { useTranslation } from "aihappey-i18n";
import { useFileAttachments, fileAttachmentRuntime } from "../../runtime/files/fileAttachmentRuntime";
import { SpeechSettingsButton } from "../speech-settings/SpeechSettingsButton";
import { useRef } from "react";
import { ResizableTextArea } from "../chat/input/ResizableTextArea";
import { usePromptDictationControls } from "../chat/input/usePromptDictationControls";

export const SpeechInput = ({
  onSend,
  selectedModel,
  value,
  onChange,
  onFilesSelected,
  disabled,
}: {
  onSend: (text: string) => Promise<void>;
  selectedModel: string;
  value: string;
  onChange: (next: string) => void;
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}) => {
  const { t } = useTranslation();
  const providerSpeechMetadata = useAppStore((s) => s.providerSpeechMetadata);
  const setProviderSpeechMetadata = useAppStore((s) => s.setProviderSpeechMetadata);
  const fileAttachments = useFileAttachments(fileAttachmentRuntime)
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { Button, TextArea } = useTheme();
  const { dictationButton, dictationError } = usePromptDictationControls({
    value,
    onChange,
    textareaRef,
    disabled,
  });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    // Do NOT clear the prompt after generation; keep it in the text area.
    await onSend(value.trim());
  };


  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h1>{t('speech')}</h1>

      {/* TAG ROW  */}
      {attachmentsElement}
      {/* FIRST ROW – TEXT INPUT */}

      <ResizableTextArea
        TextArea={TextArea as any}
        textareaRef={textareaRef}
        value={value}
        autoFocus
        onChange={onChange}
        placeholder={t("speechPromptPlaceholder")}
        style={styles.textArea}
      />

      <div style={styles.buttonRow}>
        <div style={styles.leftGroup}>
          <SpeechSettingsButton
            providerMetadata={providerSpeechMetadata}
            setProviderMetadata={setProviderSpeechMetadata}
            selectedModel={selectedModel}
            resetDefaults={() =>
              setProviderSpeechMetadata(defaultProviderSpeechMetadata)
            }
          />

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
          disabled={disabled || value?.length < 1}
          icon="send"
        />

      </div>

      {dictationError}

      <div style={{ marginTop: 44 }}>
        <h2>{t('mySpeechFiles')}</h2>
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
