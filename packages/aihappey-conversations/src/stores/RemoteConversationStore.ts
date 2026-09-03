import type { Conversation, UIMessage } from "aihappey-types/src/chat";
import type {
  ConversationLoadAllOptions,
  ConversationReadOptions,
  ConversationSearchResult,
  ConversationStore,
  ConversationSummary,
} from "../types";

export class RemoteConversationStore implements ConversationStore {
  readonly kind = "remote";
  private cache = new Map<string, Conversation>();
  private inflight = new Map<string, Promise<Conversation | undefined>>();
  private granularMessageMutations: Promise<boolean> | undefined;

  constructor(
    private apiUrl: string,
    private getToken: () => Promise<string | undefined>
  ) { }

  import = async (conv: Conversation): Promise<string> => {
    throw new Error("Not implemented")
  }

  list: () => Promise<ConversationSummary[]> = async () => {
    const res = await fetch(`${this.apiUrl}/summaries`, {
      headers: await this._headers()
    });
    if (!res.ok) throw new Error("Failed to fetch conversations");
    return await res.json();
  };

  get: (id: string, options?: ConversationReadOptions) => Promise<Conversation | undefined> = async (id, options) => {
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }
    const existing = this.inflight.get(id);
    if (existing) return existing;

    const request = (async () => {
      const res = await fetch(`${this.apiUrl}/${id}`, {
        headers: await this._headers(),
        signal: options?.signal,
      });
      if (res.status === 404) return undefined;
      if (!res.ok) throw new Error("Failed to fetch conversation");
      const conv: Conversation = await res.json();
      this.cache.set(id, conv);
      return conv;
    })().finally(() => this.inflight.delete(id));

