import JSZip from "jszip";
import { parseDocument } from "yaml";
import { getMcpSkill, validateMcpSkillEntry, type ConnectedMcpSkill, type McpSkillEntry } from "aihappey-mcp";
import { mcpRuntime, store } from "aihappey-state";
import { readResource } from "../../runtime/mcp/readResource";

export function connectedMcpSkills(catalog: Record<string, ConnectedMcpSkill[]>): ConnectedMcpSkill[] {
  if (store.getState().enableMcpSkills === false) return [];
  return Object.values(catalog).flat().filter((skill) => mcpRuntime.has(skill.serverKey));
}

/** Display-only label. Identity remains the server key + full URI (skillId). */
export function connectedSkillLabel(skill: ConnectedMcpSkill, skills: ConnectedMcpSkill[]): string {
  const name = skill.entry.frontmatter.name;
  const duplicates = skills.filter((item) => item.serverKey === skill.serverKey && item.entry.frontmatter.name === name);
  const path = duplicates.length > 1 ? ` · ${skill.entry.uri.slice(0, -"/SKILL.md".length)}` : "";
  return `${name} (${skill.serverKey}${path})`;
}

/** Preserve readable tags for previously selected MCP skills while their server is disconnected. */
export function disconnectedSkillLabel(skillId: string): string {
  if (!skillId.startsWith("mcp:")) return skillId;
  try {
    const separator = skillId.indexOf(":", 4);
    if (separator < 0) return skillId;
    const server = decodeURIComponent(skillId.slice(4, separator));
    const uri = decodeURIComponent(skillId.slice(separator + 1));
    const name = uri.endsWith("/SKILL.md") ? uri.slice(0, -"/SKILL.md".length).split("/").at(-1) : undefined;
    return name ? `${name} (${server})` : skillId;
  } catch {
    return skillId;
  }
}

function assertConnected(skill: ConnectedMcpSkill) {
  if (store.getState().enableMcpSkills === false) throw new Error("MCP Skills are disabled in settings");
  const client = mcpRuntime.get(skill.serverKey);
  if (!client || !validateMcpSkillEntry(skill.entry)) throw new Error(`MCP skill from ${skill.serverKey} is unavailable`);
  return client;
}

export async function refreshConnectedSkill(skill: ConnectedMcpSkill): Promise<McpSkillEntry> {
  const entry = await getMcpSkill(assertConnected(skill), skill.entry.uri);
  assertConnected(skill);
  if (!validateMcpSkillEntry(entry)) throw new Error("Invalid MCP skill manifest");
  return entry;
}

export function skillResourcePaths(entry: McpSkillEntry) {
  const root = entry.uri.slice(0, -"SKILL.md".length);
  return entry.resources === "dynamic" ? [] : entry.resources
    .filter((file) => file.uri !== entry.uri)
    .map((file) => file.uri.slice(root.length));
}

export async function readConnectedSkillFile(skill: ConnectedMcpSkill, uri: string, entry = skill.entry): Promise<Blob> {
  assertConnected(skill);
  const root = entry.uri.slice(0, -"SKILL.md".length);
  if (uri !== entry.uri && (!uri.startsWith(root) || uri.slice(root.length).split("/").some((part) => !part || part === "." || part === ".."))) {
    throw new Error("Resource is outside the skill directory");
  }
  const manifest = entry.resources === "dynamic" ? undefined : entry.resources.find((file) => file.uri === uri);
  if (entry.resources !== "dynamic" && !manifest) throw new Error("Resource is not in the MCP skill manifest");
  const response = await readResource(skill.serverKey, uri);
  assertConnected(skill);
  const content = response.contents.find((item) => item.uri === uri);
  if (!content) throw new Error("MCP server did not return the requested resource");
  const blob = "blob" in content && typeof content.blob === "string"
    ? new Blob([Uint8Array.from(atob(content.blob), (char) => char.charCodeAt(0))])
    : "text" in content && typeof content.text === "string"
      ? new Blob([content.text]) : undefined;
  if (!blob) throw new Error("MCP server returned an unsupported resource");
  if (blob.size > 16 * 1024 * 1024) throw new Error("MCP skill exceeds the 16 MiB limit");
  if (manifest) {
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", await blob.arrayBuffer())))
      .map((byte) => byte.toString(16).padStart(2, "0")).join("");
    if (blob.size !== manifest.size || `sha256:${digest}` !== manifest.digest) {
      throw new Error("MCP skill file failed integrity verification; refresh the skill before retrying");
    }
  }
  if (uri === entry.uri) {
    const text = await blob.text();
    const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
    if (!match) throw new Error("MCP SKILL.md has no frontmatter");
    const doc = parseDocument(match[1]);
    if (doc.errors.length || JSON.stringify(sortObject(doc.toJSON())) !== JSON.stringify(sortObject(entry.frontmatter))) {
      throw new Error("MCP skill frontmatter does not match its manifest");
    }
  }
  assertConnected(skill);
  return blob;
}

function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObject);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
    .map(([key, item]) => [key, sortObject(item)]));
  return value;
}

// Only explicit installation retrieves every file; normal activation stays lazy.
export async function archiveConnectedSkill(skill: ConnectedMcpSkill): Promise<Blob> {
  const entry = await refreshConnectedSkill(skill);
  if (entry.resources === "dynamic") throw new Error("Dynamic MCP skills cannot be installed without a complete file manifest");
  const zip = new JSZip();
  const root = entry.uri.slice(0, -"SKILL.md".length);
  for (const resource of entry.resources) {
    const file = await readConnectedSkillFile(skill, resource.uri, entry);
    zip.file(`${entry.frontmatter.name}/${resource.uri.slice(root.length)}`, await file.arrayBuffer());
  }
  return zip.generateAsync({ type: "blob" });
}
