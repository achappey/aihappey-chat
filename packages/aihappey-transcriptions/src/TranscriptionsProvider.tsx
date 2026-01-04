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
import type { TranscriptionResponse } from "aihappey-ai";
import { useAppStore } from "aihappey-state";
import type {
  TranscriptionItem,
  TranscriptionStore,
  TranscriptionStorageKind,
} from "./types";
import { IndexedDBTranscriptionStore } from "./stores/IndexedDBTranscriptionStore";

export type TranscriptionsContextType = TranscriptionStore & {
  items: TranscriptionItem[];
  refresh: () => void;
};

const TranscriptionsContext =
  createContext<TranscriptionsContextType | null>(null);

export const indexedDbTranscriptionStore =
  new IndexedDBTranscriptionStore();

export const TranscriptionsProvider = ({
  children,
  storageKind,
}: {
  children: ReactNode;
  storageKind?: TranscriptionStorageKind;
}) => {
  useAppStore((s) => s.conversationStorage);

  const store = useMemo<TranscriptionStore>(() => {
    if (storageKind === "local") return indexedDbTranscriptionStore;
    return indexedDbTranscriptionStore;
  }, [storageKind]);

  const [items, setItems] = useState<TranscriptionItem[]>([]);

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
    ) as TranscriptionsContextType;

    ctx.add = async (
      name: string,
      blob: Blob,
      transcription: TranscriptionResponse
    ) => {
      const created = await store.add(name, blob, transcription);
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
    <TranscriptionsContext.Provider value={ctxValue}>
      {children}
    </TranscriptionsContext.Provider>
  );
};

export const useTranscriptions = () => {
  const ctx = useContext(TranscriptionsContext);
  if (!ctx)
    throw new Error(
      "useTranscriptions must be used within TranscriptionsProvider"
    );
  return ctx;
};
