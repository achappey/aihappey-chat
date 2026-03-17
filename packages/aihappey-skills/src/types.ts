export type SkillStorageKind = "indexeddb";

export type SkillImportSource = "local-zip" | "remote-archive";

export type SkillSeverity = "error" | "warning" | "info";

export interface SkillDiagnostic {
  severity: SkillSeverity;
  code:
    | "archive-empty"
    | "skill-missing-frontmatter"
    | "skill-invalid-frontmatter"
    | "skill-missing-name"
    | "skill-missing-description"
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
  name: string;
  description: string;
  license?: string;
  compatibility?: string;
  metadata?: Record<string, string>;
  allowedTools?: string;
}

export interface StoredSkill {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
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
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  source: SkillImportSource;
  rootPath: string;
  entryPath: string;
  fileCount: number;
  diagnostics: SkillDiagnostic[];
}

export interface ParsedSkill {
  name: string;
  description: string;
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
