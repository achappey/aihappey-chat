import JSZip from "jszip";
import { parseSkillMarkdown } from "aihappey-skills";
import { PLUGIN_MCP_SCHEMA_URL, PLUGIN_SCHEMA_URL } from "./constants";
import type {
  PluginArchiveExport,
  PluginDiagnostic,
  PluginDraft,
  PluginImportResult,
  PluginMcpConfiguration,
  StoredPlugin,
  StoredPluginFile,
  StoredPluginSkill,
} from "./types";
import { validateMcpConfiguration, validatePluginManifest } from "./validation";

const ROOT_FILES = new Set(["plugin.json", "mcp.json"]);

export function normalizePluginFilePath(value: unknown) {
  const path = String(value ?? "").replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/+/g, "/");
  if (!path || path.startsWith("/") || path.includes("\0")) throw new Error("Plugin file path is invalid.");
  const parts = path.split("/");
  if (parts.some((part) => !part || part === "." || part === "..")) throw new Error(`Plugin file '${path}' escapes or ambiguously addresses the plugin root.`);
  return path;
}

function pluginDiagnostic(
  severity: PluginDiagnostic["severity"],
  boundary: PluginDiagnostic["boundary"],
  code: string,
  message: string,
  path?: string
): PluginDiagnostic {
  return { severity, boundary, code, message, ...(path ? { path } : {}) };
}

function mediaTypeForPath(path: string) {
  const lower = path.toLowerCase();
  if (lower.endsWith(".json")) return "application/json";
  if (lower.endsWith(".md")) return "text/markdown";
  if (lower.endsWith(".txt")) return "text/plain";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

export function inspectPluginSkills(files: StoredPluginFile[]) {
  const diagnostics: PluginDiagnostic[] = [];
  const skills: StoredPluginSkill[] = [];
  const manifestFiles = files.filter((file) => /^skills\/[^/]+\/SKILL\.md$/.test(file.path));

  return Promise.all(manifestFiles.map(async (file) => {
    const directory = file.path.split("/")[1];
    const parsed = parseSkillMarkdown(await file.data.text(), directory);
    const skillDiagnostics = parsed.diagnostics.map((item): PluginDiagnostic => ({
      severity: item.severity,
      boundary: "skill",
      code: item.code,
      message: item.message,
      path: file.path,
      entry: directory,
    }));
    diagnostics.push(...skillDiagnostics);
    const valid = !skillDiagnostics.some((item) => item.severity === "error");
    skills.push({
      name: parsed.frontmatter?.name || directory,
      description: parsed.frontmatter?.description || "",
      directory,
      entryPath: file.path,
      fileCount: files.filter((candidate) => candidate.path.startsWith(`skills/${directory}/`)).length,
      valid,
    });
  })).then(() => ({
    skills: skills.sort((a, b) => a.name.localeCompare(b.name)),
    diagnostics,
  }));
}

function isSymlink(entry: JSZip.JSZipObject) {
  const permissions = typeof entry.unixPermissions === "number" ? entry.unixPermissions : 0;
  return (permissions & 0o170000) === 0o120000;
}

function chooseRoots(entries: JSZip.JSZipObject[]) {
  if (entries.some((entry) => !entry.dir && entry.name === "plugin.json")) return [""];
  return Array.from(new Set(entries
    .filter((entry) => !entry.dir && /(^|\/)plugin\.json$/.test(entry.name))
    .map((entry) => entry.name.slice(0, -"plugin.json".length))))
    .sort((a, b) => a.localeCompare(b));
}

async function parsePluginRoot(entries: JSZip.JSZipObject[], root: string): Promise<PluginImportResult> {
  const diagnostics: PluginDiagnostic[] = [];
  const packageEntries = entries.filter((entry) => !entry.dir && entry.name.startsWith(root));
  const fileEntries = new Map<string, JSZip.JSZipObject>();
  for (const entry of packageEntries) {
    const originalName = (entry as JSZip.JSZipObject & { unsafeOriginalName?: string }).unsafeOriginalName ?? entry.name;
    if (isSymlink(entry) || originalName.includes("\\") || originalName.startsWith("/") || originalName.split("/").includes("..")) {
      diagnostics.push(pluginDiagnostic("error", "plugin", "archive-unsafe-path", `Unsafe package entry '${originalName}' was rejected.`, originalName));
      continue;
    }
    try {
      const path = normalizePluginFilePath(entry.name.slice(root.length));
      fileEntries.set(path, entry);
    } catch (error) {
      diagnostics.push(pluginDiagnostic("error", "plugin", "archive-unsafe-path", error instanceof Error ? error.message : "Unsafe package path.", originalName));
    }
  }
  if (diagnostics.some((item) => item.severity === "error" && item.boundary === "plugin")) return { imported: [], diagnostics };

  const manifestEntry = fileEntries.get("plugin.json");
  if (!manifestEntry) return { imported: [], diagnostics: [...diagnostics, pluginDiagnostic("error", "manifest", "manifest-missing", "plugin.json is required.", `${root}plugin.json`)] };

  let rawManifest: unknown;
  try {
    rawManifest = JSON.parse(await manifestEntry.async("text"));
  } catch {
    return { imported: [], diagnostics: [...diagnostics, pluginDiagnostic("error", "manifest", "manifest-invalid-json", "plugin.json is not valid JSON.", `${root}plugin.json`)] };
  }
  const manifestResult = validatePluginManifest(rawManifest);
  diagnostics.push(...manifestResult.diagnostics);
  if (!manifestResult.value) return { imported: [], diagnostics };

  let mcp: PluginMcpConfiguration | undefined;
  const mcpEntry = fileEntries.get("mcp.json");
  if (mcpEntry) {
    try {
      const mcpResult = validateMcpConfiguration(JSON.parse(await mcpEntry.async("text")), manifestResult.value.$schema);
      diagnostics.push(...mcpResult.diagnostics);
      mcp = mcpResult.value;
    } catch {
      diagnostics.push(pluginDiagnostic("error", "mcp", "mcp-invalid-json", "mcp.json is not valid JSON; MCP is disabled for this plugin.", "mcp.json"));
    }
  }

  const files: StoredPluginFile[] = [];
  for (const [path, entry] of Array.from(fileEntries.entries()).sort(([a], [b]) => a.localeCompare(b))) {
    if (ROOT_FILES.has(path)) continue;
    const data = await entry.async("blob");
    files.push({ path, data, size: data.size, mediaType: mediaTypeForPath(path) });
  }
  const skillInspection = await inspectPluginSkills(files);
  diagnostics.push(...skillInspection.diagnostics);

  const now = Date.now();
  return {
    diagnostics,
    imported: [{
      id: manifestResult.value.name,
      name: manifestResult.value.name,
      createdAt: now,
      updatedAt: now,
      manifest: manifestResult.value,
      ...(mcp ? { mcp } : {}),
      files,
      skills: skillInspection.skills,
      diagnostics,
    }],
  };
}

export async function parsePluginArchive(blob: Blob): Promise<PluginImportResult> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(blob);
  } catch {
    return { imported: [], diagnostics: [pluginDiagnostic("error", "plugin", "archive-invalid", "The selected file is not a readable ZIP archive.")] };
  }
  const entries = Object.values(zip.files);
  const roots = chooseRoots(entries);
  if (!roots.length) {
    return { imported: [], diagnostics: [pluginDiagnostic("error", "manifest", "manifest-missing", "The ZIP does not contain a plugin.json.", "plugin.json")] };
  }
  const results = await Promise.all(roots.map((root) => parsePluginRoot(entries, root)));
  return {
    imported: results.flatMap((result) => result.imported),
    diagnostics: results.flatMap((result) => result.diagnostics),
  };
}