    this.inflight.set(id, request);
    return request;
  };

  loadAll = async (options: ConversationLoadAllOptions = {}): Promise<Conversation[]> => {
    const summaries = await this.list();
    const output = new Array<Conversation | undefined>(summaries.length);
    const concurrency = Math.max(1, Math.min(options.concurrency ?? 4, 12));
    let next = 0;
    let loaded = 0;
    options.onProgress?.(0, summaries.length);

    const worker = async () => {
      while (true) {
        if (options.signal?.aborted) throw new DOMException("Loading cancelled", "AbortError");
        const index = next++;
        if (index >= summaries.length) return;
        output[index] = await this.get(summaries[index].id, options);
        loaded += 1;
        options.onProgress?.(loaded, summaries.length);
      }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, summaries.length) }, worker));
    return output.filter((item): item is Conversation => !!item);
  };

  search = async (
    query: string,
    limit = 20,
    options?: ConversationReadOptions,
  ): Promise<ConversationSearchResult> => {
    const params = new URLSearchParams({ query, limit: String(limit) });
    const res = await fetch(`${this.apiUrl}/search?${params}`, {
      headers: await this._headers(),
      signal: options?.signal,
    });
    if (!res.ok) throw new Error("Failed to search conversations");
    return await res.json();
  };

  create: (name: string, temperature?: number, mcpServers?: string[]) => Promise<Conversation> = async (name, temperature, mcpServers) => {
    const conv: Conversation = {
      id: crypto.randomUUID(),
      messages: [],
      metadata: {
        name,
        temperature: typeof temperature === "number" ? temperature : 1,
        mcpServers
      }
    };
    const res = await fetch(this.apiUrl, {
      method: "POST",
      headers: { ...await this._headers(), "Content-Type": "application/json" },
      body: JSON.stringify(conv)
    });
    if (!res.ok) throw new Error("Failed to create conversation");
    const created = await res.json();
    this.cache.set(created.id, created);
    return created;
  };

  rename: (id: string, name: string) => Promise<void> = async (id, name) => {
    const conv = await this._getCached(id);
    (conv.metadata ??= {})["name"] = name;
    //conv.name = name;
    await this._putConversation(conv);
    this.cache.set(id, conv);
  };

  setTemperature: (id: string, temperature: number) => Promise<void> = async (id, temperature) => {
    const conv = await this._getCached(id);
    (conv.metadata ??= {})["temperature"] = temperature;
    //conv.name = name;
    await this._putConversation(conv);
    this.cache.set(id, conv);
  };

  removeServer: (id: string, mcpServerUrl: string) => Promise<void> = async (id, mcpServerUrl) => {
    const conv = await this._getCached(id);
    const servers = (conv.metadata ??= {}).mcpServers;
    if (Array.isArray(servers)) {
      conv.metadata.mcpServers = servers.filter((url: string) => url !== mcpServerUrl);
    }
    await this._putConversation(conv);
    this.cache.set(id, conv);
  };

  addServer: (id: string, mcpServerUrl: string) => Promise<void> = async (id, mcpServerUrl) => {
    const conv = await this._getCached(id);
    // Ensure metadata exists and mcpServers is an array
    (conv.metadata ??= {}).mcpServers ??= [];
    // Add only if not already present
    if (!conv.metadata.mcpServers.includes(mcpServerUrl)) {
      conv.metadata.mcpServers.push(mcpServerUrl);
    }
    await this._putConversation(conv);
    this.cache.set(id, conv);
  };


  remove: (id: string) => Promise<void> = async (id) => {
    const res = await fetch(`${this.apiUrl}/${id}`, {
      method: "DELETE",
      headers: await this._headers()
    });
    if (!res.ok) throw new Error("Failed to delete conversation");
    this.cache.delete(id);
  };

  addMessage: (cid: string, msg: UIMessage) => Promise<void> = async (cid, msg) => {
    const conv = await this._getCached(cid);
    const next = { ...conv, messages: [...conv.messages, msg] };

    if (await this._supportsGranularMessageMutations()) {
      await this._sendMessageMutation(`${this.apiUrl}/${encodeURIComponent(cid)}/messages`, "POST", msg);
    } else {
      await this._putConversation(next);
    }

    this.cache.set(cid, next);
  };

  updateMessage: (cid: string, mid: string, up: Partial<UIMessage>) => Promise<void> = async (cid, mid, up) => {
    const conv = await this._getCached(cid);
    const idx = conv.messages.findIndex(m => m.id === mid);
    if (idx === -1) throw new Error("Message not found");
    const messages = [...conv.messages];
    messages[idx] = { ...messages[idx], ...up, id: messages[idx].id };
    const next = { ...conv, messages };

    if (await this._supportsGranularMessageMutations()) {
      await this._sendMessageMutation(
        `${this.apiUrl}/${encodeURIComponent(cid)}/messages/${encodeURIComponent(mid)}`,
        "PATCH",
        up,
      );
    } else {
      await this._putConversation(next);
    }

    this.cache.set(cid, next);
  };

  removeMessage: (cid: string, mid: string) => Promise<void> = async (cid, mid) => {
    const conv = await this._getCached(cid);
    if (!conv.messages.some(m => m.id === mid)) throw new Error("Message not found");
    const next = { ...conv, messages: conv.messages.filter(m => m.id !== mid) };

    if (await this._supportsGranularMessageMutations()) {
      await this._sendMessageMutation(
        `${this.apiUrl}/${encodeURIComponent(cid)}/messages/${encodeURIComponent(mid)}`,
        "DELETE",
      );
    } else {
      await this._putConversation(next);
    }

    this.cache.set(cid, next);
  };

  private async _supportsGranularMessageMutations(): Promise<boolean> {
    this.granularMessageMutations ??= (async () => {
      const res = await fetch(`${this.apiUrl}/capabilities`, {
        headers: await this._headers()
      });
      if (res.status === 404 || res.status === 405) return false;
      if (!res.ok) throw new Error("Failed to determine conversation storage capabilities");
      const capabilities = await res.json();
      return capabilities?.granularMessageMutations === true;
    })();

    try {
      return await this.granularMessageMutations;
    } catch (error) {
      // Permit a later operation to retry a transient failed capability check.
      this.granularMessageMutations = undefined;
      throw error;
    }
  }

  private async _sendMessageMutation(
    url: string,
    method: "POST" | "PATCH" | "DELETE",
    body?: UIMessage | Partial<UIMessage>,
  ): Promise<void> {
    const res = await fetch(url, {
      method,
      headers: {
        ...await this._headers(),
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!res.ok) throw new Error(`Failed to ${method.toLowerCase()} conversation message`);
  }

  private async _getCached(id: string): Promise<Conversation> {
    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }
    const res = await fetch(`${this.apiUrl}/${id}`, {
      headers: await this._headers()
    });
    if (!res.ok) throw new Error("Failed to fetch conversation");
    const conv = await res.json();
    this.cache.set(id, conv);
    return conv;
  }

  private async _putConversation(conv: Conversation): Promise<void> {
    const res = await fetch(`${this.apiUrl}/${conv.id}`, {
      method: "PUT",
      headers: { ...await this._headers(), "Content-Type": "application/json" },
      body: JSON.stringify(conv)
    });
    if (!res.ok) throw new Error("Failed to update conversation");
  }

  private async _headers(): Promise<Record<string, string>> {
    const token = await this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}
