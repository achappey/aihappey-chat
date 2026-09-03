import type { Conversation, UIMessage } from "aihappey-types/src/chat";
import type {
  ConversationLoadAllOptions,
  ConversationReadOptions,
  ConversationSearchResult,
  ConversationStore,
  ConversationSummary,
} from "../types";

const LS_KEY = "aihappey_conversations_v1";

function load(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function save(list: Conversation[]) {
  if (typeof window !== "undefined")
    localStorage.setItem(LS_KEY, JSON.stringify(list));
}

export class LocalConversationStore implements ConversationStore {
  readonly kind = "local";
  private data: Conversation[];

  constructor() {
    this.data = load();
  }
  removeMessage(cid: string, mid: string): Promise<void> {
    throw new Error("Method not implemented.");
  }

  private commit = () => {
    save(this.data);
  };

  import = async (conv: Conversation): Promise<string> => {
    let id = conv.id;

    // Avoid collisions
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
    this.commit();

    return id;
  };


  list = async (): Promise<ConversationSummary[]> => {
    return this.data.map((conversation) => {
      const activityAt = [...(conversation.messages ?? [])]
        .reverse()
        .map((message) => message.metadata?.timestamp)
        .find((value) => typeof value === "string" && !Number.isNaN(Date.parse(value)))
        ?? new Date(0).toISOString();
      return {
        id: conversation.id,
        name: conversation.metadata?.name ?? "New chat",
        messageCount: conversation.messages?.length ?? 0,
        activityAt,
        updatedAt: activityAt,
      };
    }).sort((a, b) => b.activityAt.localeCompare(a.activityAt));
  };

  get = async (id: string, options?: ConversationReadOptions): Promise<Conversation | undefined> => {
    if (options?.signal?.aborted) throw new DOMException("Loading cancelled", "AbortError");
    return this.data.find((c) => c.id === id);
  };

  loadAll = async (options: ConversationLoadAllOptions = {}): Promise<Conversation[]> => {
    if (options.signal?.aborted) throw new DOMException("Loading cancelled", "AbortError");
    options.onProgress?.(this.data.length, this.data.length);
    return [...this.data];
  };

  search = async (query: string, limit = 20, options?: ConversationReadOptions): Promise<ConversationSearchResult> => {
    if (options?.signal?.aborted) throw new DOMException("Loading cancelled", "AbortError");
    const q = query.trim();
    if (!q) throw new Error("Missing query.");
    const terms = Array.from(new Set(q.toLocaleLowerCase().split(/\s+/).filter(Boolean)));
    const cappedLimit = Math.max(1, Math.min(50, limit));
    const results: ConversationSearchResult["results"] = [];
    for (const conversation of this.data) {
      for (let messageIndex = 0; messageIndex < conversation.messages.length; messageIndex += 1) {
        const message = conversation.messages[messageIndex];
        const parts = (message.parts ?? []).filter((part) => part?.type === "text" && typeof part.text === "string");
        for (let partIndex = 0; partIndex < parts.length; partIndex += 1) {
          const text = parts[partIndex].text as string;
          const haystack = text.toLocaleLowerCase();
          const indexes = terms.map((term) => haystack.indexOf(term));
          if (indexes.some((index) => index < 0)) continue;
          const first = Math.min(...indexes);
          const compact = text.replace(/\s+/g, " ").trim();
          const start = compact.length > 320 ? Math.max(0, first - 90) : 0;
          const excerpt = compact.slice(start, compact.length > 320 ? start + 260 : undefined);
          results.push({ conversationId: conversation.id, messageId: message.id ?? null, messageIndex, role: message.role ?? "unknown", partIndex, matchIndex: first, snippet: `${start ? "…" : ""}${excerpt}${start + excerpt.length < compact.length ? "…" : ""}` });
          if (results.length >= cappedLimit) break;
        }
        if (results.length >= cappedLimit) break;
      }
      if (results.length >= cappedLimit) break;
    }
    return { query: q, total: results.length, limit: cappedLimit, results };
  };

  create = async (name: string): Promise<Conversation> => {
    const conv: Conversation = {
      id: crypto.randomUUID(),
      // name,
      messages: [],
      metadata: {
        name
      }
    };
    this.data = [conv, ...this.data];
    this.commit();
    return conv;
  };

  rename = async (id: string, name: string): Promise<void> => {
    this.data = this.data.map((c) =>
      c.id === id ? {
        ...c, metadata: {
          ...c.metadata,
          name
        }
      } : c
    );
    this.commit();
  };

  setTemperature = async (id: string, temperature: number): Promise<void> => {
    this.data = this.data.map((c) =>
      c.id === id ? {
        ...c, metadata: {
          ...c.metadata,
          temperature
        }
      } : c
    );
    this.commit();
  };

  addServer = async (id: string, serverUrl: string): Promise<void> => {
    this.data = this.data.map((c) =>
      c.id === id ? {
        ...c,
        metadata: {
          ...c.metadata,
          mcpServers: [...c.metadata?.mcpServers ?? [], serverUrl]
        }
      } : c
    );
    this.commit();
  };

  removeServer = async (id: string, serverUrl: string): Promise<void> => {
    this.data = this.data.map((c) =>
      c.id === id ? {
        ...c,
        metadata: {
          ...c.metadata,
          mcpServers: [...c.metadata?.mcpServers?.filter((a: any) => a != serverUrl) ?? []]
        }
      } : c
    );
    this.commit();
  };

  remove = async (id: string): Promise<void> => {
    this.data = this.data.filter((c) => c.id !== id);
    this.commit();
  };

  addMessage = async (cid: string, msg: UIMessage): Promise<void> => {
    this.data = this.data.map((c) =>
      c.id === cid ? { ...c, messages: [...c.messages, msg] } : c
    );
    this.commit();
  };

  updateMessage = async (
    cid: string,
    mid: string,
    up: Partial<UIMessage>
  ): Promise<void> => {
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

    this.commit();
  };

}
