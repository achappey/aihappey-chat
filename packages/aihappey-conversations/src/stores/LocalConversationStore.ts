import type { Conversation, UIMessage } from "aihappey-types/src/chat";
import type { ConversationStore } from "../types";

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


  list = async (): Promise<Conversation[]> => {
    return this.data;
  };

  get = async (id: string): Promise<Conversation | undefined> => {
    return this.data.find((c) => c.id === id);
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
