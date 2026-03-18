import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useAppStore } from "aihappey-state";
import type {
  RemoteSkill,
  SkillCatalogItem,
  SkillDownloadState,
  SkillImportResult,
  SkillImportSource,
  SkillStore,
  StoredSkill,
} from "./types";
import { IndexedDBSkillStore } from "./stores/IndexedDBSkillStore";

export type SkillsContextType = SkillStore & {
  items: SkillCatalogItem[];
  refresh: () => void;
  ensureDownloadedByName: (name: string) => Promise<StoredSkill | undefined>;
};

const SkillsContext = createContext<SkillsContextType | null>(null);

export const indexedDbSkillStore = new IndexedDBSkillStore();

type SkillsProviderProps = {
  children: ReactNode;
  skillsApi?: string;
  getAccessToken?: () => Promise<string>;
  headers?: Record<string, string>;
  fetch?: typeof globalThis.fetch;
};

function toRemoteCatalogItem(
  skill: RemoteSkill,
  downloadState: SkillDownloadState = "remote"
): SkillCatalogItem {
  const createdAt = Number(skill.created_at ?? 0) * 1000;
  const defaultVersion = String(skill.default_version ?? skill.latest_version ?? "1");
  const latestVersion = String(skill.latest_version ?? skill.default_version ?? defaultVersion);

  return {
    id: skill.id,
    skillId: skill.id,
    name: skill.name,
    description: skill.description,
    createdAt,
    updatedAt: createdAt,
    origin: "remote",
    object: "skill",
    version: defaultVersion,
    defaultVersion,
    latestVersion,
    remoteCreatedAt: createdAt,
    downloadState,
    isDownloaded: false,
    source: "remote-archive",
    rootPath: "",
    entryPath: "",
    fileCount: 0,
    diagnostics: [],
  };
}

