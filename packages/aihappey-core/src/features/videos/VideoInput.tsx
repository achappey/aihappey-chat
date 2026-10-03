import { FileTags, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { UseVideoPromptInputOptions, useVideoInput } from "./useVideoInput";
import { toSingleVideoAttachment } from "./videoAttachments";
import { VideoSettingsButton } from "../video-settings/VideoSettingsButton";
import { useAppStore } from "aihappey-state";
import { ResizableTextArea } from "../chat/input/ResizableTextArea";
import { usePromptDictationControls } from "../chat/input/usePromptDictationControls";
import { MediaAttachmentMenu } from "../attachments/MediaAttachmentMenu";
import { UrlAttachmentTags } from "../attachments/UrlAttachmentTags";
import type { UrlAttachment } from "../attachments/urlAttachment";

type VideoInputProps = UseVideoPromptInputOptions & {
  urlAttachments: UrlAttachment[];
  onAddUrl: (part: UrlAttachment) => void;
  onRemoveUrl: (url: string) => void;
};

export const VideoInput = (props: VideoInputProps) => {
  const { Button, TextArea } = useTheme();
  const { t } = useTranslation();
  const providerVideoMetadata = useAppStore((s) => s.providerVideoMetadata);
  const setProviderVideoMetadata = useAppStore((s) => s.setProviderVideoMetadata);

  const {
    value,
    setValue,
    textareaRef,
    handleChange,
    handleKeyDown,
    handlePaste,
    handleSubmit,
    canSend,
  } = useVideoInput({
    ...props,
    onAddAttachments: props.onAddAttachments,
  });

  const { dictationButton, dictationError } = usePromptDictationControls({
    value,
    onChange: setValue,
    textareaRef,
    disabled: props.disabled || props.streaming,
  });

  const fileAttachments = props.attachments ?? [];

  const attachmentsElement =
    fileAttachments.length > 0 || props.urlAttachments.length > 0 ? (
      <div style={styles.tagRow}>
        {fileAttachments.length > 0 && <FileTags
          size="small"
          icon="image"
          files={fileAttachments}
          removeFile={props.onRemoveAttachment}
        />}
        {props.urlAttachments.length > 0 && <UrlAttachmentTags
          attachments={props.urlAttachments} onRemove={props.onRemoveUrl} />}
      </div>
    ) : null;

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h1>{t("videos")}</h1>

      {attachmentsElement}

      <ResizableTextArea
        TextArea={TextArea as any}
        textareaRef={textareaRef}
        value={value}
        autoFocus
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={t("videoPromptPlaceholder")}
        style={styles.textArea}
      />

      <div style={styles.buttonRow}>
        <div style={styles.leftGroup}>
          <MediaAttachmentMenu disabled={props.disabled} onAddUrl={props.onAddUrl}
            onFilesSelected={(files) => {
              const next = toSingleVideoAttachment(files);
              if (next) props.onAddAttachments?.([next]);
            }} />
          <VideoSettingsButton
            providerMetadata={providerVideoMetadata}
            setProviderMetadata={setProviderVideoMetadata}
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
        <h2>{t("myVideos")}</h2>
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
