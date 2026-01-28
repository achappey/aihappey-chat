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
  JsonRenderActionItem,
  JsonRenderRegistryItem,
  JsonRenderRegistryStore,
  JsonRenderRegistryStorageKind,
} from "./types";
import { IndexedDBJsonRenderRegistryStore } from "./stores/IndexedDBJsonRenderRegistryStore";

export type JsonRenderRegistryContextType = JsonRenderRegistryStore & {
  items: JsonRenderRegistryItem[];
  actions: JsonRenderActionItem[];
  refresh: () => void;
  refreshActions: () => void;
};

const JsonRenderRegistryContext =
  createContext<JsonRenderRegistryContextType | null>(null);

export const indexedDbJsonRenderRegistryStore =
  new IndexedDBJsonRenderRegistryStore();

export const JsonRenderRegistryProvider = ({
  children,
  storageKind,
}: {
  children: ReactNode;
  storageKind?: JsonRenderRegistryStorageKind;
}) => {
  const store = useMemo<JsonRenderRegistryStore>(() => {
    if (storageKind === "local") return indexedDbJsonRenderRegistryStore;
    return indexedDbJsonRenderRegistryStore;
  }, [storageKind]);

  const [items, setItems] = useState<JsonRenderRegistryItem[]>([]);
  const [actions, setActions] = useState<JsonRenderActionItem[]>([]);

  const refresh = useCallback(() => {
    store.list().then(setItems);
  }, [store]);

  const refreshActions = useCallback(() => {
    store.listActions().then(setActions);
  }, [store]);

  useEffect(() => {
    refresh();
    refreshActions();
  }, [store, refresh, refreshActions]);

  const ctxValue = useMemo(() => {
    const ctx = Object.assign(
      Object.create(Object.getPrototypeOf(store)),
      store,
      { items, actions, refresh, refreshActions },
    ) as JsonRenderRegistryContextType;

    ctx.add = async (
      registryId: string,
      name: string,
      code: string,
      propsSchema?: string,
    ) => {
      const created = await store.add(registryId, name, code, propsSchema);
      setItems((prev) => [created, ...prev]);
      return created;
    };

    ctx.update = async (
      id: string,
      registryId: string,
      name: string,
      code: string,
      propsSchema?: string,
    ) => {
      const updated = await store.update(id, registryId, name, code, propsSchema);
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      return updated;
    };

    ctx.delete = async (id: string) => {
      await store.delete(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
    };

    ctx.addAction = async (
      registryId: string,
      name: string,
      code: string,
      paramsSchema?: string,
      description?: string,
      title?: string,
    ) => {
      const created = await store.addAction(
        registryId,
        name,
        code,
        paramsSchema,
        description,
        title,
      );
      setActions((prev) => [created, ...prev]);
      return created;
    };

    ctx.updateAction = async (
      id: string,
      registryId: string,
      name: string,
      code: string,
      paramsSchema?: string,
      description?: string,
      title?: string,
    ) => {
      const updated = await store.updateAction(
        id,
        registryId,
        name,
        code,
        paramsSchema,
        description,
        title,
      );
      setActions((prev) => prev.map((item) => (item.id === id ? updated : item)));
      return updated;
    };

    ctx.deleteAction = async (id: string) => {
      await store.deleteAction(id);
      setActions((prev) => prev.filter((x) => x.id !== id));
    };

    return ctx;
  }, [store, items, actions, refresh, refreshActions]);

  return (
    <JsonRenderRegistryContext.Provider value={ctxValue}>
      {children}
    </JsonRenderRegistryContext.Provider>
  );
};

export const useJsonRenderRegistry = () => {
  const ctx = useContext(JsonRenderRegistryContext);
  if (!ctx)
    throw new Error(
      "useJsonRenderRegistry must be used within JsonRenderRegistryProvider",
    );
  return ctx;
};
