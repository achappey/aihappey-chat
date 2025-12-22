import { FileTags, ResourceTags, useTheme } from "aihappey-components";
import { ResourceSelectButton } from "../../mcp-resources/ResourceSelectButton";
import { ServerSelectButton } from "../../mcp-servers/ServerSelectButton";
import {
  useMessageInput,
  UseMessageInputOptions,
} from "./useMessageInput";
import { useAppStore } from "aihappey-state";
import { AgentSettingsButton } from "../../agent-settings/AgentSettingsButton";
import { PromptSelectButton } from "../../mcp-prompts/PromptSelectButton";
import { ChatSettingsButton } from "../../chat-settings/ChatSettingsButton";
import { SystemMessageButton } from "./system-message/SystemMessageButton";
import { mcpResourceRuntime, useSelectedResources } from "../../../runtime/mcp/mcpResourceRuntime";
import { fileAttachmentRuntime, useFileAttachments } from "../../../runtime/files/fileAttachmentRuntime";
import { useTranslation } from "aihappey-i18n";

export const MessageInput = (props: UseMessageInputOptions) => {
  const { Button, Tags, TextArea } = useTheme();
  const { t } = useTranslation();
  const providerMetadata = useAppStore((s) => s.providerMetadata);
  const setProviderMetadata = useAppStore((s) => s.setProviderMetadata);
  const chatMode = useAppStore((s) => s.chatMode);
  const agents = useAppStore((s) => s.agents);
  const selectedAgentNames = useAppStore((s) => s.selectedAgentNames);
  const agentHint = chatMode == "agent"
    && selectedAgentNames?.length == 1
    ? agents?.find(a => a.name == selectedAgentNames[0])?.argumentHint : undefined;
  const promptPlaceholder = agentHint ?? t("promptPlaceholder");

  const {
    value,
    setValue,
    textareaRef,
    fileInputRef,
    handleChange,
    handleKeyDown,
    handlePaste,
    serverTags,
    handleFileChange,
    handleSubmit,
    disconnectServer,
    canSend,
    resetChatSettings,
  } = useMessageInput(props);

  const resources = useSelectedResources(mcpResourceRuntime)
  const fileAttachments = useFileAttachments(fileAttachmentRuntime)

  const attachmentsElement =
    resources.length > 0 || fileAttachments.length > 0 ? (
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
      </div>
    ) : null;

  const serverElements =
    serverTags.length > 0 ? (
      <div style={styles.tagRow}>
        <Tags
          size="small"
          items={serverTags}
          onRemove={async (id) => await disconnectServer(id)}
        />
      </div>
    ) : null;

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      {/* TAG ROW  */}
      {attachmentsElement}
      {serverElements}
      {/* FIRST ROW – TEXT INPUT */}
      <TextArea
        ref={textareaRef}
        value={value}
        autoFocus
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={promptPlaceholder}
        style={styles.textArea}
      />

      {/* SECOND ROW – CONTROLS */}
      <div style={styles.buttonRow}>
        <div style={styles.leftGroup}>
          {chatMode == "agent" && <>
            <AgentSettingsButton
              resetDefaults={resetChatSettings}
            />
          </>
          }
          {chatMode == "chat" && <>
            <ServerSelectButton />
            <PromptSelectButton
              onPromptExecute={props.onPromptExecute}
              model={props.model}
            />
            <ResourceSelectButton />
            <ChatSettingsButton
              providerMetadata={providerMetadata}
              temperature={props.temperature}
              resetDefaults={resetChatSettings}
              temperatureChanged={props.temperatureChanged}
              setProviderMetadata={setProviderMetadata}
            />
            <Button
              type="button"
              icon="attachment"
              variant="transparent"
              size="large"
              title={t("attachments")}
              disabled={props.disabled}
              onClick={() => fileInputRef.current?.click()}
            />
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </>}
        </div>
        {chatMode == "chat" && <SystemMessageButton />}

        {props.streaming ? (
          <Button
            type="button"
            icon="stop"
            size="large"
            onClick={props.onStop}
          />
        ) : (
          <Button
            type="submit"
            size="large"
            disabled={props.disabled || !canSend}
            icon="send"
          />
        )}
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
