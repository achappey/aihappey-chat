// Chat domain primitives

import { IconToken } from "./theme/IconToken";
export type MessageRole = "user" | "assistant" | "system";
import type {
  FileUIPart, TextUIPart, ReasoningUIPart, DataUIPart,
  ToolUIPart, SourceUrlUIPart, SourceDocumentUIPart
} from "ai";

export type ChatMessageProviderIcon = {
  src: string;
  theme?: string;
  alt?: string;
};

export type ChatMessageEvaluationStatus = "passed" | "mixed" | "failed";

export type ChatMessageEvaluationSummary = {
  passed: number;
  failed: number;
  total: number;
  status: ChatMessageEvaluationStatus;
};

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: (TextUIPart | ReasoningUIPart | ToolUIPart | DataUIPart<any>)[]
  attachments?: FileUIPart[]
  sources?: (SourceUrlUIPart | SourceDocumentUIPart)[]
  /** Hide message-level usage badges, sources, and attachments on non-summary cards. */
  hideMessageSummaryActions?: boolean;
  createdAt: string;
  author?: string;
  temperature?: number;
  messageIcon?: IconToken
  messageLabel?: string
  providerKey?: string;
  providerName?: string;
  providerIcon?: ChatMessageProviderIcon;
  totalTokens?: number;
  usage?: any;
  cost?: number;
  /** Gateway time to first token, in seconds. */
  ttft?: number;
  /** Gateway generation throughput, in tokens per second. */
  tps?: number;
  evaluations?: Record<string, unknown>;
  evaluationSummary?: ChatMessageEvaluationSummary;
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
