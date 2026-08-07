export type SkillStorageKind = "indexeddb";

export type SkillImportSource = "local-zip" | "remote-archive";

export type SkillOrigin = "local" | "remote";

export type SkillDownloadState = "remote" | "downloading" | "downloaded" | "error";

export type SkillSeverity = "error" | "warning" | "info";

export interface SkillDiagnostic {
  severity: SkillSeverity;
  code:
    | "archive-empty"
    | "skill-missing-frontmatter"
    | "skill-invalid-frontmatter"
    | "skill-missing-name"
    | "skill-missing-description"
    | "skill-missing-id"
    | "skill-invalid-id"
    | "skill-invalid-version"
    | "skill-name-mismatch"
    | "skill-invalid-name"
    | "skill-empty"
    | "skill-no-markdown-body"
    | "skill-file-outside-root";
  message: string;
  skillName?: string;
  path?: string;
}

export interface StoredSkillFile {
  path: string;
  data: Blob;
  size: number;
}

export interface SkillFrontmatter {
  id?: string;
  name: string;
  description: string;
  version?: string;
  defaultVersion?: string;
  latestVersion?: string;
  license?: string;
  compatibility?: string;
  metadata?: Record<string, string>;
  allowedTools?: string;
}

export interface Skill {
  id: string;
  created_at: number;
  default_version: string;
  description: string;
  latest_version: string;
  name: string;
  object: "skill";
}

export interface SkillVersion {
  id: string;
  created_at: number;
  description: string;
  name: string;
  object: "skill.version";
  skill_id: string;
  version: string;
}

export interface DataList<T> {
  data: T[];
  first_id?: string;
  has_more: boolean;
  last_id?: string;
  object: "list";
}

export interface SkillListParams {
  after?: string;
  limit?: number;
  order?: "asc" | "desc";
}

export interface VersionListParams {
  after?: string;
  limit?: number;
  order?: "asc" | "desc";
}

export interface SkillUpdateParams {
  default_version: string;
}

export interface ContentRetrieveParams {
  skill_id: string;
}

export type RemoteSkill = Skill;

export type RemoteSkillList = DataList<Skill>;

export interface StoredSkill {
  id: string;
  skillId: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  origin: Extract<SkillOrigin, "local">;
  object: "skill";
  version: string;
  defaultVersion: string;
  latestVersion: string;
  remoteCreatedAt?: number;
  source: SkillImportSource;
  rootPath: string;
  entryPath: string;
  files: StoredSkillFile[];
  frontmatter: SkillFrontmatter;
  body: string;
  diagnostics: SkillDiagnostic[];
}

export interface SkillCatalogItem {
  id: string;
  skillId: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  origin: SkillOrigin;
  object: "skill";
  version?: string;
  defaultVersion: string;
  latestVersion: string;
  remoteCreatedAt?: number;
  downloadState: SkillDownloadState;
  isDownloaded: boolean;
  source: SkillImportSource;
  rootPath: string;
  entryPath: string;
  fileCount: number;
  diagnostics: SkillDiagnostic[];
  versionCount: number;
  downloadedVersion?: string;
}

export interface ParsedSkill {
  id?: string;
  name: string;
  description: string;
  version?: string;
  defaultVersion?: string;
  latestVersion?: string;
  rootPath: string;
  entryPath: string;
  files: StoredSkillFile[];
  frontmatter?: SkillFrontmatter;
  body: string;
  diagnostics: SkillDiagnostic[];
}

export interface SkillImportResult {
  imported: StoredSkill[];
  diagnostics: SkillDiagnostic[];
}

export interface SkillImportOptions {
  skillId?: string;
  version?: string;
  defaultVersion?: string;
  latestVersion?: string;
}

export interface SkillWriteDefinition {
  name: string;
  description: string;
  instructions?: string;
  license?: string;
  compatibility?: string;
  metadata?: Record<string, string>;
  allowedTools?: string;
  skillId?: string;
}

export interface SkillManifestUpdateDefinition {
  description?: string;
  instructions?: string;
  license?: string | null;
  compatibility?: string | null;
  metadata?: Record<string, string> | null;
  allowedTools?: string | null;
}

export interface SkillFileWriteDefinition {
  relativePath: string;
  data: Blob;
}

/** Complete editable snapshot used to create a local skill or append a version. */
export interface SkillDraftDefinition {
  /** Required when creating. Existing skill names are immutable and this value is ignored when editing. */
  name?: string;
  description: string;
  instructions: string;
  /** The complete resulting resource set, excluding SKILL.md. */
  files: SkillFileWriteDefinition[];
}

export interface SkillInspectionResult {
  skill: StoredSkill;
  files: string[];
  diagnostics: SkillDiagnostic[];
  warnings: SkillDiagnostic[];
  errors: SkillDiagnostic[];
}

export interface SkillArchiveExport {
  filename: string;
  blob: Blob;
}

export interface SkillStore {
  readonly kind: SkillStorageKind;
  listCatalogItems(): Promise<SkillCatalogItem[]>;
  listSkills(query?: SkillListParams): Promise<DataList<Skill>>;
  retrieveSkill(skillId: string): Promise<Skill | undefined>;
  updateSkill(skillId: string, body: SkillUpdateParams): Promise<Skill>;
  listSkillVersions(skillId: string, query?: VersionListParams): Promise<DataList<SkillVersion>>;
  read(id: string): Promise<StoredSkill | undefined>;
  readByName(name: string): Promise<StoredSkill | undefined>;
  readVersion(skillId: string, version: string): Promise<StoredSkill | undefined>;
  exportArchive(id: string): Promise<SkillArchiveExport | undefined>;
  exportVersionArchive(skillId: string, version: string): Promise<SkillArchiveExport | undefined>;
  importArchive(
    file: Blob,
    source?: SkillImportSource,
    options?: SkillImportOptions
  ): Promise<SkillImportResult>;
  createSkill(definition: SkillWriteDefinition): Promise<StoredSkill>;
  saveSkillDraft(skillId: string | undefined, definition: SkillDraftDefinition): Promise<StoredSkill>;
  inspectSkill(skillId: string, version?: string): Promise<SkillInspectionResult>;
  updateSkillManifest(skillId: string, definition: SkillManifestUpdateDefinition): Promise<StoredSkill>;
  upsertSkillFile(skillId: string, file: SkillFileWriteDefinition): Promise<StoredSkill>;
  deleteSkillFile(skillId: string, relativePath: string): Promise<StoredSkill>;
  restoreSkillVersion(skillId: string, version: string): Promise<StoredSkill>;
  delete(id: string): Promise<void>;
  deleteVersion(skillId: string, version: string): Promise<void>;
  pruneVersions(skillId: string, keepVersion: string): Promise<void>;
}
