import type { Conversation, UIMessage } from "aihappey-types/src/chat";
import type { ConversationStore } from "../types";

export class RemoteConversationStore implements ConversationStore {
  readonly kind = "remote";
  private cache = new Map<string, Conversation>();

  constructor(
    private apiUrl: string,
    private getToken: () => Promise<string | undefined>
  ) { }

  import = async (conv: Conversation): Promise<string> => {
    throw new Error("Not implemented")
  }

  list: () => Promise<Conversation[]> = async () => {
    const res = await fetch(this.apiUrl, {
      headers: await this._headers()
    });
    if (!res.ok) throw new Error("Failed to fetch conversations");
    const list: Conversation[] = await res.json();
    list.forEach((c) => this.cache.set(c.id, c));
    return list;
  };

  get: (id: string) => Promise<Conversation | undefined> = async (id) => {
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }
    const res = await fetch(`${this.apiUrl}/${id}`, {
      headers: await this._headers()
    });
    if (!res.ok) return undefined;
    const conv = await res.json();
    this.cache.set(id, conv);
    return conv;
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
    conv.messages.push(msg);
    await this._putConversation(conv);
    this.cache.set(cid, conv);
  };

  updateMessage: (cid: string, mid: string, up: Partial<UIMessage>) => Promise<void> = async (cid, mid, up) => {
    const conv = await this._getCached(cid);
    const idx = conv.messages.findIndex(m => m.id === mid);
    if (idx === -1) throw new Error("Message not found");
    conv.messages[idx] = { ...conv.messages[idx], ...up };
    await this._putConversation(conv);
    this.cache.set(cid, conv);
  };

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
