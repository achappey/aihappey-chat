import { useCallback } from "react";
import { UIMessage, MessageRole } from "aihappey-types";
import { useAppStore, type UiAttachment } from "aihappey-state";
import * as exifr from 'exifr';
import { PromptWithSource } from "../../mcp-prompts/PromptSelectButton";
import { toMarkdownLinkSmart } from "../files/markdown";
import { fileToDataUrl } from "../files/file";
import { useResourceParts } from "./useResourceParts";
import { fileAttachmentRuntime, useFileAttachments } from "../../../runtime/files/fileAttachmentRuntime";

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
  getAttachmentParts: () => Promise<any[]>;
  // clients: Record<string, any> | undefined;
};

const MAX_SIZE = 25 * 1024 * 1024;

export function useUserMessageBuilder({
  // attachments,
  // resourceParts,
  getAttachmentParts,
  //clients,
  extractExif
}: UseUserMessageBuilderProps) {
  const getPrompt = useAppStore((s) => s.getPrompt);
  const resourceParts = useResourceParts();
  const attachments = useFileAttachments(fileAttachmentRuntime)
  // Shared logic: builds message parts from args, plus (optional) promptParts
  const buildParts = useCallback(
    async (opts: { text?: string; promptParts?: TextPart[] }) => {
      const rawAttachmentParts: (AttachmentPart | TextPart)[] = [];

      for (const a of attachments ?? []) {
        //     if (!a.type.startsWith('image/') || !a.file || a.file.size > MAX_SIZE) continue;
        if (!a || a.size > MAX_SIZE) continue;

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

      const extractedTextParts = await getAttachmentParts?.();

      return [
        ...(resourceParts ?? []),
        ...(extractedTextParts ?? []),
        ...rawAttachmentParts,
        ...(opts.promptParts ?? []),
        ...(opts.text && opts.text.trim() ? [{ type: 'text', text: opts.text }] : []),
      ];
    },
    [attachments, resourceParts, getAttachmentParts, extractExif]
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
      //  const client = clients?.[prompt._url];
      // if (!client || typeof client.getPrompt !== "function") return undefined;
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
