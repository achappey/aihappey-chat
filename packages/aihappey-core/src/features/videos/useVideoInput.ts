import { useState, useRef, KeyboardEvent, FormEvent, ClipboardEvent } from "react";
import { useTranslation } from "aihappey-i18n";

export interface UseVideoPromptInputOptions {
  model?: string;
  streaming?: boolean;
  disabled?: boolean;
  onSend: (content: string) => void;
  onStop?: () => void;
  onAddAttachments?: (files: File[]) => void;
  attachments?: File[];
  onRemoveAttachment?: (name: string) => void;
}

export function useVideoInput({
  streaming = false,
  onSend,
  onStop,
  onAddAttachments,
}: UseVideoPromptInputOptions) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useTranslation();

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.clipboardData && e.clipboardData.items) {
      for (let i = 0; i < e.clipboardData.items.length; i++) {
        const item = e.clipboardData.items[i];
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file && onAddAttachments) onAddAttachments([file]);
        }
      }
    }
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

  const canSend = !!value.trim();

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
    canSend,
    t,
  };
}
