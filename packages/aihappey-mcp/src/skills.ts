import type { Client } from "@modelcontextprotocol/client";
import { z } from "zod";

export const SKILLS_EXTENSION = "io.modelcontextprotocol/skills";

const resource = z.object({ uri: z.string(), digest: z.string(), size: z.number() });
const entry = z.object({
  uri: z.string(),
  frontmatter: z.object({ name: z.string(), description: z.string() }).catchall(z.unknown()),
  resources: z.union([z.array(resource), z.literal("dynamic")]),
});
const listResult = z.object({ skills: z.array(entry), nextCursor: z.string().optional() }).passthrough();
const getResult = z.object({ skill: entry }).passthrough();

export type McpSkillEntry = z.infer<typeof entry>;

export type ConnectedMcpSkill = {
  skillId: string;
  serverKey: string;
  entry: McpSkillEntry;
};

// Encode both parts of the identity, without ever treating the URI's authority as a network host.
export const mcpSkillId = (serverKey: string, uri: string) =>
  `mcp:${encodeURIComponent(serverKey)}:${encodeURIComponent(uri)}`;

export function validateMcpSkillEntry(value: McpSkillEntry): boolean {
  const { uri, frontmatter, resources } = value;
  if (!uri.endsWith("/SKILL.md") || !frontmatter.name || !frontmatter.description ||
      uri.slice(0, -"/SKILL.md".length).split("/").at(-1) !== frontmatter.name) return false;
  if (resources === "dynamic") return true;
  if (!resources.length || resources.length > 512 ||
      resources.reduce((total, item) => total + item.size, 0) > 16 * 1024 * 1024) return false;
  const root = uri.slice(0, -"SKILL.md".length);
  const seen = new Set<string>();
  for (const item of resources) {
    if (seen.has(item.uri) || (item.uri !== uri && !item.uri.startsWith(root)) ||
        !/^sha256:[0-9a-f]{64}$/.test(item.digest) ||
        !Number.isSafeInteger(item.size) || item.size < 0) return false;
    const path = item.uri.slice(root.length);
    if (path.split("/").some((part) => !part || part === "." || part === ".." || /%2f|%5c/i.test(part))) return false;
    seen.add(item.uri);
  }
  return seen.has(uri);
}

export function supportsSkills(client: Client) {
  const caps = client.getServerCapabilities() as { extensions?: Record<string, unknown>; resources?: unknown } | undefined;
  return !!caps?.resources && !!caps.extensions && Object.hasOwn(caps.extensions, SKILLS_EXTENSION);
}

export async function listMcpSkills(client: Client): Promise<McpSkillEntry[]> {
  if (!supportsSkills(client)) return [];
  const result: McpSkillEntry[] = [];
  const cursors = new Set<string>();
  let cursor: string | undefined;
  do {
    // The JS client does not yet expose typed Skills helpers.
    const page = await client.request({ method: "skills/list", params: cursor ? { cursor } : {} }, listResult);
    result.push(...page.skills);
    cursor = page.nextCursor;
    if (cursor && cursors.has(cursor)) throw new Error("MCP skills/list returned a repeated cursor");
    if (cursor) cursors.add(cursor);
  } while (cursor);
  return result;
}

export async function getMcpSkill(client: Client, uri: string): Promise<McpSkillEntry> {
  if (!supportsSkills(client)) throw new Error("MCP server does not support skills");
  const result = await client.request({ method: "skills/get", params: { uri } }, getResult);
  if (result.skill.uri !== uri) throw new Error("MCP skills/get returned another skill");
  return result.skill;
}
