import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import type { ReactNode } from "react";
import type { ConversationStore } from "./types";
import { RemoteConversationStore } from "./stores/RemoteConversationStore";
import { useAppStore, useRemoteStorageConnected } from "aihappey-state";
import { useAccessToken } from "aihappey-auth";
import { Conversation, UIMessage } from "aihappey-types";
import { IndexedDBConversationStore } from "./stores/IndexedDBConversationStore";

export type ConversationsContextType = ConversationStore & {
  items: Conversation[];
  refresh: () => void;
};

const ConversationsContext = createContext<ConversationsContextType | null>(
  null
);

export const localConversationStore = new IndexedDBConversationStore();

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
    () =>
      conversationStorage === "remote"
        ? new RemoteConversationStore(apiUrl, refreshToken)
        : localConversationStore,
    [conversationStorage, refreshToken]
  );

  const [items, setItems] = useState<Conversation[]>([]);
  console.log(items);
  const refresh = useCallback(() => {
    store.list().then(setItems);
  }, [store]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  const ctxValue = useMemo(() => {
    // keep prototype so all methods are available
    const ctx = Object.assign(
      Object.create(Object.getPrototypeOf(store)),
      store,
      { items, refresh }
    );

    ctx.create = async (name: string, defaultTemperature?: number) => {
      // Get default temperature from app store for new conversations
      const c = await store.create(name, defaultTemperature);
      refresh();

      return c;
    };
    ctx.rename = async (id: string, name: string) => {
      await store.rename(id, name);
      refresh();
    };
    ctx.setTemperature = async (id: string, temperature: number) => {
      await store.setTemperature(id, temperature);
      refresh();
    };
    ctx.remove = async (id: string) => {
      await store.remove(id);
      refresh();
    };
    ctx.addMessage = async (cid: string, msg: UIMessage) => {
      await store.addMessage(cid, msg);
      setItems((prev) =>
        prev.map((c) =>
          c.id === cid ? { ...c, messages: [...c.messages, msg] } : c
        )
      );
    };
    ctx.updateMessage = async (
      cid: string,
      mid: string,
      up: Partial<UIMessage>
    ) => {
      await store.updateMessage(cid, mid, up);

      setItems((prev) =>
        prev.map((c) =>
          c.id === cid
            ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === mid ? { ...m, ...up } : m
              ),
            }
            : c
        )
      );
    };

    return ctx;
  }, [store, items, refresh]);

  return (
    <ConversationsContext.Provider value={ctxValue}>
      {children}
    </ConversationsContext.Provider>
  );
};

export const useConversations = () => {
  const ctx = useContext(ConversationsContext);
  if (!ctx)
    throw new Error(
      "useConversations must be used within ConversationsProvider"
    );
  return ctx;
};
