import { useCallback } from "react";
import { UIMessage, MessageRole } from "aihappey-types";
import { useAppStore } from "aihappey-state";
import * as exifr from 'exifr';
import { PromptWithSource } from "../../mcp-prompts/PromptSelectButton";
import { toMarkdownLinkSmart } from "../files/markdown";
import { fileToDataUrl } from "../files/file";
import { useResourceParts } from "./useResourceParts";
import { fileAttachmentRuntime, useFileAttachments } from "../../../runtime/files/fileAttachmentRuntime";
import { getPrompt } from "../../../runtime/mcp/mcpPrompts";

type AttachmentPart = {
  type: "file";
  filename: string;
  mediaType: string;
  url: string;
};

type TextPart = {
  type: "text";
  text: string;
};

type UseUserMessageBuilderProps = {
  //attachments: File[];
  // resourceParts: Array<TextPart | AttachmentPart>;
  extractExif?: boolean
  getAttachmentParts: () => Promise<{ parts: any[]; convertedKeys: string[] }>;
  // clients: Record<string, any> | undefined;
};

export function useUserMessageBuilder({
  getAttachmentParts,
  extractExif
}: UseUserMessageBuilderProps) {
  const resourceParts = useResourceParts();
  const attachments = useFileAttachments(fileAttachmentRuntime)

  const sendRawAttachments = useAppStore((s) => s.sendRawAttachments);
  const maxAttachmentsSize = useAppStore((s) => s.maxAttachmentsSize);

  const maxSize = typeof maxAttachmentsSize === "number" ? maxAttachmentsSize : 25 * 1024 * 1024;

  // Shared logic: builds message parts from args, plus (optional) promptParts
  const buildParts = useCallback(
    async (opts: { text?: string; promptParts?: TextPart[] }) => {
      const rawAttachmentParts: (AttachmentPart | TextPart)[] = [];

      const extracted = await getAttachmentParts?.();
      const extractedTextParts = extracted?.parts ?? [];
      const convertedKeySet = new Set(extracted?.convertedKeys ?? []);

      for (const a of attachments ?? []) {
        if (!a || a.size > maxSize) continue;

        // Hard check: if this attachment was converted to text and raw sending is disabled, omit it.
        const key = a.name;
        const wasConverted = convertedKeySet.has(key);
        if (wasConverted && sendRawAttachments === false) {
          continue;
        }

        // file part
        const url = await fileToDataUrl(a as File);
        rawAttachmentParts.push({
          type: 'file' as const,
          filename: a.name,
          mediaType: a.type && a.type.length > 0 ? a.type : a.name.endsWith(".yaml")
            ? "application/yaml" : a.type,
          url,
        });

        // all exif fields
        if (extractExif && a.type.startsWith('image/')) {
          try {
            const meta = await exifr.parse(a as File); // full object
            if (meta && Object.keys(meta).length > 0) {
              rawAttachmentParts.push({
                type: 'text',
                text: `EXIF (${a.name}):\n\`\`\`json\n${JSON.stringify(meta, null, 2)}\n\`\`\``,
              });
            }
          } catch (err) {
            console.warn('EXIF uitlezen mislukt', err);
          }
        }
      }

      return [
        ...(resourceParts ?? []),
        ...(extractedTextParts ?? []),
        ...rawAttachmentParts,
        ...(opts.promptParts ?? []),
        ...(opts.text && opts.text.trim() ? [{ type: 'text', text: opts.text }] : []),
      ];
    },
    [attachments, resourceParts, getAttachmentParts, extractExif, sendRawAttachments, maxSize]
  );


  // 1. Build from user text
  const buildFromText = useCallback(
    async (text: string): Promise<UIMessage | undefined> => {
      const parts = await buildParts({ text });
      if (parts.length === 0) return undefined;
      return {
        id: crypto.randomUUID(),
        role: "user" as MessageRole,
        parts,
        metadata: { timestamp: new Date().toISOString() },
      };
    },
    [buildParts]
  );

  // 2. Build from prompt (+ optional args)
  const buildFromPrompt = useCallback(
    async (
      prompt: PromptWithSource,
      args?: Record<string, string>
    ): Promise<UIMessage | undefined> => {
      const result = await getPrompt(prompt._serverName!, prompt.name, args ?? {});
      const messages = result.messages ?? [];
      const promptParts: TextPart[] = messages.map((m: any) => ({
        type: "text",
        text:
          m.content.text ??
          (m.content.resource
            ? toMarkdownLinkSmart(
              m.content.resource.uri,
              m.content.resource.text as string,
              m.content.resource.mimeType
            )
            : ""),
      }));
      const parts = await buildParts({ promptParts });
      if (parts.length === 0) return undefined;
      return {
        id: crypto.randomUUID(),
        role: "user" as MessageRole,
        parts,
        metadata: { timestamp: new Date().toISOString() },
      };
    },
    [buildParts]
  );

  return { buildFromText, buildFromPrompt };
}
