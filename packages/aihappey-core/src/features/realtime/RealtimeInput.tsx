import {
  BrrrBadge, ContextProgressBar, FileTags,
  ResourceTags, useTheme
} from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { useAppStore } from "aihappey-state";
import { fileAttachmentRuntime, useFileAttachments } from "../../runtime/files/fileAttachmentRuntime";
import { mcpResourceRuntime, useSelectedResources } from "../../runtime/mcp/mcpResourceRuntime";
import { SystemMessageButton } from "../chat/input/system-message/SystemMessageButton";
import type { PromptWithSource } from "../mcp-prompts/PromptSelectButton";
import { useChatInputMenu } from "../chat/input/useChatInputMenu";
import { ChatSettingsButton } from "../chat-settings/ChatSettingsButton";
import { urlAttachmentRuntime, useUrlAttachments } from "../../runtime/files/urlAttachmentRuntime";
import { UrlAttachmentTags } from "../attachments/UrlAttachmentTags";
import { useMessageInput } from "../chat/input/useMessageInput";

type RealtimeInputProps = {
  model: string;
  audioOnly?: boolean;
  disabled?: boolean;
  connected?: boolean;
  busy?: boolean;
  muted?: boolean;
  cameraEnabled?: boolean;
  cameraSupported?: boolean;
  tokenUsage?: number;
  temperature?: number;
  temperatureChanged?: any;
  onStart: () => void | Promise<void>;
  onSend: (content: string) => void | Promise<void>;
  onStop?: () => void | Promise<void>;
  onMuteChange?: (muted: boolean) => void;
  onCameraChange?: (enabled: boolean) => void;
  onPromptExecute?: (prompt: PromptWithSource, args: any) => void | Promise<void>;
};

export const RealtimeInput = (props: RealtimeInputProps) => {
  const { Button, Tags, TextArea, Spinner } = useTheme();
  const { t } = useTranslation();
  const approveAll = useAppStore((s) => s.approveAll);
  const providerMetadata = useAppStore((s) => s.providerMetadata);
  const setProviderMetadata = useAppStore((s) => s.setProviderMetadata);
  const providerHeaders = useAppStore((s) => s.providerHeaders);
  const setProviderHeaders = useAppStore((s) => s.setProviderHeaders);
  const maxOutputTokens = useAppStore((s) => s.maxOutputTokens);
  const models = useAppStore((s) => s.models);
  const resources = useSelectedResources(mcpResourceRuntime);
  const fileAttachments = useFileAttachments(fileAttachmentRuntime);
  const urlAttachments = useUrlAttachments();
  const {
    value,
    textareaRef,
    handleChange,
    handleKeyDown,
    handlePaste,
    handleSubmit,
    serverTags,
    disconnectServer,
    resetChatSettings,
  } = useMessageInput({
    disabled: props.disabled || props.busy || props.audioOnly,
    onSend: async (content) => {
      if (props.disabled || props.busy || props.audioOnly) return;
      if (content.trim() || resources.length > 0 || fileAttachments.length > 0 || urlAttachments.length > 0) {
        await props.onSend(content);
      } else if (!props.connected) {
        await props.onStart();
      }
    },
    canSendOverride: !props.disabled && !props.busy && !props.audioOnly,
    allowEmptySubmit: true,
  });

  const inputMenu = useChatInputMenu({
    mode: "realtime",
    disabled: props.disabled || props.busy || props.audioOnly,
    onPromptExecute: props.onPromptExecute,
  });
  const currentModel = models?.find(a => a.id === props.model);
  const hasText = !!value.trim();
  const canSendActiveMessage = hasText || resources.length > 0 || fileAttachments.length > 0 || urlAttachments.length > 0;

  const attachmentsElement = resources.length > 0 || fileAttachments.length > 0 || urlAttachments.length > 0 ? (
    <div style={styles.tagRow}>
      {resources.length > 0 && (
        <ResourceTags resources={resources}
          removeResource={(a) => mcpResourceRuntime.remove(a)} />
      )}
      {fileAttachments.length > 0 && (
        <FileTags
          files={fileAttachments}
          removeFile={(a) => fileAttachmentRuntime.remove(a)}
        />
      )}
      {urlAttachments.length > 0 && <UrlAttachmentTags attachments={urlAttachments} onRemove={urlAttachmentRuntime.remove} />}
    </div>
  ) : null;

  const serverElements = serverTags.length > 0 ? (
    <div style={styles.tagRow}>
      <Tags
        size="small"
        items={serverTags}
        onRemove={async (id) => await disconnectServer(id)}
      />
    </div>
  ) : null;

  const disabled = props.disabled || props.busy || (props.connected && !canSendActiveMessage);
  const sendButtonTitle = props.connected ? t("send") : t("realtime");
  const sendButtonIcon = props.connected ? "send" : "realtime";

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      {!props.audioOnly && (attachmentsElement || serverElements || approveAll || (currentModel?.context_window && props.tokenUsage)) ? (
        <div style={styles.metaRow}>
          <div style={styles.metaLeft}>
            {attachmentsElement}
            {serverElements}
          </div>

          <div style={styles.metaRight}>
            {inputMenu.resourceLoading && <Spinner />}
            <ContextProgressBar tokenUsage={props.tokenUsage}
              max_output_tokens={maxOutputTokens ?? currentModel?.max_tokens}
              context_window={currentModel?.context_window} />
            {approveAll && <BrrrBadge size="small" />}
          </div>
        </div>
      ) : undefined}

      {!props.audioOnly && <TextArea
        ref={textareaRef}
        readOnly={props.disabled || props.busy}
        value={value}
        autoFocus
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={props.connected ? t("promptPlaceholder") : "Start realtime or type a first message…"}
        style={styles.textArea}
      />}

      <div style={styles.buttonRow}>
        <div style={styles.leftGroup}>
          {!props.audioOnly && inputMenu.controls}
          <ChatSettingsButton
            realtimeModel={props.model}
            providerMetadata={providerMetadata}
            setProviderMetadata={setProviderMetadata}
            providerHeaders={providerHeaders ?? {}}
            setProviderHeaders={setProviderHeaders}
            temperature={props.temperature}
            temperatureChanged={props.temperatureChanged}
            resetDefaults={resetChatSettings}
          />
        </div>

        {!props.audioOnly && <SystemMessageButton />}

        <Button
          type="button"
          size="large"
          title={props.muted ? "Unmute" : "Mute"}
          variant={props.muted ? "primary" : "transparent"}
          icon="transcription"
          disabled={!props.connected}
          onClick={() => props.onMuteChange?.(!props.muted)}
        />

        {props.cameraSupported ? (
          <Button
            type="button"
            size="large"
            title={props.cameraEnabled
              ? t("providers:google.realtimeConversation.stopCamera")
              : t("providers:google.realtimeConversation.startCamera")}
            variant={props.cameraEnabled ? "primary" : "transparent"}
            icon="video"
            disabled={!props.connected}
            onClick={() => props.onCameraChange?.(!props.cameraEnabled)}
          />
        ) : null}

        {props.connected ? (
          <Button
            type="button"
            icon="stop"
            size="large"
            title={t("stop")}
            onClick={props.onStop}
          />
        ) : null}

        {!props.audioOnly && <Button
          type="submit"
          size="large"
          title={sendButtonTitle}
          disabled={disabled}
          icon={sendButtonIcon}
        />}
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
  metaRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    width: "100%",
  },
  metaLeft: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    flex: 1,
  },
  metaRight: {
    display: "flex",
    alignItems: "flex-end",
    gap: 12,
    alignSelf: "flex-end",
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
