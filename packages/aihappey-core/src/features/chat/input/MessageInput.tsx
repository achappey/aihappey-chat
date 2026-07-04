import {
  BrrrBadge, ContextProgressBar, CostBadge, FileTags,
  ResourceSelectModal, ResourceTags, useTheme
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
import { useResourceSelect } from "./useResourceSelect";
import { readResource } from "../../../runtime/mcp/readResource";
import { useDictation } from "./useDictation";
import { useMemo, useRef, useState } from "react";
import { ResourceTemplateArgumentsModal } from "./ResourceTemplateArgumentsModal";
import { applyTemplateParams, extractTemplateParams } from "./resourceTemplateUri";
import type { Prompt, ResourceTemplate } from "aihappey-state";
import { resolveSelectedAgentEntries } from "../../agents/agentSelection";
import { ServerManagementModal } from "../../mcp-servers/ServerManagementModal";
import { PromptSelectModal } from "../../mcp-prompts/PromptSelectModal";
import { PromptArgumentsModal } from "../../mcp-prompts/PromptArgumentsModal";
import { useAutoPromptExecution } from "../../mcp-prompts/useAutoPromptExecution";
import { getPrompts } from "../../../runtime/mcp/mcpPrompts";
import type { IconToken, MenuItemProps, TagItem } from "aihappey-types";
import { ContextSearchModal } from "./context-search/ContextSearchModal";
import { useLocalTools } from "aihappey-tools";
import { useSkills } from "aihappey-skills";
import { buildLocalToolToggleItems, usePluginToggleItems } from "../../tools/toolCatalogItems";

export const addFilesToRuntime = (files: File[]) => {
  files.forEach(file => fileAttachmentRuntime.add(file));
};

type PromptWithSource = Prompt & {
  _serverName?: string;
  _serverTitle?: string;
  _url?: string;
};

export const MessageInput = (props: UseMessageInputOptions) => {
  const { Button, Menu, Tags, TextArea, Spinner } = useTheme();
  const { t } = useTranslation();
  const mcpServerContent = useAppStore((s) => s.mcpServerContent);
  const mcpServers = useAppStore((s) => s.mcpServers);
  const updateMcpServers = useAppStore((s) => s.updateMcpServers);
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
  const enabledLocalTools = useAppStore((s) => (s as any).enabledLocalTools as string[]);
  const setEnabledLocalTools = useAppStore((s) => (s as any).setEnabledLocalTools as (names: string[]) => void);
  const enabledSkillIds = useAppStore((s) => s.enabledSkillIds);
  const setEnabledSkillIds = useAppStore((s) => s.setEnabledSkillIds);
  const agents = useAppStore((s) => s.agents);
  const remoteAgentModels = useAppStore((s) => s.remoteAgentModels);
  const selectedAgentNames = useAppStore((s) => s.selectedAgentNames);
  const localTools = useLocalTools();
  const skills = useSkills();
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
  const resourceSelect = useResourceSelect();
  const [resourceLoading, setResourceLoading] = useState(false);
  const [serverManagementOpen, setServerManagementOpen] = useState(false);
  const [contextSearchOpen, setContextSearchOpen] = useState(false);
  const [prompts, setPrompts] = useState<PromptWithSource[]>([]);
  const [promptSelectOpen, setPromptSelectOpen] = useState(false);
  const [argumentPrompt, setArgumentPrompt] = useState<PromptWithSource | undefined>(undefined);
  const [selectedResourceTemplate, setSelectedResourceTemplate] = useState<{
    serverKey: string;
    resourceTemplate: ResourceTemplate;
  } | null>(null);
  const [resourceTemplateModalOpen, setResourceTemplateModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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

  const dictation = useDictation({
    disabled: props.disabled || props.streaming,
    onTranscript: (text) => {
      setValue((prev) => {
        const sep = prev && !/\s$/.test(prev) ? " " : "";
        return `${prev}${sep}${text}`;
      });

      // Keep focus in the input and move cursor to end.
      window.setTimeout(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.focus();
        try {
          const end = el.value.length;
          el.setSelectionRange(end, end);
        } catch {
          // ignore
        }
      }, 0);
    },
  });

  const currentModel = models?.find(a => a.id == selectedModel);
  const resources = useSelectedResources(mcpResourceRuntime)
  const fileAttachments = useFileAttachments(fileAttachmentRuntime)
  const localToolToggleItems = useMemo(
    () => buildLocalToolToggleItems(localTools.items ?? [], t),
    [localTools.items, t]
  );
  const hasPrompts = Object.keys(mcpServerContent)
    .filter(a => mcpServerContent[a].capabilities?.prompts)
    .length > 0;

  const contextToolTags = useMemo<TagItem[]>(() => {
    if (chatMode !== "chat") return [];

    const pluginLabels = new Map(pluginToggleItems.map((item) => [item.id, item.label] as const));
    const localToolLabels = new Map(localToolToggleItems.map((item) => [item.id, item.label] as const));
    const skillLabels = new Map(
      (skills.items ?? []).map((item) => [item.skillId, item.name || item.skillId] as const)
    );

    const pluginTags: TagItem[] = (activePlugins ?? []).map((id) => ({
      key: `plugin:${id}`,
      icon: "tool",
      label: pluginLabels.get(id) ?? id,
    }));

    const localToolTags: TagItem[] = (enabledLocalTools ?? []).map((id) => ({
      key: `local:${id}`,
      icon: "tool",
      label: localToolLabels.get(id) ?? id,
    }));

    const skillTags: TagItem[] = (enabledSkillIds ?? []).map((id) => ({
      key: `skill:${id}`,
      icon: "skills",
      label: skillLabels.get(id) ?? id,
    }));

    return [...skillTags, ...pluginTags, ...localToolTags];
  }, [activePlugins, chatMode, enabledLocalTools, enabledSkillIds, localToolToggleItems, pluginToggleItems, skills.items]);

  const removeContextToolTag = (key: string) => {
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

  const onServerManagementHide = (enabledServers: Set<string>) => {
    setServerManagementOpen(false);
    var updates: any = {

    };

    var keys = Object.keys(mcpServers);
    for (const name of keys) {
      updates[name] = {
        ...mcpServers[name].config,
        disabled: !enabledServers.has(name)
      };
    }

    updateMcpServers(updates);
  };

  const closeContextSearch = (catalogInstallHappened: boolean) => {
    setContextSearchOpen(false);
    if (catalogInstallHappened) {
      setTimeout(() => setServerManagementOpen(true), 0);
    }
  };

  const loadPrompts = async () => {
    const results = await Promise.all(
      Object.keys(mcpServerContent)
        .filter(a => mcpServerContent[a].capabilities?.prompts)
        .map(async (a) => {
          const serverPrompts = await getPrompts(a);
          return serverPrompts.map(y => ({
            ...y,
            _serverName: a,
            _serverTitle: mcpServers[a]?.registry?.server.title,
            _url: mcpServers[a]?.config?.url
          }));
        })
    );

    setPrompts(results.flat());
  };

  const openPromptSelect = () => {
    if (!hasPrompts) return;
    setPromptSelectOpen(true);
    void loadPrompts();
  };

  const closePromptSelect = () => {
    setPromptSelectOpen(false);
    setPrompts([]);
  };

  useAutoPromptExecution({
    onPromptExecute: props.onPromptExecute as any,
    setArgumentPrompt,
    setOpen: setPromptSelectOpen,
  });

  const chatInputMenuItems: MenuItemProps[] = [
    {
      key: "search-context",
      label: t("search") ?? "Search",
      icon: "search" as IconToken,
      onClick: () => setContextSearchOpen(true),
    },
    {
      key: "select-file",
      label: t("attachments"),
      icon: "attachment" as IconToken,
      onClick: () => fileInputRef.current?.click(),
    },
    {
      key: "prompts",
      label: t("promptSelectModal.title"),
      icon: "prompts" as IconToken,
      disabled: !hasPrompts,
      onClick: openPromptSelect,
    },
    {
      key: "resources",
      label: t("mcp.resources"),
      icon: "resources" as IconToken,
      disabled: !resourceSelect.hasResources,
      onClick: () => {
        if (!resourceSelect.hasResources) return;
        resourceSelect.setOpen(true);
      },
    },
    {
      key: "model-context",
      label: "Model Context",
      icon: "mcpServer" as IconToken,
      onClick: () => setServerManagementOpen(true),
    },
  ];

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
            {resourceLoading && <Spinner />}
            <ContextProgressBar tokenUsage={props.tokenUsage}
              max_output_tokens={maxOutputTokens ?? currentModel?.max_tokens}
              context_window={currentModel?.context_window} />
            <CostBadge cost={props.conversationCost} size="small" />
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
            <Menu
              align="left"
              direction="top"
              size="medium"
              items={chatInputMenuItems}
              trigger={
                <Button
                  type="button"
                  icon="add"
                  size="large"
                  variant="transparent"
                  title={t("add") ?? "Add"}
                  disabled={props.disabled}
                />
              }
            />

            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={(e) => {
                if (!e.target.files) return;
                addFilesToRuntime(Array.from(e.target.files));
                e.target.value = "";
              }}
            />

            <ServerManagementModal show={serverManagementOpen} onHide={onServerManagementHide} />

            <ContextSearchModal
              open={contextSearchOpen}
              onClose={closeContextSearch}
            />

            <PromptSelectModal
              open={promptSelectOpen}
              prompts={prompts}
              onPromptClick={async (p) => {
                if (p.arguments && p.arguments.length > 0) {
                  setArgumentPrompt(p);
                } else {
                  closePromptSelect();
                  await (props.onPromptExecute as any)?.(p);
                }
              }}
              onHide={closePromptSelect}
            />

            {argumentPrompt && (
              <PromptArgumentsModal
                open={argumentPrompt != undefined}
                prompt={argumentPrompt}
                onPromptExecute={async (prompt: any, args: any) => {
                  setArgumentPrompt(undefined);
                  closePromptSelect();
                  await props.onPromptExecute?.(prompt, args);
                }}
                onHide={() => {
                  setArgumentPrompt(undefined);
                  setPromptSelectOpen(true);
                }}
              />
            )}

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
                  setResourceLoading(true)
                  const result = await readResource(hit.serverKey, uri);
                  mcpResourceRuntime.add(hit.resource, result);

                } finally {
                  setResourceLoading(false)

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
                    mcpResourceRuntime.add(
                      {
                        uri: resolvedUri,
                        name: hit.resourceTemplate.name,
                        title: hit.resourceTemplate.title,
                        description: hit.resourceTemplate.description,
                        mimeType: hit.resourceTemplate.mimeType,
                        annotations: hit.resourceTemplate.annotations,
                      } as any,
                      result
                    );
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

                const resolvedUri = applyTemplateParams(
                  selectedResourceTemplate.resourceTemplate.uriTemplate,
                  argumentsMap
                );

                try {
                  setResourceLoading(true);
                  const result = await readResource(selectedResourceTemplate.serverKey, resolvedUri);
                  mcpResourceRuntime.add(
                    {
                      uri: resolvedUri,
                      name: selectedResourceTemplate.resourceTemplate.name,
                      title: selectedResourceTemplate.resourceTemplate.title,
                      description: selectedResourceTemplate.resourceTemplate.description,
                      mimeType: selectedResourceTemplate.resourceTemplate.mimeType,
                      annotations: selectedResourceTemplate.resourceTemplate.annotations,
                    } as any,
                    result
                  );
                } finally {
                  setResourceLoading(false);
                }
              }}
            />

            <ChatSettingsButton
              providerMetadata={providerMetadata}
              providerHeaders={providerHeaders ?? {}}
              temperature={props.temperature}
              resetDefaults={resetChatSettings}
              temperatureChanged={props.temperatureChanged}
              setProviderMetadata={setProviderMetadata}
              setProviderHeaders={setProviderHeaders}
            />
          </>}
        </div>
        {chatMode == "chat" && <SystemMessageButton />}

        {/* Dictation button (left of send/stop) */}
        <Button
          type="button"
          size="large"
          title={t("transcriptionRecord")}
          variant={dictation.recording ? "primary" : "transparent"}
          icon={dictation.recording ? "stop" : "transcription"}
          disabled={dictation.recording
            ? false
            : props.disabled
            || props.streaming
            || !dictation.recordingSupported
            || !dictation.transcriptionEnabled
            || dictation.transcribing}
          onClick={dictation.recording ? dictation.stopRecording : dictation.startRecording}
        >
          {dictation.recording ? dictation.elapsedLabel : undefined}
        </Button>

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

      {dictation.error && (
        <div style={{ marginTop: 8, color: "#b00020" }}>
          {dictation.error}
        </div>
      )}
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
