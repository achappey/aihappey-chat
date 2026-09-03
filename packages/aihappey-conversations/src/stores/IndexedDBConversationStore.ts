import { get, set } from "idb-keyval";
import type { Conversation, UIMessage } from "aihappey-types/src/chat";
import type {
  ConversationLoadAllOptions,
  ConversationReadOptions,
  ConversationSearchResult,
  ConversationStore,
  ConversationSummary,
} from "../types";

const DB_KEY = "aihappey_conversations_v1";

const timestamp = (value: unknown): string | undefined => {
  if (typeof value !== "string" || !value.trim()) return undefined;
  return Number.isNaN(Date.parse(value)) ? undefined : new Date(value).toISOString();
};

const activityAt = (conversation: Conversation): string => {
  for (let index = (conversation.messages ?? []).length - 1; index >= 0; index -= 1) {
    const value = timestamp(conversation.messages[index]?.metadata?.timestamp);
    if (value) return value;
  }
  return new Date(0).toISOString();
};

const summary = (conversation: Conversation): ConversationSummary => ({
  id: conversation.id,
  name: conversation.metadata?.name ?? "New chat",
  messageCount: conversation.messages?.length ?? 0,
  activityAt: activityAt(conversation),
  // The existing local format has no record update timestamp.
  updatedAt: activityAt(conversation),
});

const textParts = (message: UIMessage): string[] => (message.parts ?? [])
  .filter((part) => part?.type === "text" && typeof part.text === "string")
  .map((part) => part.text);

async function load(): Promise<Conversation[]> {
  if (typeof window === "undefined") return [];
  try {
    return (await get(DB_KEY)) ?? [];
  } catch {
    return [];
  }
}

async function save(list: Conversation[]) {
  if (typeof window !== "undefined")
    await set(DB_KEY, list);
}

export class IndexedDBConversationStore implements ConversationStore {
  readonly kind = "local";
  private data: Conversation[] = [];
  private loaded = false;

  private async ensureLoaded() {
    if (!this.loaded) {
      this.data = await load();
      this.loaded = true;
    }
  }

  private async commit() {
    await save(this.data);
  }

  import = async (conv: Conversation): Promise<string> => {

    await this.ensureLoaded();

    let id = conv.id;

    // If ID already exists, generate new one to avoid collisions
    if (this.data.some(c => c.id === id)) {
      id = crypto.randomUUID();
    }

    const imported: Conversation = {
      ...conv,
      id,
      messages: conv.messages ?? [],
      metadata: {
        name: conv.metadata?.name ?? "Imported chat",
        temperature: conv.metadata?.temperature ?? 1,
        mcpServers: conv.metadata?.mcpServers ?? []
      }
    };

    this.data = [imported, ...this.data];
    await this.commit();

    return id;

  };


  list = async (): Promise<ConversationSummary[]> => {
    await this.ensureLoaded();
    return this.data.map(summary).sort((a, b) => b.activityAt.localeCompare(a.activityAt));
  };

  get = async (id: string, options?: ConversationReadOptions): Promise<Conversation | undefined> => {

    await this.ensureLoaded();
    if (options?.signal?.aborted) throw new DOMException("Loading cancelled", "AbortError");
    return this.data.find((c) => c.id === id);
  };

  loadAll = async (options: ConversationLoadAllOptions = {}): Promise<Conversation[]> => {
    await this.ensureLoaded();
    if (options.signal?.aborted) throw new DOMException("Loading cancelled", "AbortError");
    options.onProgress?.(this.data.length, this.data.length);
    return [...this.data];
  };

  search = async (
    query: string,
    limit = 20,
    options?: ConversationReadOptions,
  ): Promise<ConversationSearchResult> => {
    await this.ensureLoaded();
    if (options?.signal?.aborted) throw new DOMException("Loading cancelled", "AbortError");
    const q = query.trim();
    if (!q) throw new Error("Missing query.");
    const terms = Array.from(new Set(q.toLocaleLowerCase().split(/\s+/).filter(Boolean)));
    const cappedLimit = Math.max(1, Math.min(50, Number(limit ?? 20)));
    const results: ConversationSearchResult["results"] = [];

    for (const conversation of this.data) {
      for (let messageIndex = 0; messageIndex < conversation.messages.length; messageIndex += 1) {
        const message = conversation.messages[messageIndex];
        const parts = textParts(message);
        for (let partIndex = 0; partIndex < parts.length; partIndex += 1) {
          const text = parts[partIndex];
          const haystack = text.toLocaleLowerCase();
          const indexes = terms.map((term) => haystack.indexOf(term));
          if (indexes.some((index) => index < 0)) continue;
          const first = Math.min(...indexes);
          const compact = text.replace(/\s+/g, " ").trim();
          const start = compact.length > 320 ? Math.max(0, first - 90) : 0;
          const excerpt = compact.slice(start, compact.length > 320 ? start + 260 : undefined);
          results.push({
            conversationId: conversation.id,
            messageId: message.id ?? null,
            messageIndex,
            role: message.role ?? "unknown",
            partIndex,
            matchIndex: first,
            snippet: `${start ? "…" : ""}${excerpt}${start + excerpt.length < compact.length ? "…" : ""}`,
          });
          if (results.length >= cappedLimit) break;
        }
        if (results.length >= cappedLimit) break;
      }
      if (results.length >= cappedLimit) break;
    }
    return { query: q, total: results.length, limit: cappedLimit, results };
  };

