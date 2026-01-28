import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type {
  JsonRenderCatalogItem,
  JsonRenderCatalogStore,
  JsonRenderCatalogStorageKind,
} from "./types";
import { IndexedDBJsonRenderCatalogStore } from "./stores/IndexedDBJsonRenderCatalogStore";

export type JsonRenderCatalogContextType = JsonRenderCatalogStore & {
  items: JsonRenderCatalogItem[];
  refresh: () => void;
};

const JsonRenderCatalogContext =
  createContext<JsonRenderCatalogContextType | null>(null);

export const indexedDbJsonRenderCatalogStore =
  new IndexedDBJsonRenderCatalogStore();

export const JsonRenderCatalogProvider = ({
  children,
  storageKind,
}: {
  children: ReactNode;
  storageKind?: JsonRenderCatalogStorageKind;
}) => {
  const store = useMemo<JsonRenderCatalogStore>(() => {
    if (storageKind === "local") return indexedDbJsonRenderCatalogStore;
    return indexedDbJsonRenderCatalogStore;
  }, [storageKind]);

  const [items, setItems] = useState<JsonRenderCatalogItem[]>([]);

  const refresh = useCallback(() => {
    store.list().then(setItems);
  }, [store]);

  useEffect(() => {
    refresh();
  }, [store, refresh]);

  const ctxValue = useMemo(() => {
    const ctx = Object.assign(
      Object.create(Object.getPrototypeOf(store)),
      store,
      { items, refresh },
    ) as JsonRenderCatalogContextType;

    ctx.create = async (item) => {
      const created = await store.create(item);
      setItems((prev) => [created, ...prev]);
      return created;
    };

    ctx.update = async (id, item) => {
      const updated = await store.update(id, item);
      setItems((prev) => prev.map((entry) => (entry.id === id ? updated : entry)));
      return updated;
    };

    ctx.delete = async (id: string) => {
      await store.delete(id);
      setItems((prev) => prev.filter((entry) => entry.id !== id));
    };

    return ctx;
  }, [store, items, refresh]);

  return (
    <JsonRenderCatalogContext.Provider value={ctxValue}>
      {children}
    </JsonRenderCatalogContext.Provider>
  );
};

export const useJsonRenderCatalog = () => {
  const ctx = useContext(JsonRenderCatalogContext);
  if (!ctx) {
    throw new Error(
      "useJsonRenderCatalog must be used within JsonRenderCatalogProvider",
    );
  }
  return ctx;
};
