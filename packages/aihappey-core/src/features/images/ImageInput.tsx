import { AttachmentButton, FileTags, useTheme } from "aihappey-components";
import { useAppStore } from "aihappey-state";
import { useTranslation } from "aihappey-i18n";
import { UseMessageInputOptions } from "../chat/input/useMessageInput";
import { useFileAttachments, fileAttachmentRuntime } from "../../runtime/files/fileAttachmentRuntime";
import { useImageInput } from "./useImageInput";
import { ImageSettingsButton } from "../image-settings/ImageSettingsButton";
import { addFilesToRuntime } from "../chat/input/MessageInput";
import { ResizableTextArea } from "../chat/input/ResizableTextArea";
import { usePromptDictationControls } from "../chat/input/usePromptDictationControls";

export const ImageInput = (props: UseMessageInputOptions) => {
  const { Button, TextArea } = useTheme();
  const { t } = useTranslation();
  const providerImageMetadata = useAppStore((s) => s.providerImageMetadata);
  const setProviderImageMetadata = useAppStore((s) => s.setProviderImageMetadata);

  const {
    value,
    setValue,
    textareaRef,
    handleChange,
    handleKeyDown,
    handlePaste,
    handleSubmit,
    canSend,
  } = useImageInput(props);

  const { dictationButton, dictationError } = usePromptDictationControls({
    value,
    onChange: setValue,
    textareaRef,
    disabled: props.disabled || props.streaming,
  });

  const fileAttachments = useFileAttachments(fileAttachmentRuntime)

  const attachmentsElement =
    fileAttachments.length > 0 ? (
      <div style={styles.tagRow}>
        {fileAttachments.length > 0 && (
          <FileTags
            icon="image"
            files={fileAttachments}
            removeFile={(a) => fileAttachmentRuntime.remove(a)}
          />
        )}
      </div>
    ) : null;

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h1>{t('images')}</h1>

      {/* TAG ROW  */}
      {attachmentsElement}
      {/* FIRST ROW – TEXT INPUT */}
      <ResizableTextArea
        TextArea={TextArea as any}
        textareaRef={textareaRef}
        value={value}
        autoFocus
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={t("imagePromptPlaceholder")}
        style={styles.textArea}
      />

      <div style={styles.buttonRow}>
        <div style={styles.leftGroup}>
          <ImageSettingsButton
            providerMetadata={providerImageMetadata}
            setProviderMetadata={setProviderImageMetadata} />

          <AttachmentButton
            disabled={props.disabled}
            icon="attachment"
            onFilesSelected={addFilesToRuntime}
          />
        </div>

        {dictationButton}

        <Button
          type="submit"
          size="large"
          disabled={props.disabled || !canSend}
          icon="send"
        />
      </div>

      {dictationError}

      <div style={{ marginTop: 44 }}>
        <h2>{t('myImages')}</h2>
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
