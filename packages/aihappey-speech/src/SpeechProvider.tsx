import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { SpeechModelV4CallOptions, SpeechResponse } from "aihappey-ai";
import { useAppStore } from "aihappey-state";
import type { SpeechItem, SpeechStore, SpeechStorageKind } from "./types";
import { IndexedDBSpeechStore } from "./stores/IndexedDBSpeechStore";

export type SpeechContextType = SpeechStore & {
  items: SpeechItem[];
  refresh: () => void;
};

const SpeechContext = createContext<SpeechContextType | null>(null);

export const indexedDbSpeechStore = new IndexedDBSpeechStore();

/**
 * Provides access to locally stored speech generations.
 *
 * Storage selection:
 * - if you pass `storageKind`, it will be used
 * - otherwise, defaults to IndexedDB
 */
export const SpeechProvider = ({
  children,
  storageKind,
}: {
  children: ReactNode;
  storageKind?: SpeechStorageKind;
}) => {
  // Kept for future parity with ConversationsProvider (where it’s user-selectable).
  // Currently unused except to ensure this package can depend on aihappey-state.
  useAppStore((s) => s.conversationStorage);

  const store = useMemo<SpeechStore>(() => {
    if (storageKind === "local") return indexedDbSpeechStore;
    return indexedDbSpeechStore;
  }, [storageKind]);

  const [items, setItems] = useState<SpeechItem[]>([]);

  const refresh = useCallback(() => {
    store.list().then(setItems);
  }, [store]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  const ctxValue = useMemo(() => {
    // Keep prototype so all methods are available (same trick as ConversationsProvider)
    const ctx = Object.assign(
      Object.create(Object.getPrototypeOf(store)),
      store,
      { items, refresh }
    ) as SpeechContextType;

    ctx.add = async (input: SpeechModelV4CallOptions, speechResponse: SpeechResponse) => {
      const created = await store.add(input, speechResponse);
      setItems((prev) => [created, ...prev]);
      return created;
    };

    ctx.delete = async (id: string) => {
      await store.delete(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
    };

    return ctx;
  }, [store, items, refresh]);

  return (
    <SpeechContext.Provider value={ctxValue}>{children}</SpeechContext.Provider>
  );
};

export const useSpeech = () => {
  const ctx = useContext(SpeechContext);
  if (!ctx) throw new Error("useSpeech must be used within SpeechProvider");
  return ctx;
};

