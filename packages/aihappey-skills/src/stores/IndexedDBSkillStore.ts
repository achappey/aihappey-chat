import { get, set } from "idb-keyval";
import { combineImportResult, extractSkillsFromArchive, toStoredSkill } from "../importSkillsFromZip";
import { exportSkillToArchive } from "../exportSkillToArchive";
import type {
  DataList,
  SkillArchiveExport,
  SkillCatalogItem,
  Skill,
  SkillImportResult,
  SkillImportOptions,
  SkillImportSource,
  SkillListParams,
  SkillStore,
  SkillUpdateParams,
  SkillVersion,
  StoredSkill,
  VersionListParams,
} from "../types";

const DB_KEY = "aihappey_skills_v1";

const POSITIVE_INTEGER_RE = /^[1-9]\d*$/;
const VERSION_IDENTIFIER_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

function buildSkillId(name: string) {
  const slug = String(name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "skill";
  return `skill_${slug}`;
}

function normalizeVersion(value: string | undefined, fallback: string) {
  const text = String(value ?? "").trim();
  return VERSION_IDENTIFIER_RE.test(text) ? text : fallback;
}

function compareVersions(a: string | undefined, b: string | undefined) {
  const left = normalizeVersion(a, "");
  const right = normalizeVersion(b, "");
  const leftIsInteger = POSITIVE_INTEGER_RE.test(left);
  const rightIsInteger = POSITIVE_INTEGER_RE.test(right);

  if (leftIsInteger && rightIsInteger) {
    return Number.parseInt(left, 10) - Number.parseInt(right, 10);
  }

  if (leftIsInteger !== rightIsInteger) {
    return leftIsInteger ? -1 : 1;
  }

  return left.localeCompare(right, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

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

function needsMigration(skill: Partial<StoredSkill>) {
  return !skill.skillId || !skill.origin || !skill.object || !skill.version || !skill.defaultVersion || !skill.latestVersion;
}

function normalizeStoredSkill(skill: StoredSkill): StoredSkill {
  const skillId = skill.skillId || skill.frontmatter?.id || buildSkillId(skill.name);
  const version = normalizeVersion(skill.version || skill.frontmatter?.version, "1");
  const defaultVersion = normalizeVersion(
    skill.defaultVersion || skill.frontmatter?.defaultVersion || version,
    version
  );
  const latestVersion = normalizeVersion(
    skill.latestVersion || skill.frontmatter?.latestVersion || version,
    version
  );

  return {
    ...skill,
    skillId,
    origin: "local",
    object: "skill",
    version,
    defaultVersion,
    latestVersion,
    frontmatter: {
      ...skill.frontmatter,
      id: skillId,
      version,
      defaultVersion,
      latestVersion,
    },
  };
}

async function load(): Promise<StoredSkill[]> {
  if (typeof window === "undefined") return [];
  const data = (await get(DB_KEY)) as StoredSkill[] | undefined;
  return data ?? [];
}

async function save(items: StoredSkill[]) {
  if (typeof window !== "undefined") {
    await set(DB_KEY, items);
  }
}

function toCatalogItem(skill: StoredSkill): SkillCatalogItem {
  return {
    id: skill.skillId,
    skillId: skill.skillId,
    name: skill.name,
    description: skill.description,
    createdAt: skill.createdAt,
    updatedAt: skill.updatedAt,
    origin: skill.origin,
    object: skill.object,
    version: skill.version,
    defaultVersion: skill.defaultVersion,
    latestVersion: skill.latestVersion,
    remoteCreatedAt: skill.remoteCreatedAt,
    downloadState: "downloaded",
    isDownloaded: true,
    source: skill.source,
    rootPath: skill.rootPath,
    entryPath: skill.entryPath,
    fileCount: skill.files.length,
    diagnostics: skill.diagnostics,
    versionCount: 1,
    downloadedVersion: skill.version,
  };
}

function groupBySkillId(items: StoredSkill[]) {
  const grouped = new Map<string, StoredSkill[]>();
  for (const item of items) {
    const key = item.skillId || item.frontmatter?.id || buildSkillId(item.name);
    const group = grouped.get(key) ?? [];
    group.push(item);
    grouped.set(key, group);
  }
  return grouped;
}

function toSkill(group: StoredSkill[]): Skill {
  const sorted = group.slice().sort((a, b) => compareVersions(a.version, b.version));
  const latest = sorted[sorted.length - 1] ?? group[0];
  const defaultVersion =
    group.find((item) => item.version === group[0]?.defaultVersion)?.version ?? latest.version;
  const current = group.find((item) => item.version === defaultVersion) ?? latest;

  return {
    id: current.skillId,
    object: "skill",
    created_at: Math.floor(Math.min(...group.map((item) => item.createdAt)) / 1000),
    default_version: defaultVersion,
    description: current.description,
    latest_version: latest.version,
    name: current.name,
  };
}

function toSkillVersion(item: StoredSkill): SkillVersion {
  return {
    id: item.id,
    object: "skill.version",
    created_at: Math.floor(item.createdAt / 1000),
    version: item.version,
    name: item.name,
    description: item.description,
    skill_id: item.skillId,
  };
}

export class IndexedDBSkillStore implements SkillStore {
  readonly kind = "indexeddb" as const;
  private data: StoredSkill[] = [];
  private loaded = false;

  private resolveSkillId = (id: string) => {
    const bySkillId = this.data.find((item) => item.skillId === id);
    if (bySkillId) return bySkillId.skillId;

    const byVersionId = this.data.find((item) => item.id === id);
    return byVersionId?.skillId ?? id;
  };

  private getSkillGroup = (skillId: string) => {
    const resolvedSkillId = this.resolveSkillId(skillId);
    return this.data.filter((item) => item.skillId === resolvedSkillId);
  };

  private getDefaultStoredSkill = (group: StoredSkill[]) => {
    if (group.length === 0) return undefined;
    const latest = group.slice().sort((a, b) => compareVersions(a.version, b.version)).pop() ?? group[0];
    const defaultVersion = group[0]?.defaultVersion;
    return group.find((item) => item.version === defaultVersion) ?? latest;
  };

  private syncSkillGroup = (skillId: string, preferredDefaultVersion?: string) => {
    const group = this.getSkillGroup(skillId);
    if (group.length === 0) return;

    const latest = group.slice().sort((a, b) => compareVersions(a.version, b.version)).pop() ?? group[0];
    const currentDefaultVersion = group[0]?.defaultVersion;
    const nextDefaultVersion =
      (preferredDefaultVersion && group.some((item) => item.version === preferredDefaultVersion)
        ? preferredDefaultVersion
        : undefined) ||
      (currentDefaultVersion && group.some((item) => item.version === currentDefaultVersion)
        ? currentDefaultVersion
        : undefined) ||
      latest.version;

    this.data = this.data.map((item) => {
      if (item.skillId !== latest.skillId) return item;

      return {
        ...item,
        defaultVersion: nextDefaultVersion,
        latestVersion: latest.version,
        frontmatter: {
          ...item.frontmatter,
          id: latest.skillId,
          version: item.version,
          defaultVersion: nextDefaultVersion,
          latestVersion: latest.version,
        },
      };
    });
  };

  private ensureLoaded = async () => {
    if (!this.loaded) {
      const loaded = await load();
      const migrated = loaded.map(normalizeStoredSkill);
      this.data = migrated;
      this.loaded = true;
      if (loaded.some(needsMigration)) {
        await save(this.data);
      }
    }
  };

  listCatalogItems = async (): Promise<SkillCatalogItem[]> => {
    await this.ensureLoaded();
    return Array.from(groupBySkillId(this.data).values())
      .map((group) => {
        const current = this.getDefaultStoredSkill(group) ?? group[0];
        const latest = group.slice().sort((a, b) => compareVersions(a.version, b.version)).pop() ?? current;
        return {
          ...toCatalogItem(current),
          createdAt: Math.min(...group.map((item) => item.createdAt)),
          updatedAt: Math.max(...group.map((item) => item.updatedAt)),
          latestVersion: latest.version,
          version: current.version,
          fileCount: current.files.length,
          rootPath: current.rootPath,
          entryPath: current.entryPath,
          diagnostics: group.flatMap((item) => item.diagnostics),
          versionCount: group.length,
          downloadedVersion: current.version,
          source: group.some((item) => item.source === "remote-archive")
            ? "remote-archive"
            : current.source,
        } satisfies SkillCatalogItem;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  listSkills = async (query?: SkillListParams): Promise<DataList<Skill>> => {
    await this.ensureLoaded();

    const direction = query?.order === "asc" ? 1 : -1;
    const items = Array.from(groupBySkillId(this.data).values())
      .map(toSkill)
      .sort((a, b) => direction * (a.created_at - b.created_at || a.name.localeCompare(b.name)));

    return paginateList(items, query?.after, query?.limit);
  };

  retrieveSkill = async (skillId: string): Promise<Skill | undefined> => {
    await this.ensureLoaded();
    const group = this.getSkillGroup(skillId);
    return group.length > 0 ? toSkill(group) : undefined;
  };

  updateSkill = async (skillId: string, body: SkillUpdateParams): Promise<Skill> => {
    await this.ensureLoaded();
    const group = this.getSkillGroup(skillId);
    if (group.length === 0) {
      throw new Error(`Skill ${skillId} was not found locally.`);
    }

    const resolvedSkillId = group[0].skillId;
    const nextDefaultVersion = normalizeVersion(body.default_version, "");
    if (!nextDefaultVersion || !group.some((item) => item.version === nextDefaultVersion)) {
      throw new Error(`Skill ${skillId} does not contain version ${body.default_version}.`);
    }

    const now = Date.now();
    this.data = this.data.map((item) => {
      if (item.skillId !== resolvedSkillId) return item;
      return {
        ...item,
        updatedAt: now,
        defaultVersion: nextDefaultVersion,
        frontmatter: {
          ...item.frontmatter,
          defaultVersion: nextDefaultVersion,
        },
      };
    });

    this.syncSkillGroup(resolvedSkillId, nextDefaultVersion);
    await save(this.data);
    return (await this.retrieveSkill(resolvedSkillId)) as Skill;
  };

  listSkillVersions = async (
    skillId: string,
    query?: VersionListParams
  ): Promise<DataList<SkillVersion>> => {
    await this.ensureLoaded();
    const direction = query?.order === "asc" ? 1 : -1;
    const items = this.getSkillGroup(skillId)
      .map(toSkillVersion)
      .sort((a, b) => direction * compareVersions(a.version, b.version));

    return paginateList(items, query?.after, query?.limit);
  };

  read = async (id: string): Promise<StoredSkill | undefined> => {
    await this.ensureLoaded();
    const direct = this.data.find((item) => item.id === id);
    if (direct) return direct;
    return this.getDefaultStoredSkill(this.getSkillGroup(id));
  };

  readByName = async (name: string): Promise<StoredSkill | undefined> => {
    await this.ensureLoaded();
    const group = Array.from(groupBySkillId(this.data).values()).find(
      (items) => items[0]?.name === name
    );
    return group ? this.getDefaultStoredSkill(group) : undefined;
  };

  readVersion = async (skillId: string, version: string): Promise<StoredSkill | undefined> => {
    await this.ensureLoaded();
    const resolvedSkillId = this.resolveSkillId(skillId);
    return this.data.find((item) => item.skillId === resolvedSkillId && item.version === version);
  };

  exportArchive = async (id: string): Promise<SkillArchiveExport | undefined> => {
    await this.ensureLoaded();
    const skill = await this.read(id);
    if (!skill) return undefined;
    return exportSkillToArchive(skill);
  };

  exportVersionArchive = async (
    skillId: string,
    version: string
  ): Promise<SkillArchiveExport | undefined> => {
    await this.ensureLoaded();
    const skill = await this.readVersion(skillId, version);
    if (!skill) return undefined;
    return exportSkillToArchive(skill);
  };

  importArchive = async (
    file: Blob,
    source: SkillImportSource = "local-zip",
    options?: SkillImportOptions
  ): Promise<SkillImportResult> => {
    await this.ensureLoaded();
    const { parsedSkills, diagnostics } = await extractSkillsFromArchive(file);
    const imported: StoredSkill[] = [];

    for (const parsed of parsedSkills) {
      const scopedSkillId = options?.skillId?.trim() || parsed.frontmatter?.id?.trim();
      const existingGroup = scopedSkillId
        ? this.getSkillGroup(scopedSkillId)
        : this.data.filter((item) => item.name === parsed.name);
      const previous = existingGroup
        .slice()
        .sort((a, b) => compareVersions(b.version, a.version))[0];
      const stored = toStoredSkill(parsed, source, previous, options);
      if (!stored) continue;

      const existingVersion = this.data.find(
        (item) => item.skillId === stored.skillId && item.version === stored.version
      );

      const nextStored: StoredSkill = existingVersion
        ? {
          ...stored,
          id: existingVersion.id,
          createdAt: existingVersion.createdAt,
        }
        : stored;

      this.data = [nextStored, ...this.data.filter(
        (item) => !(item.skillId === nextStored.skillId && item.version === nextStored.version)
      )];

      const preferredDefaultVersion =
        options?.defaultVersion?.trim() ||
        parsed.frontmatter?.defaultVersion?.trim() ||
        existingGroup[0]?.defaultVersion ||
        nextStored.version;

      this.syncSkillGroup(nextStored.skillId, preferredDefaultVersion);

      imported.push((await this.readVersion(nextStored.skillId, nextStored.version)) ?? nextStored);
    }

    await save(this.data);
    return combineImportResult(parsedSkills, imported, diagnostics);
  };

  delete = async (id: string): Promise<void> => {
    await this.ensureLoaded();
    const hasSkillGroup = this.data.some((item) => item.skillId === id);
    this.data = hasSkillGroup
      ? this.data.filter((item) => item.skillId !== id)
      : this.data.filter((item) => item.id !== id);
    await save(this.data);
  };

  deleteVersion = async (skillId: string, version: string): Promise<void> => {
    await this.ensureLoaded();
    const resolvedSkillId = this.resolveSkillId(skillId);
    this.data = this.data.filter(
      (item) => !(item.skillId === resolvedSkillId && item.version === version)
    );
    this.syncSkillGroup(resolvedSkillId);
    await save(this.data);
  };

  pruneVersions = async (skillId: string, keepVersion: string): Promise<void> => {
    await this.ensureLoaded();
    const resolvedSkillId = this.resolveSkillId(skillId);
    this.data = this.data.filter(
      (item) => item.skillId !== resolvedSkillId || item.version === keepVersion
    );
    this.syncSkillGroup(resolvedSkillId, keepVersion);
    await save(this.data);
  };
}
