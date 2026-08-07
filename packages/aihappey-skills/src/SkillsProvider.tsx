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
import { store as appStore, useAppStore } from "aihappey-state";
import type {
  ContentRetrieveParams,
  DataList,
  Skill,
  SkillArchiveExport,
  SkillCatalogItem,
  SkillFileWriteDefinition,
  SkillDownloadState,
  SkillInspectionResult,
  SkillImportResult,
  SkillDraftDefinition,
  SkillImportOptions,
  SkillImportSource,
  SkillListParams,
  SkillManifestUpdateDefinition,
  SkillUpdateParams,
  SkillVersion,
  SkillWriteDefinition,
  StoredSkill,
  VersionListParams,
} from "./types";
import { IndexedDBSkillStore } from "./stores/IndexedDBSkillStore";

const EMPTY_STRING_ARRAY: string[] = [];

function arraysEqual(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export type SkillsContextType = {
  items: SkillCatalogItem[];
  refresh: () => void;
  list: (query?: SkillListParams) => Promise<DataList<Skill>>;
  retrieve: (skillId: string) => Promise<Skill | undefined>;
  update: (skillId: string, body: SkillUpdateParams) => Promise<Skill>;
  content: {
    retrieve: (skillId: string) => Promise<Response>;
  };
  versions: {
    list: (skillId: string, query?: VersionListParams) => Promise<DataList<SkillVersion>>;
    content: {
      retrieve: (version: string, params: ContentRetrieveParams) => Promise<Response>;
    };
  };
  read: (id: string) => Promise<StoredSkill | undefined>;
  readByName: (name: string) => Promise<StoredSkill | undefined>;
  exportArchive: (id: string) => Promise<SkillArchiveExport | undefined>;
  importArchive: (
    file: Blob,
    source?: SkillImportSource,
    options?: SkillImportOptions
  ) => Promise<SkillImportResult>;
  createSkill: (definition: SkillWriteDefinition) => Promise<StoredSkill>;
  saveSkillDraft: (skillId: string | undefined, definition: SkillDraftDefinition) => Promise<StoredSkill>;
  inspectSkill: (skillId: string, version?: string) => Promise<SkillInspectionResult>;
  updateSkillManifest: (skillId: string, definition: SkillManifestUpdateDefinition) => Promise<StoredSkill>;
  upsertSkillFile: (skillId: string, file: SkillFileWriteDefinition) => Promise<StoredSkill>;
  deleteSkillFile: (skillId: string, relativePath: string) => Promise<StoredSkill>;
  restoreSkillVersion: (skillId: string, version: string) => Promise<StoredSkill>;
  delete: (id: string) => Promise<void>;
  ensureDownloaded: (skillId: string, version?: string) => Promise<StoredSkill | undefined>;
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

function paginateList<T extends { id: string }>(items: T[], after?: string, limit?: number): DataList<T> {
  const startIndex = after ? Math.max(items.findIndex((item) => item.id === after) + 1, 0) : 0;
  const page = items.slice(startIndex, limit ? startIndex + limit : undefined);

  return {
    object: "list",
    has_more: startIndex + page.length < items.length,
    first_id: page[0]?.id,
    last_id: page[page.length - 1]?.id,
    data: page,
  };
}

function splitRemoteSkillId(skillId: string) {
  const idx = String(skillId ?? "").indexOf("/");
  if (idx === -1) {
    return { providerId: undefined, providerSkillId: skillId };
  }

  return {
    providerId: skillId.slice(0, idx),
    providerSkillId: skillId.slice(idx + 1),
  };
}

function buildRemoteSkillUrl(baseUrl: string, skillId: string, suffix = "") {
  const { providerId, providerSkillId } = splitRemoteSkillId(skillId);
  if (providerId) {
    return `${baseUrl}/${encodeURIComponent(providerId)}/${encodeURIComponent(providerSkillId)}${suffix}`;
  }
  return `${baseUrl}/${encodeURIComponent(skillId)}${suffix}`;
}

function appendQuery<T extends object>(url: string, query?: T) {
  if (!query) return url;
  const search = new URLSearchParams();
  Object.entries(query as Record<string, unknown>).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });

  const qs = search.toString();
  return qs ? `${url}?${qs}` : url;
}

