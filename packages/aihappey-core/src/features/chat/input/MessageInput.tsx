import { useChatInputMenu } from "./useChatInputMenu";
import {
  BrrrBadge, ContextProgressBar, CostBadge, FileTags,
  ResourceTags, useTheme
} from "aihappey-components";
import {
  useMessageInput,
  UseMessageInputOptions,
} from "./useMessageInput";
import { useAppStore } from "aihappey-state";
import { AgentSettingsButton } from "../../agent-settings/AgentSettingsButton";
import { ChatSettingsButton } from "../../chat-settings/ChatSettingsButton";
import { SystemMessageButton } from "./system-message/SystemMessageButton";
import { mcpResourceRuntime, useSelectedResources } from "../../../runtime/mcp/mcpResourceRuntime";
import { fileAttachmentRuntime, useFileAttachments } from "../../../runtime/files/fileAttachmentRuntime";
import { useTranslation } from "aihappey-i18n";
import { useMemo } from "react";
import { resolveSelectedAgentEntries } from "../../agents/agentSelection";
import type { TagItem } from "aihappey-types";
import { useLocalTools } from "aihappey-tools";
import { useSkills } from "aihappey-skills";
import { connectedMcpSkills, connectedSkillLabel, disconnectedSkillLabel } from "../../skills/connectedMcpSkills";
import { buildLocalToolToggleItems, usePluginToggleItems } from "../../tools/toolCatalogItems";
import { ResizableTextArea } from "./ResizableTextArea";
import { usePlugins as useAgentPlugins } from "aihappey-plugins";
import { usePromptDictationControls } from "./usePromptDictationControls";
import { urlAttachmentRuntime, useUrlAttachments } from "../../../runtime/files/urlAttachmentRuntime";
import { UrlAttachmentTags } from "../../attachments/UrlAttachmentTags";

export type MessageInputProps = UseMessageInputOptions & {
  resizeResetKey?: string;
};

export const addFilesToRuntime = (files: File[]) => {
  files.forEach(file => fileAttachmentRuntime.add(file));
};

