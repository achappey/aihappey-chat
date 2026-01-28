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
  JsonRenderAppItem,
  JsonRenderAppsStore,
  JsonRenderAppStorageKind,
} from "./types";
import { IndexedDBJsonRenderAppsStore } from "./stores/IndexedDBJsonRenderAppsStore";

export type JsonRenderAppsContextType = JsonRenderAppsStore & {
  items: JsonRenderAppItem[];
  refresh: () => void;
};

const JsonRenderAppsContext =
  createContext<JsonRenderAppsContextType | null>(null);

export const indexedDbJsonRenderAppsStore =
  new IndexedDBJsonRenderAppsStore();

export const JsonRenderAppsProvider = ({
  children,
  storageKind,
}: {
  children: ReactNode;
  storageKind?: JsonRenderAppStorageKind;
}) => {
  const store = useMemo<JsonRenderAppsStore>(() => {
    if (storageKind === "local") return indexedDbJsonRenderAppsStore;
    return indexedDbJsonRenderAppsStore;
  }, [storageKind]);

  const [items, setItems] = useState<JsonRenderAppItem[]>([]);

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
    ) as JsonRenderAppsContextType;

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
    <JsonRenderAppsContext.Provider value={ctxValue}>
      {children}
    </JsonRenderAppsContext.Provider>
  );
};

export const useJsonRenderApps = () => {
  const ctx = useContext(JsonRenderAppsContext);
  if (!ctx) {
    throw new Error("useJsonRenderApps must be used within JsonRenderAppsProvider");
  }
  return ctx;
};
