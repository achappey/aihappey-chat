import { useState } from "react";
import {
  AttachmentButton, BrrrBadge, ContextProgressBar, FileTags,
  ResourceSelectButton, ResourceSelectModal, ResourceTags, useTheme
} from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { useAppStore } from "aihappey-state";
import type { ResourceTemplate } from "aihappey-state";
import { fileAttachmentRuntime, useFileAttachments } from "../../runtime/files/fileAttachmentRuntime";
import { mcpResourceRuntime, useSelectedResources } from "../../runtime/mcp/mcpResourceRuntime";
import { readResource } from "../../runtime/mcp/readResource";
import { ServerSelectButton } from "../mcp-servers/ServerSelectButton";
import { PromptSelectButton, type PromptWithSource } from "../mcp-prompts/PromptSelectButton";
import { SystemMessageButton } from "../chat/input/system-message/SystemMessageButton";
import { useResourceSelect } from "../chat/input/useResourceSelect";
import { applyTemplateParams, extractTemplateParams } from "../chat/input/resourceTemplateUri";
import { ResourceTemplateArgumentsModal } from "../chat/input/ResourceTemplateArgumentsModal";
import { addFilesToRuntime } from "../chat/input/MessageInput";
import { useMessageInput } from "../chat/input/useMessageInput";
import { RealtimeSettingsButton } from "./RealtimeSettingsButton";

type RealtimeInputProps = {
  disabled?: boolean;
  connected?: boolean;
  busy?: boolean;
  muted?: boolean;
  tokenUsage?: number;
  temperature?: number;
  temperatureChanged?: any;
  onStart: () => void | Promise<void>;
  onSend: (content: string) => void | Promise<void>;
  onStop?: () => void | Promise<void>;
  onMuteChange?: (muted: boolean) => void;
  onPromptExecute?: (prompt: PromptWithSource, args: any) => void | Promise<void>;
};

