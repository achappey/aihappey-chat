import { get, set } from "idb-keyval";
import { combineImportResult, extractSkillsFromArchive, toStoredSkill } from "../importSkillsFromZip";
import { exportSkillToArchive } from "../exportSkillToArchive";
import {
  normalizeSkillWriteDefinition,
  renderSkillMarkdown,
  validateSkillRelativePath,
} from "../skillFrontmatter";
import type {
  DataList,
  SkillArchiveExport,
  SkillCatalogItem,
  SkillDraftDefinition,
  Skill,
  SkillFileWriteDefinition,
  SkillImportResult,
  SkillImportOptions,
  SkillInspectionResult,
  SkillImportSource,
  SkillListParams,
  SkillManifestUpdateDefinition,
  SkillStore,
  SkillUpdateParams,
  SkillVersion,
  SkillWriteDefinition,
  StoredSkill,
  StoredSkillFile,
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

function incrementVersion(value: string | undefined) {
  const normalized = normalizeVersion(value, "1");
  if (POSITIVE_INTEGER_RE.test(normalized)) return String(Number.parseInt(normalized, 10) + 1);
  return `${normalized}-next`;
}

function cloneBlob(blob: Blob) {
  return blob.slice(0, blob.size, blob.type || "application/octet-stream");
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

function manifestBlob(markdown: string) {
  return new Blob([markdown], { type: "text/markdown" });
}

function upsertStoredFile(files: StoredSkillFile[], file: StoredSkillFile) {
  const normalized = validateSkillRelativePath(file.path, { allowManifest: true });
  return [
    { ...file, path: normalized },
    ...files.filter((item) => validateSkillRelativePath(item.path, { allowManifest: true }) !== normalized),
  ];
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

  createSkill = async (definition: SkillWriteDefinition): Promise<StoredSkill> => {
    await this.ensureLoaded();
    const normalized = normalizeSkillWriteDefinition(definition);
    const existing = this.data.find((item) => item.name === normalized.name || item.skillId === normalized.skillId);
    if (existing) throw new Error(`Skill '${normalized.name}' already exists.`);

    const now = Date.now();
    const skillId = normalized.skillId || buildSkillId(normalized.name);
    const version = "1";
    const markdown = renderSkillMarkdown({
      ...normalized,
      skillId,
      version,
      defaultVersion: version,
      latestVersion: version,
    });
    const parsed = normalizeSkillWriteDefinition(normalized);
    const manifest = manifestBlob(markdown);
    const stored: StoredSkill = {
      id: crypto.randomUUID(),
      skillId,
      name: parsed.name,
      description: parsed.description,
      createdAt: now,
      updatedAt: now,
      origin: "local",
      object: "skill",
      version,
      defaultVersion: version,
      latestVersion: version,
      source: "local-zip",
      rootPath: parsed.name,
      entryPath: `${parsed.name}/SKILL.md`,
      files: [{ path: "SKILL.md", data: manifest, size: manifest.size }],
      frontmatter: {
        id: skillId,
        name: parsed.name,
        description: parsed.description,
        version,
        defaultVersion: version,
        latestVersion: version,
        license: parsed.license,
        compatibility: parsed.compatibility,
        metadata: parsed.metadata,
        allowedTools: parsed.allowedTools,
      },
      body: parsed.instructions ?? "",
      diagnostics: [],
    };

    this.data = [stored, ...this.data];
    this.syncSkillGroup(skillId, version);
    await save(this.data);
    return (await this.readVersion(skillId, version)) ?? stored;
  };

  saveSkillDraft = async (
    skillId: string | undefined,
    definition: SkillDraftDefinition
  ): Promise<StoredSkill> => {
    await this.ensureLoaded();

    const current = skillId ? await this.read(skillId) : undefined;
    if (skillId && !current) throw new Error(`Skill ${skillId} was not found locally.`);

    const normalized = normalizeSkillWriteDefinition({
      name: current?.name ?? definition.name ?? "",
      description: definition.description,
      instructions: definition.instructions,
      skillId: current?.skillId,
      license: current?.frontmatter.license,
      compatibility: current?.frontmatter.compatibility,
      metadata: current?.frontmatter.metadata,
      allowedTools: current?.frontmatter.allowedTools,
    });

    if (!current) {
      const existing = this.data.find(
        (item) => item.name === normalized.name || item.skillId === normalized.skillId
      );
      if (existing) throw new Error(`Skill '${normalized.name}' already exists.`);
    }

    const seenPaths = new Set<string>();
    const resourceFiles: StoredSkillFile[] = definition.files.map((file) => {
      const path = validateSkillRelativePath(file.relativePath);
      const pathKey = path.toLowerCase();
      if (seenPaths.has(pathKey)) throw new Error(`Duplicate skill file path '${path}'.`);
      seenPaths.add(pathKey);
      const data = cloneBlob(file.data);
      return { path, data, size: data.size };
    });

    const resolvedSkillId = current?.skillId || normalized.skillId || buildSkillId(normalized.name);
    const version = current ? incrementVersion(current.latestVersion) : "1";
    if (this.getSkillGroup(resolvedSkillId).some((item) => item.version === version)) {
      throw new Error(`Could not create version '${version}' because it already exists.`);
    }

    const markdown = renderSkillMarkdown({
      ...normalized,
      skillId: resolvedSkillId,
      version,
      defaultVersion: version,
      latestVersion: version,
    });
    const manifest = manifestBlob(markdown);
    const now = Date.now();
    const nextStored: StoredSkill = {
      id: crypto.randomUUID(),
      skillId: resolvedSkillId,
      name: normalized.name,
      description: normalized.description,
      createdAt: now,
      updatedAt: now,
      origin: "local",
      object: "skill",
      version,
      defaultVersion: version,
      latestVersion: version,
      remoteCreatedAt: current?.remoteCreatedAt,
      source: current?.source ?? "local-zip",
      rootPath: current?.rootPath ?? normalized.name,
      entryPath: current?.entryPath ?? `${normalized.name}/SKILL.md`,
      files: [{ path: "SKILL.md", data: manifest, size: manifest.size }, ...resourceFiles],
      frontmatter: {
        id: resolvedSkillId,
        name: normalized.name,
        description: normalized.description,
        version,
        defaultVersion: version,
        latestVersion: version,
        license: normalized.license,
        compatibility: normalized.compatibility,
        metadata: normalized.metadata,
        allowedTools: normalized.allowedTools,
      },
      body: normalized.instructions ?? "",
      diagnostics: [],
    };

    // Commit the complete version in one IndexedDB write and roll back the in-memory
    // catalog if persistence fails.
    const previousData = this.data;
    try {
      this.data = [nextStored, ...this.data];
      this.syncSkillGroup(resolvedSkillId, version);
      await save(this.data);
    } catch (error) {
      this.data = previousData;
      throw error;
    }

    return (await this.readVersion(resolvedSkillId, version)) ?? nextStored;
  };

  inspectSkill = async (skillId: string, version?: string): Promise<SkillInspectionResult> => {
    await this.ensureLoaded();
    const skill = version ? await this.readVersion(skillId, version) : await this.read(skillId);
    if (!skill) throw new Error(`Skill ${skillId} was not found locally.`);
    const diagnostics = skill.diagnostics ?? [];
    return {
      skill,
      files: skill.files.map((file) => file.path).sort((a, b) => a.localeCompare(b)),
      diagnostics,
      warnings: diagnostics.filter((item) => item.severity === "warning"),
      errors: diagnostics.filter((item) => item.severity === "error"),
    };
  };

  updateSkillManifest = async (
    skillId: string,
    definition: SkillManifestUpdateDefinition
  ): Promise<StoredSkill> => {
    await this.ensureLoaded();
    const current = await this.read(skillId);
    if (!current) throw new Error(`Skill ${skillId} was not found locally.`);

    const nextVersion = incrementVersion(current.latestVersion);
    const latestGroup = this.getSkillGroup(current.skillId);
    if (latestGroup.some((item) => item.version === nextVersion)) {
      throw new Error(`Could not create version '${nextVersion}' because it already exists.`);
    }

    const nextFrontmatter = {
      ...current.frontmatter,
      description: definition.description === undefined
        ? current.frontmatter.description
        : String(definition.description ?? "").trim(),
      license: definition.license === undefined ? current.frontmatter.license : definition.license ?? undefined,
      compatibility: definition.compatibility === undefined
        ? current.frontmatter.compatibility
        : definition.compatibility ?? undefined,
      metadata: definition.metadata === undefined ? current.frontmatter.metadata : definition.metadata ?? undefined,
      allowedTools: definition.allowedTools === undefined
        ? current.frontmatter.allowedTools
        : definition.allowedTools ?? undefined,
    };
    const body = definition.instructions === undefined ? current.body : String(definition.instructions ?? "").trim();
    const markdown = renderSkillMarkdown({
      name: current.frontmatter.name,
      description: nextFrontmatter.description,
      instructions: body,
      license: nextFrontmatter.license,
      compatibility: nextFrontmatter.compatibility,
      metadata: nextFrontmatter.metadata,
      allowedTools: nextFrontmatter.allowedTools,
      skillId: current.skillId,
      version: nextVersion,
      defaultVersion: nextVersion,
      latestVersion: nextVersion,
    });
    const manifest = manifestBlob(markdown);
    const now = Date.now();
    const nextStored: StoredSkill = {
      ...current,
      id: crypto.randomUUID(),
      description: nextFrontmatter.description,
      createdAt: now,
      updatedAt: now,
      version: nextVersion,
      defaultVersion: nextVersion,
      latestVersion: nextVersion,
      files: upsertStoredFile(current.files, { path: "SKILL.md", data: manifest, size: manifest.size }),
      frontmatter: {
        ...nextFrontmatter,
        id: current.skillId,
        version: nextVersion,
        defaultVersion: nextVersion,
        latestVersion: nextVersion,
      },
      body,
      diagnostics: [],
    };

    this.data = [nextStored, ...this.data];
    this.syncSkillGroup(current.skillId, nextVersion);
    await save(this.data);
    return (await this.readVersion(current.skillId, nextVersion)) ?? nextStored;
  };

  upsertSkillFile = async (skillId: string, file: SkillFileWriteDefinition): Promise<StoredSkill> => {
    await this.ensureLoaded();
    const current = await this.read(skillId);
    if (!current) throw new Error(`Skill ${skillId} was not found locally.`);
    const relativePath = validateSkillRelativePath(file.relativePath);
    const data = cloneBlob(file.data);
    const now = Date.now();
    const files = upsertStoredFile(current.files, { path: relativePath, data, size: data.size });
    this.data = this.data.map((item) => {
      if (item.skillId !== current.skillId || item.version !== current.version) return item;
      return { ...item, updatedAt: now, files };
    });
    await save(this.data);
    return (await this.readVersion(current.skillId, current.version)) ?? { ...current, files };
  };

  deleteSkillFile = async (skillId: string, relativePathInput: string): Promise<StoredSkill> => {
    await this.ensureLoaded();
    const current = await this.read(skillId);
    if (!current) throw new Error(`Skill ${skillId} was not found locally.`);
    const relativePath = validateSkillRelativePath(relativePathInput);
    const now = Date.now();
    const files = current.files.filter(
      (file) => validateSkillRelativePath(file.path, { allowManifest: true }) !== relativePath
    );
    this.data = this.data.map((item) => {
      if (item.skillId !== current.skillId || item.version !== current.version) return item;
      return { ...item, updatedAt: now, files };
    });
    await save(this.data);
    return (await this.readVersion(current.skillId, current.version)) ?? { ...current, files };
  };

  restoreSkillVersion = async (skillId: string, version: string): Promise<StoredSkill> => {
    await this.ensureLoaded();
    const target = await this.readVersion(skillId, version);
    if (!target) throw new Error(`Skill ${skillId} version ${version} was not found locally.`);
    const nextVersion = incrementVersion(target.latestVersion);
    const now = Date.now();
    const markdown = renderSkillMarkdown({
      name: target.frontmatter.name,
      description: target.frontmatter.description,
      instructions: target.body,
      license: target.frontmatter.license,
      compatibility: target.frontmatter.compatibility,
      metadata: target.frontmatter.metadata,
      allowedTools: target.frontmatter.allowedTools,
      skillId: target.skillId,
      version: nextVersion,
      defaultVersion: nextVersion,
      latestVersion: nextVersion,
    });
    const manifest = manifestBlob(markdown);
    const restored: StoredSkill = {
      ...target,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      version: nextVersion,
      defaultVersion: nextVersion,
      latestVersion: nextVersion,
      files: upsertStoredFile(target.files.map((file) => ({ ...file, data: cloneBlob(file.data) })), {
        path: "SKILL.md",
        data: manifest,
        size: manifest.size,
      }),
      frontmatter: {
        ...target.frontmatter,
        id: target.skillId,
        version: nextVersion,
        defaultVersion: nextVersion,
        latestVersion: nextVersion,
      },
    };
    this.data = [restored, ...this.data];
    this.syncSkillGroup(target.skillId, nextVersion);
    await save(this.data);
    return (await this.readVersion(target.skillId, nextVersion)) ?? restored;
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
