import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useAppStore } from "aihappey-state";
import type { FileStore, StoredFile } from "./types";
import { IndexedDBFileStore } from "./stores/IndexedDBFileStore";

export type FilesContextType = FileStore & {
  items: StoredFile[];
  refresh: () => void;
};

const FilesContext = createContext<FilesContextType | null>(null);

export const indexedDbFileStore = new IndexedDBFileStore();

/**
 * Provides access to locally stored files.
 *
 * Currently always IndexedDB.
 * Kept extensible for parity with Images / Conversations.
 */
export const FilesProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  // Keep dependency on app state for parity + bundler behavior
  useAppStore((s) => s.conversationStorage);

  const store = useMemo<FileStore>(() => indexedDbFileStore, []);
  const [items, setItems] = useState<StoredFile[]>([]);
  const refresh = useCallback(() => {
    store.list().then(setItems);
  }, [store]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  const ctxValue = useMemo(() => {
    // preserve prototype so all methods stay available
    const ctx = Object.assign(
      Object.create(Object.getPrototypeOf(store)),
      store,
      { items, refresh }
    ) as FilesContextType;

    ctx.create = async (file) => {
      const created = await store.create(file);
      setItems((prev) => [created, ...prev]);
      return created;
    };

    ctx.delete = async (id: string) => {
      await store.delete(id);
      setItems((prev) => prev.filter((f) => f.id !== id));
    };

    // list() and read() stay as-is on the store

    return ctx;
  }, [store, items, refresh]);

  return (
    <FilesContext.Provider value={ctxValue}>
      {children}
    </FilesContext.Provider>
  );
};

export const useFiles = () => {
  const ctx = useContext(FilesContext);
  if (!ctx) {
    throw new Error("useFiles must be used within FilesProvider");
  }
  return ctx;
};
