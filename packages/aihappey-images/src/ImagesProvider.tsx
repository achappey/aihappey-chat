import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { ImageResponse } from "aihappey-ai";
import { useAppStore } from "aihappey-state";
import type { ImageItem, ImageStore, ImageStorageKind } from "./types";
import { IndexedDBImageStore } from "./stores/IndexedDBImageStore";

export type ImagesContextType = ImageStore & {
  items: ImageItem[];
  refresh: () => void;
};

const ImagesContext = createContext<ImagesContextType | null>(null);

export const indexedDbImageStore = new IndexedDBImageStore();
//export const localImageStore = new LocalImageStore();

/**
 * Provides access to locally stored image generations.
 *
 * Storage selection:
 * - if you pass `storageKind`, it will be used
 * - otherwise, defaults to IndexedDB
 *
 * Note: if you want storage selection in global UI state later (like conversations),
 * we can add an `imageStorage` field to aihappey-state.
 */
export const ImagesProvider = ({
  children,
  storageKind,
}: {
  children: ReactNode;
  storageKind?: ImageStorageKind;
}) => {
  // Kept for future parity with ConversationsProvider (where it’s user-selectable).
  // Currently unused except to ensure this package can depend on aihappey-state
  // without being tree-shaken incorrectly in some bundlers.
  useAppStore((s) => s.conversationStorage);

  const store = useMemo<ImageStore>(() => {
    if (storageKind === "local") return indexedDbImageStore;
    return indexedDbImageStore;
  }, [storageKind]);

  const [items, setItems] = useState<ImageItem[]>([]);

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
    ) as ImagesContextType;

    ctx.add = async (imageResponse: ImageResponse) => {
      const created = await store.add(imageResponse);
      setItems((prev) => [created, ...prev]);
      return created;
    };

    ctx.delete = async (id: string, imageItem?: unknown) => {
      // second arg is ignored, but supported for signature parity with request
      void imageItem;
      await store.delete(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
    };

    ctx.update = async (id: string, imageResponse: ImageResponse) => {
      const updated = await store.update(id, imageResponse);
      setItems((prev) => prev.map((x) => (x.id === id ? updated : x)));
      return updated;
    };

    // list() stays as store.list(); consumers can also use ctx.items for reactive UI

    return ctx;
  }, [store, items, refresh]);

  return (
    <ImagesContext.Provider value={ctxValue}>{children}</ImagesContext.Provider>
  );
};

export const useImages = () => {
  const ctx = useContext(ImagesContext);
  if (!ctx) throw new Error("useImages must be used within ImagesProvider");
  return ctx;
};

