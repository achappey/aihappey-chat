// ToolStoreProvider.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { StoredTool, ToolStore, ToolStorageKind } from "./types";
import { IndexedDBToolStore } from "./stores/IndexedDBToolStore";

export type ToolsContextType = ToolStore & {
  items: StoredTool[];
  refresh: () => void;
};

const ToolsContext = createContext<ToolsContextType | null>(null);

export const indexedDbToolStore = new IndexedDBToolStore();

export const ToolsProvider = ({
  children,
  storageKind,
}: {
  children: ReactNode;
  storageKind?: ToolStorageKind;
}) => {
  const store = useMemo<ToolStore>(() => {
    if (storageKind === "local") return indexedDbToolStore;
    return indexedDbToolStore;
  }, [storageKind]);

  const [items, setItems] = useState<StoredTool[]>([]);

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
      { items, refresh }
    ) as ToolsContextType;

    ctx.add = async (tool: StoredTool) => {
      const created = await store.add(tool);
      setItems(prev => [created, ...prev]);
      return created;
    };

    ctx.delete = async (id: string) => {
      await store.delete(id);
      setItems(prev => prev.filter(t => t.id !== id));
    };

    return ctx;
  }, [store, items, refresh]);

  return (
    <ToolsContext.Provider value={ctxValue}>
      {children}
    </ToolsContext.Provider>
  );
};

export const useLocalTools = () => {
  const ctx = useContext(ToolsContext);
  if (!ctx) throw new Error("useTools must be used within ToolsProvider");
  return ctx;
};
