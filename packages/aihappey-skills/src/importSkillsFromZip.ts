import JSZip from "jszip";
import { parseSkillMarkdown } from "./skillFrontmatter";
import type {
  ParsedSkill,
  SkillDiagnostic,
  SkillImportResult,
  SkillImportSource,
  StoredSkill,
  StoredSkillFile,
} from "./types";

const POSITIVE_INTEGER_RE = /^[1-9]\d*$/;

function normalizeVersion(value: string | undefined, fallback: string) {
  const text = String(value ?? "").trim();
  return POSITIVE_INTEGER_RE.test(text) ? text : fallback;
}

function incrementVersion(value: string | undefined) {
  const normalized = normalizeVersion(value, "0");
  return String(Number.parseInt(normalized, 10) + 1);
}

function buildSkillId(name: string) {
  const slug = String(name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "skill";
  return `skill_${slug}`;
}

function normalizePath(path: string) {
  return path.replace(/\\/g, "/").replace(/^\.?\//, "").replace(/\/+/g, "/");
}

function dirname(path: string) {
  const normalized = normalizePath(path).replace(/\/$/, "");
  const idx = normalized.lastIndexOf("/");
  return idx === -1 ? "" : normalized.slice(0, idx);
}

function basename(path: string) {
  const normalized = normalizePath(path).replace(/\/$/, "");
  const idx = normalized.lastIndexOf("/");
  return idx === -1 ? normalized : normalized.slice(idx + 1);
}

async function parseArchive(blob: Blob): Promise<ParsedSkill[]> {
  const zip = await JSZip.loadAsync(blob);
  const fileEntries = Object.values(zip.files).filter((entry) => !entry.dir);
  const diagnostics: SkillDiagnostic[] = [];

  const skillEntryPaths = fileEntries
    .map((entry) => normalizePath(entry.name))
    .filter((path) => basename(path) === "SKILL.md");

  if (skillEntryPaths.length === 0) {
    throw Object.assign(new Error("No skills found in archive."), {
      diagnostics: [
        {
          severity: "error",
          code: "archive-empty",
          message: "ZIP archive does not contain any SKILL.md files.",
        } satisfies SkillDiagnostic,
      ],
    });
  }

  const parsedSkills = await Promise.all(
    skillEntryPaths.map(async (entryPath) => {
      const rootPath = dirname(entryPath);
      const directoryName = basename(rootPath);
      const scopedFiles = fileEntries.filter((entry) => {
        const current = normalizePath(entry.name);
        return current === entryPath || current.startsWith(`${rootPath}/`);
      });

      const files: StoredSkillFile[] = [];
      for (const entry of scopedFiles) {
        const fullPath = normalizePath(entry.name);
        const relativePath = rootPath ? fullPath.slice(rootPath.length + 1) : fullPath;
        if (relativePath.startsWith("../") || relativePath.includes("/../")) {
          diagnostics.push({
            severity: "error",
            code: "skill-file-outside-root",
            message: `Ignoring suspicious path ${fullPath}.`,
            path: fullPath,
          });
          continue;
        }

        const data = await entry.async("blob");
        files.push({ path: relativePath, data, size: data.size });
      }

      const skillFile = files.find((file) => file.path === "SKILL.md");
      const text = skillFile ? await skillFile.data.text() : "";
      const parsed = parseSkillMarkdown(text, directoryName);

      return {
        id: parsed.frontmatter?.id,
        rootPath,
        entryPath,
        files,
        body: parsed.body,
        frontmatter: parsed.frontmatter,
        diagnostics: parsed.diagnostics,
        name: parsed.frontmatter?.name ?? directoryName,
        description: parsed.frontmatter?.description ?? "",
        version: parsed.frontmatter?.version,
        defaultVersion: parsed.frontmatter?.defaultVersion,
        latestVersion: parsed.frontmatter?.latestVersion,
      } satisfies ParsedSkill;
    })
  );

  return parsedSkills;
}

export async function extractSkillsFromArchive(blob: Blob): Promise<{
  parsedSkills: ParsedSkill[];
  diagnostics: SkillDiagnostic[];
}> {
  try {
    const parsedSkills = await parseArchive(blob);
    const diagnostics = parsedSkills.flatMap((skill) => skill.diagnostics);
    return { parsedSkills, diagnostics };
  } catch (error) {
    const diagnostics = (error as any)?.diagnostics as SkillDiagnostic[] | undefined;
    return { parsedSkills: [], diagnostics: diagnostics ?? [] };
  }
}

export function toStoredSkill(
  parsed: ParsedSkill,
  source: SkillImportSource,
  previous?: StoredSkill
): StoredSkill | undefined {
  const hasErrors = parsed.diagnostics.some((item) => item.severity === "error");
  if (hasErrors || !parsed.frontmatter) return undefined;

  const now = Date.now();
  const skillId =
    parsed.frontmatter.id?.trim() || previous?.skillId?.trim() || buildSkillId(parsed.frontmatter.name);
  const version =
    parsed.frontmatter.version?.trim() ||
    (source === "local-zip" && previous ? incrementVersion(previous.latestVersion) : undefined) ||
    previous?.latestVersion ||
    "1";
  const normalizedVersion = normalizeVersion(version, "1");
  const defaultVersion = normalizeVersion(
    parsed.frontmatter.defaultVersion?.trim() || normalizedVersion,
    normalizedVersion
  );
  const latestVersion = normalizeVersion(
    parsed.frontmatter.latestVersion?.trim() || normalizedVersion,
    normalizedVersion
  );

  return {
    id: previous?.id ?? crypto.randomUUID(),
    skillId,
    name: parsed.frontmatter.name,
    description: parsed.frontmatter.description,
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
    origin: "local",
    object: "skill",
    version: normalizedVersion,
    defaultVersion,
    latestVersion,
    remoteCreatedAt: previous?.remoteCreatedAt,
    source,
    rootPath: parsed.rootPath,
    entryPath: parsed.entryPath,
    files: parsed.files,
    frontmatter: {
      ...parsed.frontmatter,
      id: skillId,
      version: normalizedVersion,
      defaultVersion,
      latestVersion,
    },
    body: parsed.body,
    diagnostics: parsed.diagnostics,
  };
}

export function combineImportResult(
  parsedSkills: ParsedSkill[],
  imported: StoredSkill[],
  diagnostics: SkillDiagnostic[]
): SkillImportResult {
  return {
    imported,
    diagnostics: [
      ...diagnostics,
      ...parsedSkills
        .filter((skill) => skill.diagnostics.some((item) => item.severity === "error"))
        .flatMap((skill) => skill.diagnostics),
    ],
  };
}
