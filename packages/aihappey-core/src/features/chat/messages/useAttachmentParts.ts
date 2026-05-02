import { fileAttachmentRuntime, useFileAttachments } from "../../../runtime/files/fileAttachmentRuntime";
import { useAppStore } from "aihappey-state";
import { extractTextFromFile } from "../files/file";
import { extractTextFromZip } from "../files/fileConverters";
import { toMarkdownLinkSmart } from "../files/markdown";

export const useAttachmentParts = () => {
  const attachments = useFileAttachments(fileAttachmentRuntime)
  const chatMode = useAppStore((s) => s.chatMode);
  const convertAttachmentsToText = useAppStore((s) => s.convertAttachmentsToText);
  const maxAttachmentsSize = useAppStore((s) => s.maxAttachmentsSize);

  // Keep a safe fallback if state is undefined
  const maxSize = typeof maxAttachmentsSize === "number" ? maxAttachmentsSize : 25 * 1024 * 1024;

  const getItems = async () => {
    // Only attempt conversion when enabled, and never in agent mode.
    if (!convertAttachmentsToText || chatMode === "agent") {
      return { parts: [], convertedKeys: [] as string[] };
    }

    const parts: any[] = [];
    const convertedKeys: string[] = [];

    for (const a of attachments ?? []) {
      // Apply size filtering here too, so convertedKeys is consistent with what we actually processed.
      if (!a || a.size > maxSize) continue;

      // Use a stable key that should match what the raw attachment builder sees.
      // (If duplicates exist, both will share the key; acceptable for the current rules.)
      const key = a.name;

      if (a.type === "application/zip" || /\.zip$/i.test(a.name)) {
        const zipParts = await extractTextFromZip(a);
        if (zipParts && zipParts.length > 0) {
          parts.push(...zipParts);
          convertedKeys.push(key);
        }
      } else {
        const text = await extractTextFromFile(a);
        if (text) {
          parts.push({
            type: "text",
            text: toMarkdownLinkSmart(a.name, text, a.type),
          });
          convertedKeys.push(key);
        }
      }
    }

    return { parts, convertedKeys };
  };

  return getItems
};
