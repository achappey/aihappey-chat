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
  StructuredOutputsStore,
  StructuredOutputsItem,
  StructuredOutputsStorageKind,
} from "./types";
import { IndexedDBStructuredOutputsStore } from "./stores/IndexedDBStructuredOutputsStore";

export type StructuredOutputsContextType = StructuredOutputsStore & {
  items: StructuredOutputsItem[];
  refresh: () => void;
};

const StructuredOutputsContext =
  createContext<StructuredOutputsContextType | null>(null);

export const indexedDbStructuredOutputsStore =
  new IndexedDBStructuredOutputsStore();

export const StructuredOutputsProvider = ({
  children,
  storageKind,
}: {
  children: ReactNode;
  storageKind?: StructuredOutputsStorageKind;
}) => {
  useAppStore((s) => s.conversationStorage);

  const store = useMemo<StructuredOutputsStore>(() => {
    if (storageKind === "local") return indexedDbStructuredOutputsStore;
    return indexedDbStructuredOutputsStore;
  }, [storageKind]);

  const [items, setItems] = useState<StructuredOutputsItem[]>([]);

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
    ) as StructuredOutputsContextType;

    ctx.add = async (
      schema: string,
      output: any[]
    ) => {
      const created = await store.add(schema, output);
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
    <StructuredOutputsContext.Provider value={ctxValue}>
      {children}
    </StructuredOutputsContext.Provider>
  );
};

export const useStructuredOutputs = () => {
  const ctx = useContext(StructuredOutputsContext);
  if (!ctx)
    throw new Error(
      "useStructuredOutputs must be used within StructuredOuputsProvider"
    );
  return ctx;
};
