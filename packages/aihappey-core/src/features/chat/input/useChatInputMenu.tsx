import { useRef, useState } from "react";
import { ResourceSelectModal, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { useAppStore, type ResourceTemplate } from "aihappey-state";
import type { IconToken, MenuItemProps } from "aihappey-types";
import type { PromptWithSource } from "../../mcp-prompts/PromptSelectButton";
import type { UseMessageInputOptions } from "./useMessageInput";
import { useResourceSelect } from "./useResourceSelect";
import { readResource } from "../../../runtime/mcp/readResource";
import { mcpResourceRuntime } from "../../../runtime/mcp/mcpResourceRuntime";
import { urlAttachmentRuntime } from "../../../runtime/files/urlAttachmentRuntime";
import { ResourceTemplateArgumentsModal } from "./ResourceTemplateArgumentsModal";
import { applyTemplateParams, extractTemplateParams } from "./resourceTemplateUri";
import { ServerManagementModal } from "../../mcp-servers/ServerManagementModal";
import { PromptSelectModal } from "../../mcp-prompts/PromptSelectModal";
import { PromptArgumentsModal } from "../../mcp-prompts/PromptArgumentsModal";
import { useAutoPromptExecution } from "../../mcp-prompts/useAutoPromptExecution";
import { getPrompts } from "../../../runtime/mcp/mcpPrompts";
import { ContextSearchModal } from "./context-search/ContextSearchModal";
import { useChatAttachmentAdmission } from "./useChatAttachmentAdmission";
import { UrlAttachmentModal } from "../../attachments/UrlAttachmentModal";

type ChatInputMenuOptions = Pick<UseMessageInputOptions, "disabled" | "onPromptExecute"> & {
  mode: "chat" | "agent" | "realtime";
};

// Keep composer actions and their dialogs identical across chat and realtime.
export function useChatInputMenu(props: ChatInputMenuOptions) {
  const { Button, Menu } = useTheme();
  const { t } = useTranslation();
  const includeContext = props.mode !== "agent";
  const mcpServerContent = useAppStore((s) => s.mcpServerContent);
  const mcpServers = useAppStore((s) => s.mcpServers);
  const updateMcpServers = useAppStore((s) => s.updateMcpServers);
  const resourceSelect = useResourceSelect();
  const [resourceLoading, setResourceLoading] = useState(false);
  const [serverManagementOpen, setServerManagementOpen] = useState(false);
  const [contextSearchOpen, setContextSearchOpen] = useState(false);
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [prompts, setPrompts] = useState<PromptWithSource[]>([]);
  const [promptSelectOpen, setPromptSelectOpen] = useState(false);
  const [argumentPrompt, setArgumentPrompt] = useState<PromptWithSource | undefined>(undefined);
  const [selectedResourceTemplate, setSelectedResourceTemplate] = useState<{
    serverKey: string;
    resourceTemplate: ResourceTemplate;
  } | null>(null);
  const [resourceTemplateModalOpen, setResourceTemplateModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const addChatAttachments = useChatAttachmentAdmission();
  const hasPrompts = Object.values(mcpServerContent).some((content) => content.capabilities?.prompts);

  const onServerManagementHide = (enabledServers: Set<string>) => {
    setServerManagementOpen(false);
    const updates = Object.fromEntries(Object.entries(mcpServers).map(([name, server]) => [name, {
      ...server.config,
      disabled: !enabledServers.has(name),
    }]));
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
    enabled: !props.disabled,
    onPromptExecute: props.onPromptExecute as any,
    setArgumentPrompt,
    setOpen: setPromptSelectOpen,
  });

  const chatInputMenuItems: MenuItemProps[] = [
    ...(includeContext ? [{
      key: "search-context",
      label: t("search") ?? "Search",
      icon: "search" as IconToken,
      onClick: () => setContextSearchOpen(true),
    }] : []),
    {
      key: "select-file",
      label: t("attachments"),
      icon: "attachment" as IconToken,
      onClick: () => fileInputRef.current?.click(),
    },
    {
      key: "add-url",
      label: t("urlAttachment.title"),
      icon: "attachment" as IconToken,
      onClick: () => setUrlModalOpen(true),
    },
    {
      key: "prompts",
      label: t("promptSelectModal.title"),
      icon: "prompts" as IconToken,
      disabled: !hasPrompts,
      onClick: openPromptSelect,
    },
    ...(includeContext ? [{
      key: "resources",
      label: t("mcp.resources"),
      icon: "resources" as IconToken,
      disabled: !resourceSelect.hasResources,
      onClick: () => {
        if (!resourceSelect.hasResources) return;
        resourceSelect.setOpen(true);
      },
    }] : []),
    {
      key: "model-context",
      label: "Model Context",
      icon: "mcpServer" as IconToken,
      onClick: () => setServerManagementOpen(true),
    },
  ];

  return {
    resourceLoading,
    controls: <>
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
                addChatAttachments(e.target.files);
                e.target.value = "";
              }}
            />

            <ServerManagementModal show={serverManagementOpen} onHide={onServerManagementHide} />
            <UrlAttachmentModal open={urlModalOpen} onHide={() => setUrlModalOpen(false)}
              onAdd={urlAttachmentRuntime.add} />

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
      {includeContext && <>
            <ContextSearchModal
              open={contextSearchOpen}
              onClose={closeContextSearch}
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

      </>}
    </>,
  };
}