export async function createStoredPlugin(
  draft: PluginDraft,
  existing?: Pick<StoredPlugin, "id" | "name" | "createdAt">
): Promise<StoredPlugin> {
  const manifestResult = validatePluginManifest(draft.manifest);
  if (!manifestResult.value) throw new Error(manifestResult.diagnostics[0]?.message ?? "Invalid plugin manifest.");
  if (existing && manifestResult.value.name !== existing.name) throw new Error("Plugin names cannot be changed after creation.");

  const seen = new Set<string>();
  const files = draft.files.map((file) => {
    const path = normalizePluginFilePath(file.path);
    if (ROOT_FILES.has(path)) throw new Error(`${path} is generated from the editor and cannot be supplied as a package file.`);
    const key = path.toLowerCase();
    if (seen.has(key)) throw new Error(`Duplicate plugin file '${path}'.`);
    seen.add(key);
    return { ...file, path, size: file.data.size, mediaType: file.mediaType || mediaTypeForPath(path) };
  });

  const mcpResult = draft.mcpServers
    ? validateMcpConfiguration({ $schema: PLUGIN_MCP_SCHEMA_URL, mcpServers: draft.mcpServers })
    : { value: undefined, diagnostics: [] };
  const skillInspection = await inspectPluginSkills(files);
  const diagnostics = [...manifestResult.diagnostics, ...mcpResult.diagnostics, ...skillInspection.diagnostics];
  const now = Date.now();
  return {
    id: existing?.id ?? manifestResult.value.name,
    name: manifestResult.value.name,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    manifest: manifestResult.value,
    ...(mcpResult.value ? { mcp: mcpResult.value } : {}),
    files,
    skills: skillInspection.skills,
    diagnostics,
  };
}

export async function exportPluginArchive(plugin: StoredPlugin): Promise<PluginArchiveExport> {
  const zip = new JSZip();
  const date = new Date("1980-01-01T00:00:00.000Z");
  zip.file("plugin.json", `${JSON.stringify(plugin.manifest, null, 2)}\n`, { date });
  if (plugin.mcp) zip.file("mcp.json", `${JSON.stringify(plugin.mcp, null, 2)}\n`, { date });
  for (const file of plugin.files.slice().sort((a, b) => a.path.localeCompare(b.path))) {
    zip.file(normalizePluginFilePath(file.path), file.data, { date });
  }
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 }, platform: "UNIX" });
  return { filename: `${plugin.name}.zip`, blob };
}

export function minimalPluginDraft(name: string): PluginDraft {
  return { manifest: { $schema: PLUGIN_SCHEMA_URL, name }, files: [] };
}
