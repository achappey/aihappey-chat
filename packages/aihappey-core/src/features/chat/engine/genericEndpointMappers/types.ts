import type { ChatEndpointId } from "aihappey-state";
import type { UIMessage } from "aihappey-ai";

export type GenericEndpointId = Exclude<ChatEndpointId, "/api/chat">;

export type GenericChatEndpointRequestBody = {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  messages?: UIMessage[];
  [key: string]: any;
};

export type DataUrl = {
  mimeType: string;
  base64: string;
  dataUrl: string;
};

export type GenericMappedFilePart = {
  id?: string;
  filename?: string;
  mimeType: string;
  dataUrl?: string;
  base64?: string;
  url?: string;
  raw: any;
};

export type GenericMappedMessage = {
  role: "system" | "user" | "assistant";
  text: string;
  textParts: string[];
  fileParts: GenericMappedFilePart[];
  reasoningParts: any[];
  toolParts: any[];
  otherParts: any[];
  raw: UIMessage;
};

export const compactObject = <T extends Record<string, any>>(value: T): Partial<T> => Object.fromEntries(
  Object.entries(value).filter(([, entry]) => {
    if (entry === undefined || entry === null) return false;
    if (Array.isArray(entry)) return entry.length > 0;
    if (entry && typeof entry === "object") return Object.keys(entry).length > 0;
    return true;
  }),
) as Partial<T>;
