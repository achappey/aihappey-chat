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
import type {
  SkillCatalogItem,
  SkillImportResult,
  SkillImportSource,
  SkillStore,
} from "./types";
import { IndexedDBSkillStore } from "./stores/IndexedDBSkillStore";

export type SkillsContextType = SkillStore & {
  items: SkillCatalogItem[];
  refresh: () => void;
};

const SkillsContext = createContext<SkillsContextType | null>(null);

export const indexedDbSkillStore = new IndexedDBSkillStore();

export const SkillsProvider = ({ children }: { children: ReactNode }) => {
  useAppStore((s) => s.conversationStorage);

  const store = useMemo<SkillStore>(() => indexedDbSkillStore, []);
  const [items, setItems] = useState<SkillCatalogItem[]>([]);

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
      { items, refresh }
    ) as SkillsContextType;

    ctx.importArchive = async (
      file: Blob,
      source?: SkillImportSource
    ): Promise<SkillImportResult> => {
      const result = await store.importArchive(file, source);
      setItems(await store.list());
      return result;
    };

    ctx.delete = async (id: string) => {
      await store.delete(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    };

    return ctx;
  }, [store, items, refresh]);

  return <SkillsContext.Provider value={ctxValue}>{children}</SkillsContext.Provider>;
};

export const useSkills = () => {
  const ctx = useContext(SkillsContext);
  if (!ctx) {
    throw new Error("useSkills must be used within SkillsProvider");
  }
  return ctx;
};
