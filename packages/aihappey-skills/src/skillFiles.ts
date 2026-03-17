import type { StoredSkill, StoredSkillFile } from "./types";

const TEXT_FILE_EXTENSIONS = new Set([
  "md",
  "mdx",
  "txt",
  "json",
  "jsonl",
  "yaml",
  "yml",
  "xml",
  "svg",
  "csv",
  "ts",
  "tsx",
  "js",
  "jsx",
  "mjs",
  "cjs",
  "py",
  "sh",
  "bash",
  "zsh",
  "ps1",
  "cmd",
  "bat",
  "html",
  "css",
  "scss",
  "less",
  "sql",
  "toml",
  "ini",
  "conf",
  "cfg",
  "log",
  "gitignore",
  "dockerfile",
  "env",
  "rb",
  "go",
  "rs",
  "java",
  "kt",
]);

const MIME_BY_EXTENSION: Record<string, string> = {
  md: "text/markdown",
  mdx: "text/markdown",
  txt: "text/plain",
  json: "application/json",
  jsonl: "application/jsonl",
  yaml: "application/yaml",
  yml: "application/yaml",
  xml: "application/xml",
  svg: "image/svg+xml",
  csv: "text/csv",
  ts: "text/plain",
  tsx: "text/plain",
  js: "text/plain",
  jsx: "text/plain",
  mjs: "text/plain",
  cjs: "text/plain",
  py: "text/x-python",
  sh: "text/x-shellscript",
  bash: "text/x-shellscript",
  zsh: "text/x-shellscript",
  ps1: "text/plain",
  cmd: "text/plain",
  bat: "text/plain",
  html: "text/html",
  css: "text/css",
  scss: "text/plain",
  less: "text/plain",
  sql: "text/plain",
  toml: "text/plain",
  ini: "text/plain",
  conf: "text/plain",
  cfg: "text/plain",
  log: "text/plain",
};

function getExtension(path: string) {
  const normalized = path.split("/").pop() ?? path;
  const idx = normalized.lastIndexOf(".");
  return idx === -1 ? normalized.toLowerCase() : normalized.slice(idx + 1).toLowerCase();
}

export function normalizeSkillRelativePath(path: string) {
  const normalized = String(path ?? "")
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/^\//, "")
    .replace(/\/+/g, "/")
    .trim();

  if (!normalized) return "";

  const resolved: string[] = [];
  for (const segment of normalized.split("/")) {
    if (!segment || segment === ".") continue;
    if (segment === "..") return "";
    resolved.push(segment);
  }

  return resolved.join("/");
}

export function listSkillResourcePaths(skill: Pick<StoredSkill, "files">) {
  return (skill.files ?? [])
    .map((file) => normalizeSkillRelativePath(file.path))
    .filter((path) => !!path && path !== "SKILL.md")
    .sort((a, b) => a.localeCompare(b));
}

export function getStoredSkillFile(
  skill: Pick<StoredSkill, "files">,
  relativePath: string
): StoredSkillFile | undefined {
  const normalized = normalizeSkillRelativePath(relativePath);
  if (!normalized) return undefined;
  return (skill.files ?? []).find(
    (file) => normalizeSkillRelativePath(file.path) === normalized
  );
}

export function getStoredSkillFileMimeType(
  file: Pick<StoredSkillFile, "path" | "data">
) {
  if (file.data?.type) return file.data.type;
  return MIME_BY_EXTENSION[getExtension(file.path)] ?? "application/octet-stream";
}

export function isTextSkillFile(file: Pick<StoredSkillFile, "path" | "data">) {
  const mimeType = getStoredSkillFileMimeType(file);
  if (
    mimeType.startsWith("text/") ||
    mimeType === "application/json" ||
    mimeType === "application/xml" ||
    mimeType === "application/yaml" ||
    mimeType === "image/svg+xml"
  ) {
    return true;
  }

  return TEXT_FILE_EXTENSIONS.has(getExtension(file.path));
}
