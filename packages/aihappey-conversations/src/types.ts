import type { Conversation, UIMessage } from "aihappey-types/src/chat";

export type StorageKind = "local" | "remote";

export interface ConversationSummary {
  id: string;
  name: string;
  messageCount: number;
  activityAt: string;
  updatedAt: string;
}

export interface ConversationSearchHit {
  conversationId: string;
  messageId: string | null;
  messageIndex: number;
  role: string;
  partIndex: number;
  matchIndex: number;
  snippet: string;
}

export interface ConversationSearchResult {
  query: string;
  total: number;
  limit: number;
  results: ConversationSearchHit[];
}

export type ConversationReadOptions = { signal?: AbortSignal };
export type ConversationLoadAllOptions = ConversationReadOptions & {
  concurrency?: number;
  onProgress?: (loaded: number, total: number) => void;
};

export interface ConversationStore {
  readonly kind: StorageKind;

  list(): Promise<ConversationSummary[]>;
  get(id: string, options?: ConversationReadOptions): Promise<Conversation | undefined>;
  loadAll(options?: ConversationLoadAllOptions): Promise<Conversation[]>;
  search(query: string, limit?: number, options?: ConversationReadOptions): Promise<ConversationSearchResult>;
  create(name: string, temperature?: number, mcpServers?: string[]): Promise<Conversation>;
  rename(id: string, name: string): Promise<void>;
  import(conversation: Conversation): Promise<string>;
  setTemperature(id: string, temperature: number): Promise<void>;
  addServer(id: string, mcpServerUrl: string): Promise<void>;
  removeServer(id: string, mcpServerUrl: string): Promise<void>;
  remove(id: string): Promise<void>;

  addMessage(cid: string, msg: UIMessage): Promise<void>;
  updateMessage(cid: string, mid: string, up: Partial<UIMessage>): Promise<void>;

  /** Remove a single message from the conversation. */
  removeMessage(cid: string, mid: string): Promise<void>;
}
