// Chat domain primitives

import { IconToken } from "./theme/IconToken";
export type MessageRole = "user" | "assistant" | "system";
import type {
  FileUIPart, TextUIPart, ReasoningUIPart, DataUIPart,
  ToolUIPart, SourceUrlUIPart, SourceDocumentUIPart
} from "ai";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: (TextUIPart | ReasoningUIPart | ToolUIPart | DataUIPart<any>)[]
  attachments?: FileUIPart[]
  sources?: (SourceUrlUIPart | SourceDocumentUIPart)[]
  createdAt: string;
  author?: string;
  temperature?: number;
  messageIcon?: IconToken
  messageLabel?: string
  totalTokens?: number;
}

export interface UIMessage {
  id: string;
  role: MessageRole;
  parts: any[];
  metadata?: Record<string, any>
}

export interface Conversation {
  id: string;
  //name: string;
  messages: UIMessage[];
  metadata?: Record<string, any>
}

export interface ToolCallResult {
  isError?: boolean;
  structuredContent?: any
  content: any[]
}

export const SYSTEM_ROLE = "system"