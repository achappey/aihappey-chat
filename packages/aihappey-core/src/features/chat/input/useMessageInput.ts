import { useState, useRef, KeyboardEvent, FormEvent, ClipboardEvent } from "react";
import { useAppStore } from "aihappey-state";
import { useTranslation } from "aihappey-i18n";
import { TagItem } from "aihappey-types";
import { useDarkMode } from "usehooks-ts";
import { useChatContext } from "../context/ChatContext";
import { PromptWithSource } from "../../mcp-prompts/PromptSelectButton";
import { mcpResourceRuntime, useSelectedResources } from "../../../runtime/mcp/mcpResourceRuntime";
import { fileAttachmentRuntime, useFileAttachments } from "../../../runtime/files/fileAttachmentRuntime";

export interface UseMessageInputOptions {
  model?: string;
  streaming?: boolean;
  disabled?: boolean;
  temperature?: number
  temperatureChanged?: any
  onSend: (content: string) => void;
  onPromptExecute?: (prompt: PromptWithSource, args: any) => void;
  onStop?: () => void;
}

export const getIcon = (icons?: any[], isDarkMode?: boolean) => {
  const themedIcon = icons?.find(icon =>
    (isDarkMode && icon.theme === "dark") || (!isDarkMode && icon.theme === "light")
  );
  return themedIcon?.src || icons?.[0]?.src;
}

export function useMessageInput({
  streaming = false,
  onSend,
  onStop,
}: UseMessageInputOptions) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const providerMetadata = useAppStore((s) => s.providerMetadata);
  const setProviderMetadata = useAppStore((s) => s.setProviderMetadata);
  const resetChatSettings = useAppStore((s) => s.resetChatSettings);
  const mcpServerContent = useAppStore((s) => s.mcpServerContent);
  const updateMcpServer = useAppStore((s) => s.updateMcpServer);
  const toggleEnabledProvider = useAppStore((s) => s.toggleEnabledProvider);
  const selectedAgents = useAppStore((s) => s.selectedAgentNames);
  const chatMode = useAppStore((s) => s.chatMode);
  const { isDarkMode } = useDarkMode();
  const mcpServers = useAppStore((s) => s.mcpServers);
  const resources = useSelectedResources(mcpResourceRuntime)
  const attachments = useFileAttachments(fileAttachmentRuntime)
  const connected = Object.keys(mcpServers)
    .filter(z => !mcpServers[z].config.disabled)
    .map(z => ({
      name: z,
      serverItem: mcpServers[z]
    }))

  const { t } = useTranslation();
  const config = useChatContext();
  config.config.defaultProviders;

  const onDisconnectServer = async (url: string) => {
    updateMcpServer(url, {
      ...mcpServers[url].config,
      disabled: true
    })
  }

  const serverTags: TagItem[] = connected.map((url) => {
    // const remote = url.server.remotes?.find(a => a.type == "streamable-http");
    const version = mcpServerContent[url.name]?.version;
    const name = version?.title || version?.name || url.name; // fallback to URL if name/title missing
    const selectedIcon = getIcon(version?.icons, isDarkMode);

    return {
      key: url.name,
      label: name,
      icon: selectedIcon ? undefined : "mcpServer",
      image: selectedIcon,
    };
  });

  // Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      Array.from(e.target.files).forEach((file) => fileAttachmentRuntime.add(file));
      e.target.value = "";
    }
  };

  const chatReset = () => {
    resetChatSettings();
    if (config.config.defaultProviders && config.config.defaultProviders.length > 0) {
      for (var prov in config.config?.defaultProviders) {
        toggleEnabledProvider(prov)
      }
    }
    else {
      toggleEnabledProvider("pollinations")
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.clipboardData && e.clipboardData.items) {
      for (let i = 0; i < e.clipboardData.items.length; i++) {
        const item = e.clipboardData.items[i];
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) fileAttachmentRuntime.add(file);
        }
      }
    }
    // Do not preventDefault, so text paste works as normal
  };

  const handleChange = (val: string) => {
    setValue(val);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 100);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = (!!value.trim() || attachments.length > 0 || resources.length > 0)
    && (chatMode == "chat" || selectedAgents.length > 0);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!canSend) return;
    if (streaming && onStop) onStop();
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSend();
  };


  return {
    value,
    setValue,
    textareaRef,
    fileInputRef,
    handleChange,
    handleKeyDown,
    handlePaste,
    handleFileChange,
    handleSubmit,
    handleSend,
    setProviderMetadata,
    providerMetadata,
    canSend,
    resetChatSettings: chatReset,
    disconnectServer: onDisconnectServer,
    serverTags,
    attachments,
    t,
  };
}
