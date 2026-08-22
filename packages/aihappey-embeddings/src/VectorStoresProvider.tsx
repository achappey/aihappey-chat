import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { IndexedDBVectorStoreStore } from "./stores/IndexedDBVectorStoreStore";
import type {
  CreateVectorStoreInput,
  VectorStore,
  VectorStoreStore,
  UpdateVectorStoreInput,
} from "./types";

export type VectorStoresContextType = VectorStoreStore & {
  items: VectorStore[];
  refresh: () => Promise<void>;
};

const VectorStoresContext = createContext<VectorStoresContextType | null>(null);
export const indexedDbDocumentHubStore = new IndexedDBVectorStoreStore();

export const VectorStoresProvider = ({ children }: { children: ReactNode }) => {
  const store = indexedDbDocumentHubStore;
  const [items, setItems] = useState<VectorStore[]>([]);
  const refresh = useCallback(async () => setItems([...(await store.list())]), [store]);

  useEffect(() => { void refresh(); }, [refresh]);

  const value = useMemo<VectorStoresContextType>(() => ({
    kind: store.kind,
    items,
    refresh,
    list: store.list,
    get: store.get,
    add: async (input: CreateVectorStoreInput) => {
      const hub = await store.add(input);
      setItems((current) => [hub, ...current]);
      return hub;
    },
    update: async (id: string, input: UpdateVectorStoreInput) => {
      const hub = await store.update(id, input);
      setItems((current) => current.map((item) => item.id === id ? hub : item));
      return hub;
    },
    replace: async (hub: VectorStore) => {
      const updated = await store.replace(hub);
      setItems((current) => current.map((item) => item.id === hub.id ? updated : item));
      return updated;
    },
    delete: async (id: string) => {
      await store.delete(id);
      setItems((current) => current.filter((item) => item.id !== id));
    },
  }), [items, refresh, store]);

  return <VectorStoresContext.Provider value={value}>{children}</VectorStoresContext.Provider>;
};

export const useVectorStores = () => {
  const context = useContext(VectorStoresContext);
  if (!context) throw new Error("useVectorStores must be used within VectorStoresProvider");
  return context;
};
