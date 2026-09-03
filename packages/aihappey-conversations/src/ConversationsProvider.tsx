import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { ConversationStore, ConversationSummary } from "./types";
import { RemoteConversationStore } from "./stores/RemoteConversationStore";
import { useAppStore } from "aihappey-state";
import { useAccessToken } from "aihappey-auth";
import type { Conversation, UIMessage } from "aihappey-types";
import { IndexedDBConversationStore } from "./stores/IndexedDBConversationStore";

export type ConversationsContextType = ConversationStore & {
  /** Lightweight records only. Full conversations are returned by get/loadAll. */
  items: ConversationSummary[];
  refresh: () => Promise<void>;
};

const ConversationsContext = createContext<ConversationsContextType | null>(null);

export const localConversationStore = new IndexedDBConversationStore();

const messageTimestamp = (message?: UIMessage): string | undefined => {
  const value = message?.metadata?.timestamp;
  return typeof value === "string" && !Number.isNaN(Date.parse(value))
    ? new Date(value).toISOString()
    : undefined;
};

const toSummary = (conversation: Conversation): ConversationSummary => {
  const activityAt = [...(conversation.messages ?? [])]
    .reverse()
    .map(messageTimestamp)
    .find(Boolean) ?? new Date().toISOString();
  return {
    id: conversation.id,
    name: conversation.metadata?.name ?? "New chat",
    messageCount: conversation.messages?.length ?? 0,
    activityAt,
    updatedAt: new Date().toISOString(),
  };
};

export const ConversationsProvider = ({
  apiUrl,
  scopes,
  children,
}: {
  children: ReactNode;
  apiUrl: string;
  scopes: string[];
}) => {
  const conversationStorage = useAppStore((s) => s.conversationStorage);
  const [, , , refreshToken] = useAccessToken(scopes);
  const store = useMemo<ConversationStore>(
    () => conversationStorage === "remote"
      ? new RemoteConversationStore(apiUrl, refreshToken)
      : localConversationStore,
    [apiUrl, conversationStorage, refreshToken]
  );

  const [items, setItems] = useState<ConversationSummary[]>([]);
  const refresh = useCallback(async () => setItems(await store.list()), [store]);

  useEffect(() => {
    let active = true;
    void store.list().then((next) => { if (active) setItems(next); });
    return () => { active = false; };
  }, [store]);

  const patchSummary = useCallback((id: string, patch: Partial<ConversationSummary>) => {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  }, []);

  const ctxValue = useMemo<ConversationsContextType>(() => {
    const ctx = Object.assign(Object.create(Object.getPrototypeOf(store)), store, { items, refresh }) as ConversationsContextType;

    ctx.create = async (name: string, defaultTemperature?: number, mcpServers?: string[]) => {
      const conversation = await store.create(name, defaultTemperature, mcpServers);
      setItems((current) => [toSummary(conversation), ...current.filter((item) => item.id !== conversation.id)]);
      return conversation;
    };
    ctx.import = async (conversation: Conversation) => {
      const id = await store.import(conversation);
      await refresh();
      return id;
    };
    ctx.rename = async (id: string, name: string) => {
      await store.rename(id, name);
      patchSummary(id, { name, updatedAt: new Date().toISOString() });
    };
    ctx.setTemperature = async (id: string, temperature: number) => {
      await store.setTemperature(id, temperature);
      patchSummary(id, { updatedAt: new Date().toISOString() });
    };
    ctx.addServer = async (id: string, url: string) => {
      await store.addServer(id, url);
      patchSummary(id, { updatedAt: new Date().toISOString() });
    };
    ctx.removeServer = async (id: string, url: string) => {
      await store.removeServer(id, url);
      patchSummary(id, { updatedAt: new Date().toISOString() });
    };
    ctx.remove = async (id: string) => {
      await store.remove(id);
      setItems((current) => current.filter((item) => item.id !== id));
    };
    ctx.addMessage = async (id: string, message: UIMessage) => {
      await store.addMessage(id, message);
      const activityAt = messageTimestamp(message) ?? new Date().toISOString();
      setItems((current) => current.map((item) => item.id === id ? {
        ...item,
        messageCount: item.messageCount + 1,
        activityAt,
        updatedAt: new Date().toISOString(),
      } : item));
    };
    ctx.updateMessage = async (id: string, messageId: string, update: Partial<UIMessage>) => {
      await store.updateMessage(id, messageId, update);
      const activityAt = messageTimestamp(update as UIMessage);
      patchSummary(id, {
        ...(activityAt ? { activityAt } : {}),
        updatedAt: new Date().toISOString(),
      });
    };
    ctx.removeMessage = async (id: string, messageId: string) => {
      await store.removeMessage(id, messageId);
      const conversation = await store.get(id);
      if (conversation) patchSummary(id, toSummary(conversation));
    };
    return ctx;
  }, [items, patchSummary, refresh, store]);

  return <ConversationsContext.Provider value={ctxValue}>{children}</ConversationsContext.Provider>;
};

export const useConversations = () => {
  const ctx = useContext(ConversationsContext);
  if (!ctx) throw new Error("useConversations must be used within ConversationsProvider");
  return ctx;
};