function toRemoteCatalogItem(
  skill: Skill,
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
    version: latestVersion,
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
    versionCount: 0,
    downloadedVersion: undefined,
  };
}

function buildMergedSkillList(localSkills: Skill[], remoteSkills: Skill[], query?: SkillListParams) {
  const merged = new Map<string, Skill>();
  const byRemoteName = new Map<string, Skill>();

  for (const remote of remoteSkills) {
    merged.set(remote.id, remote);
    byRemoteName.set(remote.name, remote);
  }

  for (const local of localSkills) {
    const remote = merged.get(local.id) ?? byRemoteName.get(local.name);
    merged.set(local.id, remote ?? local);
  }

  const direction = query?.order === "asc" ? 1 : -1;
  const items = Array.from(merged.values()).sort(
    (a, b) => direction * (a.created_at - b.created_at || a.name.localeCompare(b.name))
  );

  return paginateList(items, query?.after, query?.limit);
}

function buildMergedItems(
  localItems: SkillCatalogItem[],
  remoteItems: Skill[],
  downloadStates: Record<string, SkillDownloadState>
) {
  const byRemoteIdentity = new Map<string, Skill>();
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
      origin: remote ? "remote" : local.origin,
      defaultVersion: remote?.default_version ?? local.defaultVersion,
      latestVersion: remote?.latest_version ?? local.latestVersion,
      remoteCreatedAt: remote ? remote.created_at * 1000 : local.remoteCreatedAt,
      downloadState: downloadStates[local.skillId] ?? "downloaded",
      isDownloaded: true,
      version: local.downloadedVersion ?? local.version,
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
  const enabledSkillIds = useAppStore((s) => s.enabledSkillIds);
  const setEnabledSkillIds = useAppStore((s) => s.setEnabledSkillIds);
  const legacyEnabledSkillNames = useAppStore(
    (s) => ((s as any).__legacyEnabledSkillNames as string[] | undefined) ?? EMPTY_STRING_ARRAY
  );

  const store = useMemo(() => indexedDbSkillStore, []);
  const [localItems, setLocalItems] = useState<SkillCatalogItem[]>([]);
  const [remoteItems, setRemoteItems] = useState<Skill[]>([]);
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

  const loadRemoteItems = useCallback(async (): Promise<Skill[]> => {
    if (!skillsApi) return [];
    const response = await (customFetch ?? fetch)(skillsApi, {
      headers: await createRequestHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to load remote skills: ${response.status}`);
    }

    const payload = (await response.json()) as DataList<Skill>;
    return Array.isArray(payload?.data) ? payload.data : [];
  }, [createRequestHeaders, customFetch, skillsApi]);

  const loadRemoteSkillVersions = useCallback(
    async (skillId: string, query?: VersionListParams): Promise<DataList<SkillVersion>> => {
      if (!skillsApi) {
        return {
          object: "list",
          has_more: false,
          first_id: undefined,
          last_id: undefined,
          data: [],
        };
      }

      const response = await (customFetch ?? fetch)(
        appendQuery(
          buildRemoteSkillUrl(skillsApi, skillId, "/versions"),
          query
        ),
        {
          headers: await createRequestHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to load remote skill versions for ${skillId}: ${response.status}`);
      }

      return (await response.json()) as DataList<SkillVersion>;
    },
    [createRequestHeaders, customFetch, skillsApi]
  );

  const refreshAsync = useCallback(async () => {
    const nextLocalItems = await store.listCatalogItems();
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

  const ensureDownloaded = useCallback(
    async (skillId: string, version?: string): Promise<StoredSkill | undefined> => {
      const existing = version ? await store.readVersion(skillId, version) : await store.read(skillId);
      if (existing) return existing;

      const remote = remoteItems.find((item) => item.id === skillId || item.name === skillId);
      if (!remote || !skillsApi) return undefined;

      const targetVersion = String(version ?? remote.latest_version ?? remote.default_version ?? "1");
      const pendingKey = `${remote.id}@${targetVersion}`;
      const pending = inflightDownloads.current.get(pendingKey);
      if (pending) return pending;

      const task = (async () => {
        setDownloadStates((prev) => ({ ...prev, [remote.id]: "downloading" }));
        try {
          const response = await (customFetch ?? fetch)(
            buildRemoteSkillUrl(
              skillsApi,
              remote.id,
              `/versions/${encodeURIComponent(targetVersion)}/content`
            ),
            {
              headers: await createRequestHeaders(),
            }
          );

          if (!response.ok) {
            throw new Error(
              `Failed to download skill ${remote.name} version ${targetVersion}: ${response.status}`
            );
          }

          const blob = await response.blob();
          await store.importArchive(blob, "remote-archive", {
            skillId: remote.id,
            version: targetVersion,
            defaultVersion: targetVersion,
            latestVersion: targetVersion,
          });
          await store.pruneVersions(remote.id, targetVersion);
          setLocalItems(await store.listCatalogItems());
          setDownloadStates((prev) => ({ ...prev, [remote.id]: "downloaded" }));
          return await store.readVersion(remote.id, targetVersion);
        } catch (error) {
          setDownloadStates((prev) => ({ ...prev, [remote.id]: "error" }));
          throw error;
        } finally {
          inflightDownloads.current.delete(pendingKey);
        }
      })();

      inflightDownloads.current.set(pendingKey, task);
      return task;
    },
    [createRequestHeaders, customFetch, remoteItems, skillsApi, store]
  );

  const ensureDownloadedByName = useCallback(
    async (name: string): Promise<StoredSkill | undefined> => {
      const existing = await store.readByName(name);
      if (existing) return existing;

      const remote = remoteItems.find((item) => item.name === name || item.id === name);
      if (!remote) return undefined;
      return ensureDownloaded(remote.id, remote.latest_version ?? remote.default_version);
    },
    [ensureDownloaded, remoteItems, store]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const legacyNames = Array.isArray(legacyEnabledSkillNames)
      ? legacyEnabledSkillNames.filter(Boolean)
      : EMPTY_STRING_ARRAY;
    if (legacyNames.length === 0) return;
    if (mergedItems.length === 0) return;

    const byName = new Map<string, string[]>();
    for (const item of mergedItems) {
      const current = byName.get(item.name) ?? [];
      byName.set(item.name, [...current, item.skillId]);
    }

    const migratedSkillIds = legacyNames.flatMap((name) => byName.get(name) ?? []);
    const unresolvedNames = legacyNames.filter((name) => !byName.has(name));
    const nextEnabledSkillIds = Array.from(new Set([...(enabledSkillIds ?? EMPTY_STRING_ARRAY), ...migratedSkillIds]));

    if (migratedSkillIds.length > 0 && !arraysEqual(nextEnabledSkillIds, enabledSkillIds ?? EMPTY_STRING_ARRAY)) {
      setEnabledSkillIds(nextEnabledSkillIds);
    }

    if (!arraysEqual(unresolvedNames, legacyNames)) {
      appStore.setState({
        __legacyEnabledSkillNames: unresolvedNames,
      } as any);
    }
  }, [enabledSkillIds, legacyEnabledSkillNames, mergedItems, setEnabledSkillIds]);

  const ctxValue = useMemo<SkillsContextType>(() => ({
    items: mergedItems,
    refresh,
    list: async (query?: SkillListParams) => {
      const local = await store.listSkills({ order: query?.order });
      return buildMergedSkillList(local.data, remoteItems, query);
    },
    retrieve: async (skillId: string) => {
      const remote = remoteItems.find((item) => item.id === skillId || item.name === skillId);
      if (remote) return remote;
      return store.retrieveSkill(skillId);
    },
    update: async (skillId: string, body: SkillUpdateParams) => {
      if (remoteItems.some((item) => item.id === skillId || item.name === skillId)) {
        throw new Error("Remote skills are read-only.");
      }

      const updated = await store.updateSkill(skillId, body);
      setLocalItems(await store.listCatalogItems());
      return updated;
    },
    content: {
      retrieve: async (skillId: string) => {
        const localArchive = await store.exportArchive(skillId);
        if (localArchive) {
          return new Response(localArchive.blob, {
            headers: {
              "Content-Type": "application/zip",
              "Content-Disposition": `attachment; filename=\"${localArchive.filename}\"`,
            },
          });
        }

        if (skillsApi && remoteItems.some((item) => item.id === skillId || item.name === skillId)) {
          return (customFetch ?? fetch)(buildRemoteSkillUrl(skillsApi, skillId, "/content"), {
            headers: await createRequestHeaders(),
          });
        }

        throw new Error(`Skill ${skillId} could not be retrieved.`);
      },
    },
    versions: {
      list: async (skillId: string, query?: VersionListParams) => {
        if (skillsApi && remoteItems.some((item) => item.id === skillId || item.name === skillId)) {
          try {
            return await loadRemoteSkillVersions(skillId, query);
          } catch {
            // Fall back to local-only versions when the remote endpoint is unavailable.
          }
        }

        return store.listSkillVersions(skillId, query);
      },
      content: {
        retrieve: async (version: string, params: ContentRetrieveParams) => {
          const localArchive = await store.exportVersionArchive(params.skill_id, version);
          if (localArchive) {
            return new Response(localArchive.blob, {
              headers: {
                "Content-Type": "application/zip",
                "Content-Disposition": `attachment; filename=\"${localArchive.filename}\"`,
              },
            });
          }

          if (
            skillsApi &&
            remoteItems.some((item) => item.id === params.skill_id || item.name === params.skill_id)
          ) {
            return (customFetch ?? fetch)(
              buildRemoteSkillUrl(
                skillsApi,
                params.skill_id,
                `/versions/${encodeURIComponent(version)}/content`
              ),
              {
                headers: await createRequestHeaders(),
              }
            );
          }

          throw new Error(`Skill ${params.skill_id} version ${version} could not be retrieved.`);
        },
      },
    },
    read: async (id: string) => store.read(id),
    readByName: async (name: string) => {
      const local = await store.readByName(name);
      if (local) return local;
      return ensureDownloadedByName(name);
    },
    exportArchive: async (id: string) => store.exportArchive(id),
    importArchive: async (
      file: Blob,
      source?: SkillImportSource,
      options?: SkillImportOptions
    ): Promise<SkillImportResult> => {
      const result = await store.importArchive(file, source, options);
      setLocalItems(await store.listCatalogItems());
      return result;
    },
    createSkill: async (definition: SkillWriteDefinition) => {
      const result = await store.createSkill(definition);
      setLocalItems(await store.listCatalogItems());
      return result;
    },
    saveSkillDraft: async (skillId: string | undefined, definition: SkillDraftDefinition) => {
      if (skillId && remoteItems.some((item) => item.id === skillId || item.name === skillId)) {
        throw new Error("Remote skills are read-only.");
      }
      const result = await store.saveSkillDraft(skillId, definition);
      setLocalItems(await store.listCatalogItems());
      return result;
    },
    inspectSkill: (skillId: string, version?: string) => store.inspectSkill(skillId, version),
    updateSkillManifest: async (skillId: string, definition: SkillManifestUpdateDefinition) => {
      const result = await store.updateSkillManifest(skillId, definition);
      setLocalItems(await store.listCatalogItems());
      return result;
    },
    upsertSkillFile: async (skillId: string, file: SkillFileWriteDefinition) => {
      const result = await store.upsertSkillFile(skillId, file);
      setLocalItems(await store.listCatalogItems());
      return result;
    },
    deleteSkillFile: async (skillId: string, relativePath: string) => {
      const result = await store.deleteSkillFile(skillId, relativePath);
      setLocalItems(await store.listCatalogItems());
      return result;
    },
    restoreSkillVersion: async (skillId: string, version: string) => {
      const result = await store.restoreSkillVersion(skillId, version);
      setLocalItems(await store.listCatalogItems());
      return result;
    },
    delete: async (id: string) => {
      await store.delete(id);
      setLocalItems(await store.listCatalogItems());
    },
    ensureDownloaded,
    ensureDownloadedByName,
  }), [
    createRequestHeaders,
    customFetch,
    ensureDownloaded,
    ensureDownloadedByName,
    loadRemoteSkillVersions,
    mergedItems,
    refresh,
    remoteItems,
    skillsApi,
    store,
  ]);

  return <SkillsContext.Provider value={ctxValue}>{children}</SkillsContext.Provider>;
};

export const useSkills = () => {
  const ctx = useContext(SkillsContext);
  if (!ctx) {
    throw new Error("useSkills must be used within SkillsProvider");
  }
  return ctx;
};