export const RealtimeInput = (props: RealtimeInputProps) => {
  const { Button, Tags, TextArea, Spinner } = useTheme();
  const { t } = useTranslation();
  const approveAll = useAppStore((s) => s.approveAll);
  const selectedModel = useAppStore((s) => s.selectedModel);
  const maxOutputTokens = useAppStore((s) => s.maxOutputTokens);
  const models = useAppStore((s) => s.models);
  const resourceSelect = useResourceSelect();
  const [resourceLoading, setResourceLoading] = useState(false);
  const [selectedResourceTemplate, setSelectedResourceTemplate] = useState<{
    serverKey: string;
    resourceTemplate: ResourceTemplate;
  } | null>(null);
  const [resourceTemplateModalOpen, setResourceTemplateModalOpen] = useState(false);

  const {
    value,
    textareaRef,
    handleChange,
    handleKeyDown,
    handlePaste,
    handleSubmit,
    serverTags,
    disconnectServer,
  } = useMessageInput({
    disabled: props.disabled || props.busy,
    onSend: async (content) => {
      if (content.trim()) {
        await props.onSend(content);
      } else {
        await props.onStart();
      }
    },
    canSendOverride: true,
    allowEmptySubmit: true,
  });

  const currentModel = models?.find(a => a.id == selectedModel);
  const resources = useSelectedResources(mcpResourceRuntime);
  const fileAttachments = useFileAttachments(fileAttachmentRuntime);
  const hasText = !!value.trim();
  const canSendActiveMessage = hasText || resources.length > 0 || fileAttachments.length > 0;

  const attachmentsElement = resources.length > 0 || fileAttachments.length > 0 ? (
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
      {(attachmentsElement || serverElements || approveAll || (currentModel?.context_window && props.tokenUsage)) ? (
        <div style={styles.metaRow}>
          <div style={styles.metaLeft}>
            {attachmentsElement}
            {serverElements}
          </div>

          <div style={styles.metaRight}>
            {resourceLoading && <Spinner />}
            <ContextProgressBar tokenUsage={props.tokenUsage}
              max_output_tokens={maxOutputTokens ?? currentModel?.max_tokens}
              context_window={currentModel?.context_window} />
            {approveAll && <BrrrBadge size="small" />}
          </div>
        </div>
      ) : undefined}

      <TextArea
        ref={textareaRef}
        value={value}
        autoFocus
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={props.connected ? t("promptPlaceholder") : "Start realtime or type a first message…"}
        style={styles.textArea}
      />

      <div style={styles.buttonRow}>
        <div style={styles.leftGroup}>
          <ServerSelectButton />

          <PromptSelectButton
            onPromptExecute={props.onPromptExecute}
          />

          <ResourceSelectButton disabled={!resourceSelect.hasResources}
            onClick={() => resourceSelect.setOpen(true)}
          />

          <ResourceSelectModal
            open={resourceSelect.open}
            resources={resourceSelect.resources}
            resourceTemplates={resourceSelect.resourceTemplates}
            onHide={() => resourceSelect.setOpen(false)}
            onSelect={async (uri) => {
              resourceSelect.setOpen(false);
              const hit = resourceSelect.resolve(uri);
              if (!hit) return;

              try {
                setResourceLoading(true);
                const result = await readResource(hit.serverKey, uri);
                mcpResourceRuntime.add(hit.resource, result);
              } finally {
                setResourceLoading(false);
              }
            }}
            onSelectTemplate={async (uriTemplate) => {
              resourceSelect.setOpen(false);
              const hit = resourceSelect.resolveTemplate(uriTemplate);
              if (!hit) return;

              const argNames = extractTemplateParams(uriTemplate);
              if (argNames.length === 0) {
                try {
                  setResourceLoading(true);
                  const resolvedUri = applyTemplateParams(uriTemplate, {});
                  const result = await readResource(hit.serverKey, resolvedUri);
                  mcpResourceRuntime.add({
                    uri: resolvedUri,
                    name: hit.resourceTemplate.name,
                    title: hit.resourceTemplate.title,
                    description: hit.resourceTemplate.description,
                    mimeType: hit.resourceTemplate.mimeType,
                    annotations: hit.resourceTemplate.annotations,
                  } as any, result);
                } finally {
                  setResourceLoading(false);
                }
                return;
              }

              setSelectedResourceTemplate(hit);
              setResourceTemplateModalOpen(true);
            }}
          />

          <ResourceTemplateArgumentsModal
            open={resourceTemplateModalOpen}
            serverKey={selectedResourceTemplate?.serverKey}
            resourceTemplate={selectedResourceTemplate?.resourceTemplate}
            onHide={() => {
              setResourceTemplateModalOpen(false);
              setSelectedResourceTemplate(null);
              resourceSelect.setOpen(true);
            }}
            onExecute={async (argumentsMap) => {
              if (!selectedResourceTemplate) return;
              const resolvedUri = applyTemplateParams(selectedResourceTemplate.resourceTemplate.uriTemplate, argumentsMap);

              try {
                setResourceLoading(true);
                const result = await readResource(selectedResourceTemplate.serverKey, resolvedUri);
                mcpResourceRuntime.add({
                  uri: resolvedUri,
                  name: selectedResourceTemplate.resourceTemplate.name,
                  title: selectedResourceTemplate.resourceTemplate.title,
                  description: selectedResourceTemplate.resourceTemplate.description,
                  mimeType: selectedResourceTemplate.resourceTemplate.mimeType,
                  annotations: selectedResourceTemplate.resourceTemplate.annotations,
                } as any, result);
              } finally {
                setResourceLoading(false);
              }
            }}
          />

          <RealtimeSettingsButton />

          <AttachmentButton
            disabled={props.disabled}
            onFilesSelected={addFilesToRuntime}
          />
        </div>

        <SystemMessageButton />

        <Button
          type="button"
          size="large"
          title={props.muted ? "Unmute" : "Mute"}
          variant={props.muted ? "primary" : "transparent"}
          icon="transcription"
          disabled={!props.connected}
          onClick={() => props.onMuteChange?.(!props.muted)}
        />

        {props.connected ? (
          <Button
            type="button"
            icon="stop"
            size="large"
            title={t("stop")}
            onClick={props.onStop}
          />
        ) : null}

        <Button
          type="submit"
          size="large"
          title={sendButtonTitle}
          disabled={disabled}
          icon={sendButtonIcon}
        />
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

