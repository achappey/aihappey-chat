import { AttachmentButton, FileTags, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { UseVideoPromptInputOptions, useVideoInput } from "./useVideoInput";
import { toSingleVideoAttachment } from "./videoAttachments";
import { VideoSettingsButton } from "../video-settings/VideoSettingsButton";
import { useAppStore } from "aihappey-state";

export const VideoInput = (props: UseVideoPromptInputOptions) => {
  const { Button, TextArea } = useTheme();
  const { t } = useTranslation();
  const providerVideoMetadata = useAppStore((s) => s.providerVideoMetadata);
  const setProviderVideoMetadata = useAppStore((s) => s.setProviderVideoMetadata);

  const {
    value,
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

  const fileAttachments = props.attachments ?? [];

  const attachmentsElement =
    fileAttachments.length > 0 ? (
      <div style={styles.tagRow}>
        <FileTags
          icon="image"
          files={fileAttachments}
          removeFile={props.onRemoveAttachment}
        />
      </div>
    ) : null;

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h1>{t("videos")}</h1>

      {attachmentsElement}

      <TextArea
        ref={textareaRef}
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
          <VideoSettingsButton
            providerMetadata={providerVideoMetadata}
            setProviderMetadata={setProviderVideoMetadata}
          />

          <AttachmentButton
            disabled={props.disabled}
            icon="attachment"
            onFilesSelected={(files) => {
              const next = toSingleVideoAttachment(files);
              if (next) props.onAddAttachments?.([next]);
            }}
          />
        </div>

        <Button
          type="submit"
          size="large"
          disabled={props.disabled || !canSend}
          icon="send"
        />
      </div>

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
