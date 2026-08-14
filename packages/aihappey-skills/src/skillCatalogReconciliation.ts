import type {
  DataList,
  Skill,
  SkillCatalogItem,
  SkillDownloadState,
  SkillListParams,
} from "./types";

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

/**
 * Reconciles API-shaped skill lists by stable ID only.
 *
 * Names are display metadata, not identities. This permits a locally authored
 * skill and a separately deployed catalog skill to retain the same name while
 * remaining independently addressable.
 */
export function reconcileSkillList(
  localSkills: Skill[],
  remoteSkills: Skill[],
  query?: SkillListParams
): DataList<Skill> {
  const reconciled = new Map<string, Skill>();

  for (const remote of remoteSkills) reconciled.set(remote.id, remote);
  for (const local of localSkills) {
    reconciled.set(local.id, reconciled.get(local.id) ?? local);
  }

  const direction = query?.order === "asc" ? 1 : -1;
  const items = Array.from(reconciled.values()).sort(
    (a, b) => direction * (a.created_at - b.created_at || a.name.localeCompare(b.name))
  );

  return paginateList(items, query?.after, query?.limit);
}

/**
 * Builds the UI catalog while preserving provenance for same-name skills.
 * An exact ID match represents a downloaded copy of the remote skill; a name
 * match alone represents two distinct skills and therefore produces two cards.
 */
export function reconcileSkillCatalogItems(
  localItems: SkillCatalogItem[],
  remoteItems: Skill[],
  downloadStates: Record<string, SkillDownloadState>
): SkillCatalogItem[] {
  const remoteById = new Map(remoteItems.map((item) => [item.id, item]));
  const reconciled = new Map<string, SkillCatalogItem>();

  for (const remote of remoteItems) {
    const catalogItem = toRemoteCatalogItem(remote, downloadStates[remote.id] ?? "remote");
    reconciled.set(catalogItem.skillId, catalogItem);
  }

  for (const local of localItems) {
    const remote = remoteById.get(local.skillId);
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
    reconciled.set(localWithRemote.skillId, localWithRemote);
  }

  return Array.from(reconciled.values()).sort((a, b) => a.name.localeCompare(b.name));
}