export const MessageInput = (props: MessageInputProps) => {
  const { Button, Tags, TextArea, Spinner } = useTheme();
  const { t } = useTranslation();
  const providerMetadata = useAppStore((s) => s.providerMetadata);
  const setProviderMetadata = useAppStore((s) => s.setProviderMetadata);
  const providerHeaders = useAppStore((s) => s.providerHeaders);
  const setProviderHeaders = useAppStore((s) => s.setProviderHeaders);
  const approveAll = useAppStore((s) => s.approveAll);
  const selectedModel = useAppStore((s) => s.selectedModel);
  const maxOutputTokens = useAppStore((s) => s.maxOutputTokens);
  const models = useAppStore((s) => s.models);
  const chatMode = useAppStore((s) => s.chatMode);
  const activePlugins = useAppStore((s) => s.activePlugins);
  const setActivePlugins = useAppStore((s) => s.setActivePlugins);
  const enabledAgentPluginIds = useAppStore((s) => s.enabledAgentPluginIds);
  const setEnabledAgentPluginIds = useAppStore((s) => s.setEnabledAgentPluginIds);
  const enabledLocalTools = useAppStore((s) => (s as any).enabledLocalTools as string[]);
  const setEnabledLocalTools = useAppStore((s) => (s as any).setEnabledLocalTools as (names: string[]) => void);
  const enabledSkillIds = useAppStore((s) => s.enabledSkillIds);
  const mcpSkills = useAppStore((s) => s.mcpSkills);
  const setEnabledSkillIds = useAppStore((s) => s.setEnabledSkillIds);
  const agents = useAppStore((s) => s.agents);
  const remoteAgentModels = useAppStore((s) => s.remoteAgentModels);
  const selectedAgentNames = useAppStore((s) => s.selectedAgentNames);
  const localTools = useLocalTools();
  const skills = useSkills();
  const agentPlugins = useAgentPlugins();
  const pluginToggleItems = usePluginToggleItems({ includeSkillSearch: true, settingsScope: true });
  const selectedAgentEntries = resolveSelectedAgentEntries(
    selectedAgentNames,
    agents,
    remoteAgentModels,
  );
  const agentHint = chatMode == "agent"
    && selectedAgentEntries.length == 1
    && selectedAgentEntries[0].kind === "local"
    ? selectedAgentEntries[0].argumentHint
    : undefined;
  const promptPlaceholder = agentHint ?? t("promptPlaceholder");
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

  const { dictationButton, dictationError } = usePromptDictationControls({
    value,
    onChange: setValue,
    textareaRef,
    disabled: props.disabled || props.streaming,
  });

  const inputMenu = useChatInputMenu({ ...props, mode: chatMode === "agent" ? "agent" : "chat" });

  const currentModel = models?.find(a => a.id == selectedModel);
  const resources = useSelectedResources(mcpResourceRuntime)
  const fileAttachments = useFileAttachments(fileAttachmentRuntime)
  const urlAttachments = useUrlAttachments();
  const localToolToggleItems = useMemo(
    () => buildLocalToolToggleItems(localTools.items ?? [], t),
    [localTools.items, t]
  );

  const contextToolTags = useMemo<TagItem[]>(() => {
    if (chatMode !== "chat") return [];

    const pluginLabels = new Map(pluginToggleItems.map((item) => [item.id, item.label] as const));
    const agentPluginLabels = new Map(agentPlugins.items.map((item) => [item.id, item.name] as const));
    const localToolLabels = new Map(localToolToggleItems.map((item) => [item.id, item.label] as const));
    const skillLabels = new Map(
      (skills.items ?? []).map((item) => [item.skillId, item.name || item.skillId] as const)
    );
    const connected = connectedMcpSkills(mcpSkills);
    for (const skill of connected) skillLabels.set(skill.skillId, connectedSkillLabel(skill, connected));

    const pluginTags: TagItem[] = (activePlugins ?? []).map((id) => ({
      key: `plugin:${id}`,
      icon: "tool",
      label: pluginLabels.get(id) ?? id,
    }));

    const agentPluginTags: TagItem[] = (enabledAgentPluginIds ?? []).map((id) => ({
      key: `agent-plugin:${id}`,
      icon: "plugins",
      label: agentPluginLabels.get(id) ?? id,
    }));

    const localToolTags: TagItem[] = (enabledLocalTools ?? []).map((id) => ({
      key: `local:${id}`,
      icon: "tool",
      label: localToolLabels.get(id) ?? id,
    }));

    const skillTags: TagItem[] = (enabledSkillIds ?? []).map((id) => ({
      key: `skill:${id}`,
      icon: "skills",
      label: skillLabels.get(id) ?? disconnectedSkillLabel(id),
    }));

    return [...skillTags, ...agentPluginTags, ...pluginTags, ...localToolTags];
  }, [activePlugins, agentPlugins.items, chatMode, enabledAgentPluginIds, enabledLocalTools, enabledSkillIds, localToolToggleItems, pluginToggleItems, skills.items, mcpSkills, t]);

  const removeContextToolTag = (key: string) => {
    if (key.startsWith("agent-plugin:")) {
      const id = key.slice("agent-plugin:".length);
      setEnabledAgentPluginIds((enabledAgentPluginIds ?? []).filter((item) => item !== id));
      return;
    }
    if (key.startsWith("plugin:")) {
      const id = key.slice("plugin:".length);
      setActivePlugins((activePlugins ?? []).filter((item) => item !== id));
      return;
    }

    if (key.startsWith("local:")) {
      const id = key.slice("local:".length);
      setEnabledLocalTools((enabledLocalTools ?? []).filter((item) => item !== id));
      return;
    }

    if (key.startsWith("skill:")) {
      const id = key.slice("skill:".length);
      setEnabledSkillIds((enabledSkillIds ?? []).filter((item) => item !== id));
    }
  };

  const attachmentsElement =
    resources.length > 0 || fileAttachments.length > 0 || urlAttachments.length > 0 ? (
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
        {urlAttachments.length > 0 && <UrlAttachmentTags attachments={urlAttachments}
          onRemove={urlAttachmentRuntime.remove} />}
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

  const contextToolElements =
    contextToolTags.length > 0 ? (
      <div style={styles.tagRow}>
        <Tags
          size="small"
          items={contextToolTags}
          onRemove={removeContextToolTag}
        />
      </div>
    ) : null;

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      {(attachmentsElement || serverElements || contextToolElements || approveAll || props.conversationCost !== undefined
        || (currentModel?.context_window && props.tokenUsage)
      ) ? (
        <div style={styles.metaRow}>
          <div style={styles.metaLeft}>
            {attachmentsElement}
            {serverElements}
            {contextToolElements}
          </div>

          <div style={styles.metaRight}>
            {inputMenu.resourceLoading && <Spinner />}
            <ContextProgressBar tokenUsage={props.tokenUsage}
              max_output_tokens={maxOutputTokens ?? currentModel?.max_tokens}
              context_window={currentModel?.context_window} />
            <CostBadge cost={props.conversationCost} size="small" />
            {approveAll && <BrrrBadge size="small" />}
          </div>
        </div>
      ) : undefined}

      <ResizableTextArea
        TextArea={TextArea as any}
        textareaRef={textareaRef}
        direction="up"
        resetKey={props.resizeResetKey}
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
          {(chatMode == "chat" || chatMode == "agent") && inputMenu.controls}

          {chatMode == "agent" && <AgentSettingsButton
            resetDefaults={resetChatSettings}
          />}

          {chatMode == "chat" && <ChatSettingsButton
            providerMetadata={providerMetadata}
            providerHeaders={providerHeaders ?? {}}
            temperature={props.temperature}
            resetDefaults={resetChatSettings}
            temperatureChanged={props.temperatureChanged}
            setProviderMetadata={setProviderMetadata}
            setProviderHeaders={setProviderHeaders}
          />}
        </div>
        {chatMode == "chat" && <SystemMessageButton />}

        {/* Dictation button (left of send/stop) */}
        {dictationButton}

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

      {dictationError}
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
    minHeight: 0,
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
    alignItems: "flex-end",
    gap: 12,
    alignSelf: "flex-end"
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
    boxSizing: "border-box",
    display: "block",
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
