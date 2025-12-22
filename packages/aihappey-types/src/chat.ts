// Chat domain primitives

import { IconToken } from "./theme/IconToken";
export type MessageRole = "user" | "assistant" | "system";
import type { FileUIPart, TextUIPart, ReasoningUIPart, DataUIPart, ToolUIPart } from "ai";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: (TextUIPart | ReasoningUIPart | ToolUIPart | DataUIPart<any>)[]
  attachments?: FileUIPart[]
  // reactions?: React.ReactNode
  //  content: React.ReactNode;
  //  text: string;
  createdAt: string;
  author?: string;
  temperature?: number;
  messageIcon?: IconToken
  messageLabel?: string
  totalTokens?: number;
  //  elicit?: any
  //  onRespond?: any
  //  isReasoningGroup?: boolean
  // reasoningItems?: any
  /* sources?: { title?: string; url: string }[];
   attachments?: any[];
   tools?: any[];
   totalTokens?: number;
   temperature?: number;
   copyToClipboard?: () => Promise<void>
   download?: () => void*/
}

export interface ChatMessage2 {
  id: string;
  role: MessageRole;
  //  content: React.ReactNode;
  text: string;
  createdAt?: string;
  author?: string;
  messageIcon?: IconToken
  messageLabel?: string
  elicit?: any
  onRespond?: any
  isReasoningGroup?: boolean
  reasoningItems?: any
  sources?: { title?: string; url: string }[];
  attachments?: any[];
  tools?: any[];
  totalTokens?: number;
  temperature?: number;
  copyToClipboard?: () => Promise<void>
  download?: () => void
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
