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

export interface RemoteSkill {
  id: string;
  created_at: number;
  default_version: string;
  description: string;
  latest_version: string;
  name: string;
  object: "skill";
}

export interface RemoteSkillList {
  data: RemoteSkill[];
  first_id?: string;
  has_more: boolean;
  last_id?: string;
  object: "list";
}

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

export interface SkillArchiveExport {
  filename: string;
  blob: Blob;
}

export interface SkillStore {
  readonly kind: SkillStorageKind;
  list(): Promise<SkillCatalogItem[]>;
  read(id: string): Promise<StoredSkill | undefined>;
  readByName(name: string): Promise<StoredSkill | undefined>;
  exportArchive(id: string): Promise<SkillArchiveExport | undefined>;
  importArchive(file: Blob, source?: SkillImportSource): Promise<SkillImportResult>;
  delete(id: string): Promise<void>;
}
