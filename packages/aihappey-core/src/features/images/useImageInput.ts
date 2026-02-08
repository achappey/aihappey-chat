import { useState, useRef, KeyboardEvent, FormEvent, ClipboardEvent } from "react";
import { useAppStore } from "aihappey-state";
import { useTranslation } from "aihappey-i18n";
import { fileAttachmentRuntime, useFileAttachments } from "../../runtime/files/fileAttachmentRuntime";
import { useChatContext } from "../chat/context/ChatContext";

export interface UseImagePromptInputOptions {
  model?: string;
  streaming?: boolean;
  disabled?: boolean;
  temperature?: number
  temperatureChanged?: any
  onSend: (content: string) => void;
  onStop?: () => void;
}

export const getIcon = (icons?: any[], isDarkMode?: boolean) => {
  const themedIcon = icons?.find(icon =>
    (isDarkMode && icon.theme === "dark") || (!isDarkMode && icon.theme === "light")
  );
  return themedIcon?.src || icons?.[0]?.src;
}

export function useImageInput({
  streaming = false,
  onSend,
  onStop,
}: UseImagePromptInputOptions) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const providerMetadata = useAppStore((s) => s.providerMetadata);
  const setProviderMetadata = useAppStore((s) => s.setProviderMetadata);
  const resetChatSettings = useAppStore((s) => s.resetChatSettings);
  const setEnabledProvidersForType = useAppStore((s) => s.setEnabledProvidersForType);
  const attachments = useFileAttachments(fileAttachmentRuntime)
  const { t } = useTranslation();
  const config = useChatContext();
  const chatReset = () => {
    resetChatSettings();
    setEnabledProvidersForType("image", config.config.defaultProvidersByType?.image ?? []);
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

  const canSend = (!!value.trim());

  const handleSend = () => {
    const trimmed = value.trim();
    if (!canSend) return;
    if (streaming && onStop) onStop();
    onSend(trimmed);
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
    handleChange,
    handleKeyDown,
    handlePaste,
    handleSubmit,
    handleSend,
    setProviderMetadata,
    providerMetadata,
    canSend,
    resetChatSettings: chatReset,
    attachments,
    t,
  };
}