  create = async (name: string, temperature?: number): Promise<Conversation> => {

    await this.ensureLoaded();
    const conv: Conversation = {
      id: crypto.randomUUID(),
      messages: [],
      metadata: {
        name,
        temperature: typeof temperature === "number" ? temperature : 1
      }
    };
    this.data = [conv, ...this.data];
    await this.commit();
    return conv;

  };

  addServer = async (id: string, mcpServerUrl: string): Promise<void> => {

    await this.ensureLoaded();
    this.data = this.data.map((c) =>
      c.id === id
        ? {
          ...c,
          metadata: {
            ...c.metadata,
            mcpServers: Array.isArray(c.metadata?.mcpServers)
              ? c.metadata.mcpServers.includes(mcpServerUrl)
                ? c.metadata.mcpServers // already exists, no change
                : [...c.metadata.mcpServers, mcpServerUrl]
              : [mcpServerUrl],
          },
        }
        : c
    );
    await this.commit();

  };

  removeServer = async (id: string, mcpServerUrl: string): Promise<void> => {

    await this.ensureLoaded();
    this.data = this.data.map((c) =>
      c.id === id
        ? {
          ...c,
          metadata: {
            ...c.metadata,
            mcpServers: Array.isArray(c.metadata?.mcpServers)
              ? c.metadata.mcpServers.filter((url: string) => url !== mcpServerUrl)
              : [],
          },
        }
        : c
    );
    await this.commit();

  };

  setTemperature = async (id: string, temperature: number): Promise<void> => {

    await this.ensureLoaded();
    this.data = this.data.map((c) =>
      c.id === id ? {
        ...c, metadata: {
          ...c.metadata,
          temperature: temperature
        }
      } : c
    );
    await this.commit();

  };

  rename = async (id: string, name: string): Promise<void> => {

    await this.ensureLoaded();
    this.data = this.data.map((c) =>
      c.id === id ? {
        ...c, metadata: {
          ...c.metadata,
          name: name
        }
      } : c
    );
    await this.commit();

  };

  remove = async (id: string): Promise<void> => {

    await this.ensureLoaded();
    this.data = this.data.filter((c) => c.id !== id);
    await this.commit();

  };

  addMessage = async (cid: string, msg: UIMessage): Promise<void> => {


    await this.ensureLoaded();
    this.data = this.data.map((c) =>
      c.id === cid ? { ...c, messages: [...c.messages, msg] } : c
    );
    await this.commit();

  };


  updateMessage = async (
    cid: string,
    mid: string,
    up: Partial<UIMessage>
  ): Promise<void> => {

    await this.ensureLoaded();
    let foundConversation = false;
    let foundMessage = false;

    this.data = this.data.map((c) => {
      if (c.id !== cid) return c;
      foundConversation = true;
      const messages = c.messages.map((m) => {
        if (m.id !== mid) return m;
        foundMessage = true;
        return { ...m, ...up };
      });
      return { ...c, messages };
    });

    if (!foundConversation) {
      throw new Error(`Conversation ${cid} not found`);
    }
    if (!foundMessage) {
      throw new Error(`Message ${mid} not found in conversation ${cid}`);
    }

    await this.commit();

  };

  removeMessage = async (cid: string, mid: string): Promise<void> => {

    await this.ensureLoaded();
    let foundConversation = false;
    let removedMessage = false;

    this.data = this.data.map((c) => {
      if (c.id !== cid) return c;
      foundConversation = true;
      const before = c.messages.length;
      const messages = c.messages.filter((m) => m.id !== mid);
      removedMessage = removedMessage || messages.length !== before;
      return { ...c, messages };
    });

    await this.commit();

  };

}
