import { FileTags, useTheme } from "aihappey-components";
import { useAppStore } from "aihappey-state";
import { useTranslation } from "aihappey-i18n";
import { useFileAttachments, fileAttachmentRuntime } from "../../runtime/files/fileAttachmentRuntime";
import { useImageInput, type UseImagePromptInputOptions } from "./useImageInput";
import { ImageSettingsButton } from "../image-settings/ImageSettingsButton";
import { ResizableTextArea } from "../chat/input/ResizableTextArea";
import { usePromptDictationControls } from "../chat/input/usePromptDictationControls";
import { MediaAttachmentMenu } from "../attachments/MediaAttachmentMenu";
import { UrlAttachmentTags } from "../attachments/UrlAttachmentTags";
import type { UrlAttachment } from "../attachments/urlAttachment";

type ImageInputProps = UseImagePromptInputOptions & {
  selectedModel?: string;
  urlAttachments: UrlAttachment[];
  onAddUrl: (part: UrlAttachment) => void;
  onRemoveUrl: (url: string) => void;
};

export const ImageInput = (props: ImageInputProps) => {
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
    fileAttachments.length > 0 || props.urlAttachments.length > 0 ? (
      <div style={styles.tagRow}>
        {fileAttachments.length > 0 && (
          <FileTags
            size="small"
            icon="image"
            files={fileAttachments}
            removeFile={(a) => fileAttachmentRuntime.remove(a)}
          />
        )}
        {props.urlAttachments.length > 0 && <UrlAttachmentTags
          attachments={props.urlAttachments} onRemove={props.onRemoveUrl} />}
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
          <MediaAttachmentMenu disabled={props.disabled}
            onFilesSelected={(files) => files.forEach(file => fileAttachmentRuntime.add(file))}
            onAddUrl={props.onAddUrl} />
          <ImageSettingsButton
            selectedModel={props.selectedModel}
            providerMetadata={providerImageMetadata}
            setProviderMetadata={setProviderImageMetadata} />

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
    flexWrap: "wrap",
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
