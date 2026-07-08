import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { ResponseApiCreateRequest, ResponseApiResponse } from "aihappey-ai";
import { useAppStore } from "aihappey-state";
import type { JobItem, JobStorageKind, JobStore } from "./types";
import { IndexedDBJobStore } from "./stores/IndexedDBJobStore";

export type JobsContextType = JobStore & {
  items: JobItem[];
  refresh: () => void;
};

const JobsContext = createContext<JobsContextType | null>(null);

export const indexedDbJobStore = new IndexedDBJobStore();

export const JobsProvider = ({
  children,
  storageKind,
}: {
  children: ReactNode;
  storageKind?: JobStorageKind;
}) => {
  useAppStore((s) => s.conversationStorage);

  const store = useMemo<JobStore>(() => {
    if (storageKind === "local") return indexedDbJobStore;
    return indexedDbJobStore;
  }, [storageKind]);

  const [items, setItems] = useState<JobItem[]>([]);

  const refresh = useCallback(() => {
    store.list().then(setItems);
  }, [store]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const ctxValue = useMemo(() => {
    const ctx = Object.assign(
      Object.create(Object.getPrototypeOf(store)),
      store,
      { items, refresh },
    ) as JobsContextType;

    ctx.add = async (
      request: ResponseApiCreateRequest,
      response: ResponseApiResponse,
      inputPreview?: string,
    ) => {
      const created = await store.add(request, response, inputPreview);
      setItems((prev) => [created, ...prev]);
      return created;
    };

    ctx.update = async (id: string, response: ResponseApiResponse) => {
      const updated = await store.update(id, response);
      setItems((prev) => prev.map((x) => (x.id === id ? updated : x)));
      return updated;
    };

    ctx.delete = async (id: string, jobItem?: unknown) => {
      await store.delete(id, jobItem);
      setItems((prev) => prev.filter((x) => x.id !== id));
    };

    return ctx;
  }, [store, items, refresh]);

  return <JobsContext.Provider value={ctxValue}>{children}</JobsContext.Provider>;
};

export const useJobs = () => {
  const ctx = useContext(JobsContext);
  if (!ctx) throw new Error("useJobs must be used within JobsProvider");
  return ctx;
};

