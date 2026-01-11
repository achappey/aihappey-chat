// TranscriptionsProvider.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { RerankingResponse } from "aihappey-ai";
import { useAppStore } from "aihappey-state";
import type {
  RerankingFileItem,
  RerankingItem,
  RerankingStorageKind,
  RerankingStore,
} from "./types";
import { IndexedDBRerankingStore } from "./stores/IndexedDBRerankingStore";

export type RerankingContextType = RerankingStore & {
  items: RerankingItem[];
  refresh: () => void;
};

const RerankingContext =
  createContext<RerankingContextType | null>(null);

export const indexedDbRerankingStore =
  new IndexedDBRerankingStore();

export const RerankingProvider = ({
  children,
  storageKind,
}: {
  children: ReactNode;
  storageKind?: RerankingStorageKind;
}) => {
  useAppStore((s) => s.conversationStorage);

  const store = useMemo<RerankingStore>(() => {
    if (storageKind === "local") return indexedDbRerankingStore;
    return indexedDbRerankingStore;
  }, [storageKind]);

  const [items, setItems] = useState<RerankingItem[]>([]);

  const refresh = useCallback(() => {
    store.list().then(setItems);
  }, [store]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  const ctxValue = useMemo(() => {
    const ctx = Object.assign(
      Object.create(Object.getPrototypeOf(store)),
      store,
      { items, refresh }
    ) as RerankingContextType;

    ctx.add = async (
      query: string,
      files: RerankingFileItem[],
      reranking: RerankingResponse
    ) => {
      const created = await store.add(query, files, reranking);
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
    <RerankingContext.Provider value={ctxValue}>
      {children}
    </RerankingContext.Provider>
  );
};

export const useReranking = () => {
  const ctx = useContext(RerankingContext);
  if (!ctx)
    throw new Error(
      "useReranking must be used within RerankingProvider"
    );
  return ctx;
};
