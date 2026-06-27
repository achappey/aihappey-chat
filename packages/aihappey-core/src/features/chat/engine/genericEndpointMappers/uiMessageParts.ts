import type { UIMessage } from "aihappey-ai";
import type { DataUrl, GenericMappedFilePart, GenericMappedMessage } from "./types";

export const parseDataUrl = (url: string): DataUrl | undefined => {
  const match = url.match(/^data:([^;,]+);base64,(.+)$/i);
  if (!match) return undefined;
  return {
    mimeType: match[1] || "application/octet-stream",
    base64: match[2] || "",
    dataUrl: url,
  };
};

export const isSupportedChatRole = (role: unknown): role is GenericMappedMessage["role"] =>
  role === "system" || role === "user" || role === "assistant";

export const getTextFromPart = (part: any): string => {
  if (!part || typeof part !== "object") return "";
  if (typeof part.text === "string") return part.text;
  if (typeof part.content === "string") return part.content;
  if (typeof part.output_text === "string") return part.output_text;
  return "";
};

export const isTextPart = (part: any) => {
  const type = String(part?.type ?? "");
  return type === "text" || type === "reasoning" || type === "redacted-reasoning" || getTextFromPart(part).length > 0;
};

export const isReasoningPart = (part: any) => {
  const type = String(part?.type ?? "");
  return type === "reasoning" || type === "redacted-reasoning" || type.includes("reasoning");
};

export const isToolPart = (part: any) => String(part?.type ?? "").startsWith("tool-") || !!part?.toolCallId;

export const mapFilePart = (part: any): GenericMappedFilePart | undefined => {
  if (!part || part.type !== "file") return undefined;

  const url = typeof part.url === "string" ? part.url : undefined;
  const parsed = url ? parseDataUrl(url) : undefined;
  const mimeType = part.mediaType || part.mimeType || parsed?.mimeType || "application/octet-stream";
  const filename = part.filename || part.name || part.id;

  return {
    id: part.id,
    filename,
    mimeType,
    dataUrl: parsed?.dataUrl ?? url,
    base64: parsed?.base64,
    url,
    raw: part,
  };
};

export const mapUiMessages = (messages: UIMessage[] = []): GenericMappedMessage[] =>
  messages
    .filter((message: any) => isSupportedChatRole(message?.role))
    .map((message: UIMessage) => {
      const parts = (message.parts ?? []) as any[];
      const textParts = parts.map(getTextFromPart).filter(Boolean);
      const nonReasoningTextParts = parts
        .filter((part) => !isReasoningPart(part))
        .map(getTextFromPart)
        .filter(Boolean);
      const fileParts = parts.map(mapFilePart).filter((part): part is GenericMappedFilePart => !!part);
      const reasoningParts = parts.filter(isReasoningPart);
      const toolParts = parts.filter(isToolPart);
      const otherParts = parts.filter((part) => !isTextPart(part) && !mapFilePart(part) && !isToolPart(part));

      return {
        role: message.role as GenericMappedMessage["role"],
        text: textParts.join("\n\n").trim(),
        textParts,
        nonReasoningTextParts,
        fileParts,
        reasoningParts,
        toolParts,
        otherParts,
        raw: message,
      };
    })
    .filter((message) => message.text.length > 0 || message.fileParts.length > 0 || message.toolParts.length > 0 || message.reasoningParts.length > 0);

export const toInlineFileData = (file: GenericMappedFilePart): string | undefined => {
  if (file.dataUrl?.startsWith("data:")) return file.dataUrl;
  if (file.base64) return `data:${file.mimeType || "application/octet-stream"};base64,${file.base64}`;
  return undefined;
};

export const getSystemText = (messages: GenericMappedMessage[]) =>
  messages.find((message) => message.role === "system")?.text;