function buildMergedItems(
  localItems: SkillCatalogItem[],
  remoteItems: RemoteSkill[],
  downloadStates: Record<string, SkillDownloadState>
) {
  const byRemoteIdentity = new Map<string, RemoteSkill>();
  for (const item of remoteItems) {
    byRemoteIdentity.set(item.id, item);
    byRemoteIdentity.set(item.name, item);
  }

  const merged = new Map<string, SkillCatalogItem>();

  for (const remote of remoteItems) {
    const catalogItem = toRemoteCatalogItem(remote, downloadStates[remote.id] ?? "remote");
    merged.set(catalogItem.skillId || catalogItem.name, catalogItem);
  }

  for (const local of localItems) {
    const remote = byRemoteIdentity.get(local.skillId) ?? byRemoteIdentity.get(local.name);
    const localWithRemote: SkillCatalogItem = {
      ...local,
      defaultVersion: remote?.default_version ?? local.defaultVersion,
      latestVersion: remote?.latest_version ?? local.latestVersion,
      remoteCreatedAt: remote ? remote.created_at * 1000 : local.remoteCreatedAt,
      downloadState: downloadStates[local.skillId] ?? "downloaded",
      isDownloaded: true,
    };
    merged.set(localWithRemote.skillId || localWithRemote.name, localWithRemote);
  }

  return Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export const SkillsProvider = ({
  children,
  skillsApi,
  getAccessToken,
  headers,
  fetch: customFetch,
}: SkillsProviderProps) => {
  useAppStore((s) => s.conversationStorage);

  const store = useMemo<SkillStore>(() => indexedDbSkillStore, []);
  const [localItems, setLocalItems] = useState<SkillCatalogItem[]>([]);
  const [remoteItems, setRemoteItems] = useState<RemoteSkill[]>([]);
  const [downloadStates, setDownloadStates] = useState<Record<string, SkillDownloadState>>({});
  const inflightDownloads = useRef(new Map<string, Promise<StoredSkill | undefined>>());

  const createRequestHeaders = useCallback(async () => {
    const nextHeaders: Record<string, string> = { ...(headers ?? {}) };
    if (getAccessToken) {
      const token = await getAccessToken();
      if (token) {
        nextHeaders.Authorization = `Bearer ${token}`;
      }
    }
    return nextHeaders;
  }, [getAccessToken, headers]);

  const loadRemoteItems = useCallback(async (): Promise<RemoteSkill[]> => {
    if (!skillsApi) return [];
    const response = await (customFetch ?? fetch)(skillsApi, {
      headers: await createRequestHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to load remote skills: ${response.status}`);
    }

    const payload = (await response.json()) as { data?: RemoteSkill[] };
    return Array.isArray(payload?.data) ? payload.data : [];
  }, [createRequestHeaders, customFetch, skillsApi]);

  const refreshAsync = useCallback(async () => {
    const nextLocalItems = await store.list();
    setLocalItems(nextLocalItems);

    try {
      setRemoteItems(await loadRemoteItems());
    } catch {
      setRemoteItems([]);
    }
  }, [loadRemoteItems, store]);

  const mergedItems = useMemo(
    () => buildMergedItems(localItems, remoteItems, downloadStates),
    [downloadStates, localItems, remoteItems]
  );

  const refresh = useCallback(() => {
    void refreshAsync();
  }, [refreshAsync]);

  const ensureDownloadedByName = useCallback(
    async (name: string): Promise<StoredSkill | undefined> => {
      const existing = await store.readByName(name);
      if (existing) return existing;

      const remote = remoteItems.find((item) => item.name === name || item.id === name);
      if (!remote || !skillsApi) return undefined;

      const pending = inflightDownloads.current.get(remote.id);
      if (pending) return pending;

      const task = (async () => {
        setDownloadStates((prev) => ({ ...prev, [remote.id]: "downloading" }));
        try {
          const response = await (customFetch ?? fetch)(
            `${skillsApi}/${encodeURIComponent(remote.id)}/content`,
            {
              headers: await createRequestHeaders(),
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to download skill ${remote.name}: ${response.status}`);
          }

          const blob = await response.blob();
          await store.importArchive(blob, "remote-archive");
          const nextLocalItems = await store.list();
          setLocalItems(nextLocalItems);
          setDownloadStates((prev) => ({ ...prev, [remote.id]: "downloaded" }));
          return await store.readByName(remote.name);
        } catch (error) {
          setDownloadStates((prev) => ({ ...prev, [remote.id]: "error" }));
          throw error;
        } finally {
          inflightDownloads.current.delete(remote.id);
        }
      })();

      inflightDownloads.current.set(remote.id, task);
      return task;
    },
    [createRequestHeaders, customFetch, remoteItems, skillsApi, store]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const ctxValue = useMemo(() => {
    const ctx = Object.assign(
      Object.create(Object.getPrototypeOf(store)),
      store,
      { items: mergedItems, refresh, ensureDownloadedByName }
    ) as SkillsContextType;

    ctx.list = async () => mergedItems;

    ctx.read = async (id: string) => {
      const local = await store.read(id);
      if (local) return local;
      const item = mergedItems.find((entry) => entry.id === id || entry.skillId === id);
      if (!item) return undefined;
      return ensureDownloadedByName(item.name);
    };

    ctx.readByName = async (name: string) => {
      const local = await store.readByName(name);
      if (local) return local;
      return ensureDownloadedByName(name);
    };

    ctx.exportArchive = async (id: string) => {
      const direct = await store.exportArchive(id);
      if (direct) return direct;

      const item = mergedItems.find((entry) => entry.id === id || entry.skillId === id);
      if (!item) return undefined;

      const stored = await ensureDownloadedByName(item.name);
      if (!stored) return undefined;
      return store.exportArchive(stored.id);
    };

    ctx.importArchive = async (
      file: Blob,
      source?: SkillImportSource
    ): Promise<SkillImportResult> => {
      const result = await store.importArchive(file, source);
      setLocalItems(await store.list());
      return result;
    };

    ctx.delete = async (id: string) => {
      await store.delete(id);
      setLocalItems(await store.list());
    };

    return ctx;
  }, [ensureDownloadedByName, mergedItems, refresh, store]);

  return <SkillsContext.Provider value={ctxValue}>{children}</SkillsContext.Provider>;
};

export const useSkills = () => {
  const ctx = useContext(SkillsContext);
  if (!ctx) {
    throw new Error("useSkills must be used within SkillsProvider");
  }
  return ctx;
};
