import { AttachmentButton, FileTags, ResourceSelectButton, ResourceSelectModal, ResourceTags, useTheme } from "aihappey-components";
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
import { useResourceSelect } from "./useResourceSelect";
import { readResource } from "../../../runtime/mcp/readResource";

export const addFilesToRuntime = (files: File[]) => {
  files.forEach(file => fileAttachmentRuntime.add(file));
};


export const MessageInput = (props: UseMessageInputOptions) => {
  const { Button, Tags, TextArea, Badge } = useTheme();
  const { t } = useTranslation();
  const providerMetadata = useAppStore((s) => s.providerMetadata);
  const setProviderMetadata = useAppStore((s) => s.setProviderMetadata);
  const approveAll = useAppStore((s) => s.approveAll);
  const chatMode = useAppStore((s) => s.chatMode);
  const agents = useAppStore((s) => s.agents);
  const selectedAgentNames = useAppStore((s) => s.selectedAgentNames);
  const agentHint = chatMode == "agent"
    && selectedAgentNames?.length == 1
    ? agents?.find(a => a.name == selectedAgentNames[0])?.argumentHint : undefined;
  const promptPlaceholder = agentHint ?? t("promptPlaceholder");
  const resourceSelect = useResourceSelect();
  const {
    value,
    setValue,
    textareaRef,
    handleChange,
    handleKeyDown,
    handlePaste,
    serverTags,
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
      {(attachmentsElement || serverElements || approveAll) && (
        <div style={styles.metaRow}>
          <div style={styles.metaLeft}>
            {attachmentsElement}
            {serverElements}
          </div>

          <div style={styles.metaRight}>
            {approveAll && <Badge icon="warning"
              bg="danger"
              appearance="filled" >YOLO</Badge>}
          </div>
        </div>
      )}

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
            />

            <ResourceSelectButton disabled={resourceSelect.resources.length == 0}
              onClick={() => resourceSelect.setOpen(true)}
            />

            <ResourceSelectModal
              open={resourceSelect.open}
              resources={resourceSelect.resources}
              onHide={() => resourceSelect.setOpen(false)}
              onSelect={async (uri) => {
                resourceSelect.setOpen(false);

                const hit = resourceSelect.resolve(uri);
                if (!hit) return;

                const result = await readResource(hit.serverKey, uri);
                mcpResourceRuntime.add(hit.resource, result);
              }}
            />

            <ChatSettingsButton
              providerMetadata={providerMetadata}
              temperature={props.temperature}
              resetDefaults={resetChatSettings}
              temperatureChanged={props.temperatureChanged}
              setProviderMetadata={setProviderMetadata}
            />
            <AttachmentButton
              disabled={props.disabled}
              onFilesSelected={addFilesToRuntime}
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
  yoloRow: {
    display: "flex",
    justifyContent: "flex-end",
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
    alignItems: "flex-start",
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
