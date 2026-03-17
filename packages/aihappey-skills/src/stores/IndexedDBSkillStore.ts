import { get, set } from "idb-keyval";
import { combineImportResult, extractSkillsFromArchive, toStoredSkill } from "../importSkillsFromZip";
import { exportSkillToArchive } from "../exportSkillToArchive";
import type {
  SkillArchiveExport,
  SkillCatalogItem,
  SkillImportResult,
  SkillImportSource,
  SkillStore,
  StoredSkill,
} from "../types";

const DB_KEY = "aihappey_skills_v1";

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
    id: skill.id,
    name: skill.name,
    description: skill.description,
    createdAt: skill.createdAt,
    updatedAt: skill.updatedAt,
    source: skill.source,
    rootPath: skill.rootPath,
    entryPath: skill.entryPath,
    fileCount: skill.files.length,
    diagnostics: skill.diagnostics,
  };
}

export class IndexedDBSkillStore implements SkillStore {
  readonly kind = "indexeddb" as const;
  private data: StoredSkill[] = [];
  private loaded = false;

  private ensureLoaded = async () => {
    if (!this.loaded) {
      this.data = await load();
      this.loaded = true;
    }
  };

  list = async (): Promise<SkillCatalogItem[]> => {
    await this.ensureLoaded();
    return this.data
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(toCatalogItem);
  };

  read = async (id: string): Promise<StoredSkill | undefined> => {
    await this.ensureLoaded();
    return this.data.find((item) => item.id === id);
  };

  readByName = async (name: string): Promise<StoredSkill | undefined> => {
    await this.ensureLoaded();
    return this.data.find((item) => item.name === name);
  };

  exportArchive = async (id: string): Promise<SkillArchiveExport | undefined> => {
    await this.ensureLoaded();
    const skill = this.data.find((item) => item.id === id);
    if (!skill) return undefined;
    return exportSkillToArchive(skill);
  };

  importArchive = async (
    file: Blob,
    source: SkillImportSource = "local-zip"
  ): Promise<SkillImportResult> => {
    await this.ensureLoaded();
    const { parsedSkills, diagnostics } = await extractSkillsFromArchive(file);
    const imported: StoredSkill[] = [];

    for (const parsed of parsedSkills) {
      const previous = this.data.find((item) => item.name === parsed.name);
      const stored = toStoredSkill(parsed, source, previous);
      if (!stored) continue;

      this.data = previous
        ? this.data.map((item) => (item.name === stored.name ? stored : item))
        : [stored, ...this.data];
      imported.push(stored);
    }

    await save(this.data);
    return combineImportResult(parsedSkills, imported, diagnostics);
  };

  delete = async (id: string): Promise<void> => {
    await this.ensureLoaded();
    this.data = this.data.filter((item) => item.id !== id);
    await save(this.data);
  };
}
