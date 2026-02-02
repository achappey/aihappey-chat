import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { VideoResponse } from "aihappey-ai";
import { useAppStore } from "aihappey-state";
import type { VideoItem, VideoStore, VideoStorageKind } from "./types";
import { IndexedDBVideoStore } from "./stores/IndexedDBVideoStore";

export type VideosContextType = VideoStore & {
  items: VideoItem[];
  refresh: () => void;
};

const VideosContext = createContext<VideosContextType | null>(null);

export const indexedDbVideoStore = new IndexedDBVideoStore();
//export const localVideoStore = new LocalVideoStore();

/**
 * Provides access to locally stored video generations.
 *
 * Storage selection:
 * - if you pass `storageKind`, it will be used
 * - otherwise, defaults to IndexedDB
 *
 * Note: if you want storage selection in global UI state later (like conversations),
 * we can add a `videoStorage` field to aihappey-state.
 */
export const VideosProvider = ({
  children,
  storageKind,
}: {
  children: ReactNode;
  storageKind?: VideoStorageKind;
}) => {
  // Kept for future parity with ConversationsProvider (where it’s user-selectable).
  // Currently unused except to ensure this package can depend on aihappey-state
  // without being tree-shaken incorrectly in some bundlers.
  useAppStore((s) => s.conversationStorage);

  const store = useMemo<VideoStore>(() => {
    if (storageKind === "local") return indexedDbVideoStore;
    return indexedDbVideoStore;
  }, [storageKind]);

  const [items, setItems] = useState<VideoItem[]>([]);

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
    ) as VideosContextType;

    ctx.add = async (videoResponse: VideoResponse) => {
      const created = await store.add(videoResponse);
      setItems((prev) => [created, ...prev]);
      return created;
    };

    ctx.delete = async (id: string, videoItem?: unknown) => {
      void videoItem;
      await store.delete(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
    };

    ctx.update = async (id: string, videoResponse: VideoResponse) => {
      const updated = await store.update(id, videoResponse);
      setItems((prev) => prev.map((x) => (x.id === id ? updated : x)));
      return updated;
    };

    return ctx;
  }, [store, items, refresh]);

  return (
    <VideosContext.Provider value={ctxValue}>{children}</VideosContext.Provider>
  );
};

export const useVideos = () => {
  const ctx = useContext(VideosContext);
  if (!ctx) throw new Error("useVideos must be used within VideosProvider");
  return ctx;
};
