import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { IndexedDBPluginStore } from "./stores/IndexedDBPluginStore";
import type {
  PluginArchiveExport,
  PluginCatalogItem,
  PluginDraft,
  PluginImportResult,
  PluginsConfig,
  StoredPlugin,
} from "./types";
import { isValidExtensionNamespace } from "./validation";

export type PluginsContextType = {
  items: PluginCatalogItem[];
  extensionNamespace?: string;
  refresh: () => Promise<void>;
  read: (id: string) => Promise<StoredPlugin | undefined>;
  create: (draft: PluginDraft) => Promise<StoredPlugin>;
  update: (id: string, draft: PluginDraft) => Promise<StoredPlugin>;
  delete: (id: string) => Promise<void>;
  importArchive: (file: Blob) => Promise<PluginImportResult>;
  exportArchive: (id: string) => Promise<PluginArchiveExport | undefined>;
};

const PluginsContext = createContext<PluginsContextType | null>(null);
export const indexedDbPluginStore = new IndexedDBPluginStore();

export const PluginsProvider = ({ children, config }: { children: ReactNode; config?: PluginsConfig }) => {
  const store = useMemo(() => indexedDbPluginStore, []);
  const [items, setItems] = useState<PluginCatalogItem[]>([]);
  const extensionNamespace = isValidExtensionNamespace(config?.extensionNamespace)
    ? config.extensionNamespace
    : undefined;

  const refresh = useCallback(async () => setItems(await store.list()), [store]);
  useEffect(() => { void refresh(); }, [refresh]);

  const value = useMemo<PluginsContextType>(() => ({
    items,
    extensionNamespace,
    refresh,
    read: store.read,
    create: async (draft) => { const result = await store.create(draft); await refresh(); return result; },
    update: async (id, draft) => { const result = await store.update(id, draft); await refresh(); return result; },
    delete: async (id) => { await store.delete(id); await refresh(); },
    importArchive: async (file) => { const result = await store.importArchive(file); await refresh(); return result; },
    exportArchive: store.exportArchive,
  }), [extensionNamespace, items, refresh, store]);

  return <PluginsContext.Provider value={value}>{children}</PluginsContext.Provider>;
};

export function usePlugins() {
  const value = useContext(PluginsContext);
  if (!value) throw new Error("usePlugins must be used within PluginsProvider");
  return value;
}
