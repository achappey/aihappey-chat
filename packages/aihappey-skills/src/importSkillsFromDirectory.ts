import { parseSkillMarkdown } from "./skillFrontmatter";
import type { ParsedSkill, SkillDiagnostic, SkillFileWriteDefinition } from "./types";

// These limits apply to the new folder boundary, not legacy archive imports.
export const SKILL_DIRECTORY_LIMITS = { depth: 6, directories: 2000, entries: 10000, files: 512, bytes: 16 * 1024 * 1024, totalBytes: 64 * 1024 * 1024 } as const;
const ignored = new Set([".git", "node_modules"]);
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

/** Browser directory pickers provide files and logical relative paths, never filesystem access. */
export async function extractSkillsFromDirectory(input: readonly SkillFileWriteDefinition[]): Promise<{
  parsedSkills: ParsedSkill[]; diagnostics: SkillDiagnostic[];
}> {
  const diagnostics: SkillDiagnostic[] = [];
  const report = (code: SkillDiagnostic["code"], path?: string) => diagnostics.push({ severity: "error", code, path, message: code });
  const files = new Map<string, Blob>();
  const directories = new Set<string>();
  if (input.length > SKILL_DIRECTORY_LIMITS.entries) {
    report("folder-limit"); return { parsedSkills: [], diagnostics };
  }
  for (const file of input) {
    // Validate before normalizing: normalization must not hide traversal or absolute paths.
    const path = file.relativePath;
    const parts = path.split("/");
    if (!path || /[\\:\x00-\x1f\x7f]/.test(path) || /%2e|%2f|%5c/i.test(path)
      || parts.some(p => !p || p === "." || p === "..") || files.has(path)) {
      report("folder-invalid-path", path); return { parsedSkills: [], diagnostics };
    }
    if (parts.some(p => ignored.has(p))) continue;
    files.set(path, file.data);
    for (let i = 1; i < parts.length; i++) directories.add(parts.slice(0, i).join("/"));
    if (directories.size > SKILL_DIRECTORY_LIMITS.directories) {
      report("folder-limit"); return { parsedSkills: [], diagnostics };
    }
  }
  const manifests = [...files.keys()].filter(p => p === "SKILL.md" || p.endsWith("/SKILL.md")).sort(compare);
  const roots = manifests.map(p => p.slice(0, -"SKILL.md".length));
  const parsedSkills: ParsedSkill[] = [];
  const names = new Set<string>();
  let totalBytes = 0;
  for (const entryPath of manifests) {
    const prefix = entryPath.slice(0, -"SKILL.md".length);
    const rootPath = prefix.replace(/\/$/, "");
    if (rootPath.split("/").length > SKILL_DIRECTORY_LIMITS.depth + 1) {
      report("folder-limit", entryPath); continue;
    }
    if (roots.some(root => root !== prefix && (root.startsWith(prefix) || prefix.startsWith(root)))) {
      report("folder-overlap", entryPath); continue;
    }
    const scoped = [...files].filter(([path]) => path.startsWith(prefix)).sort(([a], [b]) => compare(a, b));
    const bytes = scoped.reduce((sum, [, blob]) => sum + blob.size, 0);
    if (scoped.length > SKILL_DIRECTORY_LIMITS.files || bytes > SKILL_DIRECTORY_LIMITS.bytes) {
      report("folder-limit", entryPath); continue;
    }
    totalBytes += bytes;
    if (totalBytes > SKILL_DIRECTORY_LIMITS.totalBytes) {
      report("folder-limit"); return { parsedSkills: [], diagnostics };
    }
    try {
      const parsed = parseSkillMarkdown(await files.get(entryPath)!.text(), rootPath.split("/").pop() ?? "");
      const name = parsed.frontmatter?.name ?? rootPath;
      diagnostics.push(...parsed.diagnostics.map(d => ({ ...d, path: d.path ?? entryPath })));
      if (!parsed.frontmatter || parsed.diagnostics.some(d => d.severity === "error")) continue;
      if (names.has(name)) { report("folder-duplicate-name", entryPath); continue; }
      names.add(name);
      parsedSkills.push({ ...parsed, name, description: parsed.frontmatter.description,
        id: parsed.frontmatter.id, version: parsed.frontmatter.version, defaultVersion: parsed.frontmatter.defaultVersion,
        latestVersion: parsed.frontmatter.latestVersion, rootPath, entryPath,
        files: scoped.map(([path, data]) => ({ path: path.slice(prefix.length), data, size: data.size })) });
    } catch { report("folder-read-failed", entryPath); }
  }
  if (manifests.length === 0) report("folder-empty");
  return { parsedSkills, diagnostics };
}
