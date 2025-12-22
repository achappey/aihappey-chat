import type { Conversation, UIMessage } from "aihappey-types/src/chat";

export type StorageKind = "local" | "remote";

export interface ConversationStore {
  readonly kind: StorageKind;

  list(): Promise<Conversation[]>;
  get(id: string): Promise<Conversation | undefined>;
  create(name: string, temperature?: number, mcpServers?: string[]): Promise<Conversation>;
  rename(id: string, name: string): Promise<void>;
  import(conversation: Conversation): Promise<string>;
  setTemperature(id: string, temperature: number): Promise<void>;
  addServer(id: string, mcpServerUrl: string): Promise<void>;
  removeServer(id: string, mcpServerUrl: string): Promise<void>;
  remove(id: string): Promise<void>;

  addMessage(cid: string, msg: UIMessage): Promise<void>;
  updateMessage(cid: string, mid: string, up: Partial<UIMessage>): Promise<void>;
}
