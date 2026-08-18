import {
  PLUGIN_SCHEMA_URL,
  normalizePluginName,
  validateMcpServer,
  writeClientExtension,
  type PluginDraft,
  type PluginMcpServer,
  type PluginServerExtension,
  type StoredPluginFile,
} from "aihappey-plugins";
import {
  extractSkillsFromArchive,
  type SkillCatalogItem,
  type StoredSkill,
} from "aihappey-skills";
import type { Agent, Skill } from "aihappey-types";

export type AgentPluginConversionErrorCode =
  | "empty-agent"
  | "inline-skill-invalid"
  | "skill-reference-unavailable"
  | "mcp-server-invalid";

export class AgentPluginConversionError extends Error {
  constructor(
    readonly code: AgentPluginConversionErrorCode,
    message: string,
    readonly entry?: string,
  ) {
    super(message);
    this.name = "AgentPluginConversionError";
  }
}

export type AgentPluginSkillResolver = {
  items: SkillCatalogItem[];
  ensureDownloaded: (skillId: string, version?: string) => Promise<StoredSkill | undefined>;
};

export type ConvertAgentToPluginOptions = {
  existingPluginNames: Iterable<string>;
  extensionNamespace?: string;
  skills: AgentPluginSkillResolver;
};

function base64ToBlob(data: string, mediaType: string) {
  try {
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return new Blob([bytes], { type: mediaType });
  } catch {
    throw new AgentPluginConversionError(
      "inline-skill-invalid",
      "The inline skill archive is not valid base64 data.",
    );
  }
}

function trimForSuffix(value: string, suffix: string) {
  return value
    .slice(0, Math.max(1, 64 - suffix.length))
    .replace(/[^a-z0-9]+$/g, "") || "agent-plugin";
}

export function normalizeAgentPluginName(agentName: unknown) {
  const separatedWords = String(agentName ?? "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .replace(/agent/gi, "plugin");
  return normalizePluginName(separatedWords) || "agent-plugin";
}

export function allocateAgentPluginName(agentName: unknown, existingPluginNames: Iterable<string>) {
  const base = normalizeAgentPluginName(agentName);
  const existing = new Set(Array.from(existingPluginNames, (name) => name.toLowerCase()));
  if (!existing.has(base)) return base;

  for (let index = 2; ; index += 1) {
    const suffix = `-${index}`;
    const candidate = `${trimForSuffix(base, suffix)}${suffix}`;
    if (!existing.has(candidate)) return candidate;
  }
}

function normalizeSkillDirectory(value: unknown) {
  return (normalizePluginName(value) || "skill")
    .replace(/\./g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "") || "skill";
}

function allocateSkillDirectory(value: unknown, used: Set<string>) {
  const base = normalizeSkillDirectory(value);
  if (!used.has(base)) {
    used.add(base);
    return base;
  }

  for (let index = 2; ; index += 1) {
    const suffix = `-${index}`;
    const candidate = `${trimForSuffix(base, suffix)}${suffix}`;
    if (!used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }
  }
}

function packageSkillFiles(
  directory: string,
  files: Array<{ path: string; data: Blob; size: number }>,
): StoredPluginFile[] {
  return files.map((file) => ({
    path: `skills/${directory}/${file.path}`,
    data: file.data,
    size: file.size,
    ...(file.data.type ? { mediaType: file.data.type } : {}),
  }));
}

function resolveReferenceVersion(skill: Extract<Skill, { type: "skill_reference" }>, items: SkillCatalogItem[]) {
  const catalogItem = items.find((item) => item.skillId === skill.skill_id);
  if (!catalogItem) return skill.version === "latest" ? undefined : skill.version;
  if (!skill.version) {
    return catalogItem.defaultVersion ?? catalogItem.version ?? catalogItem.latestVersion;
  }
  if (skill.version === "latest") {
    return catalogItem.latestVersion ?? catalogItem.version ?? catalogItem.defaultVersion;
  }
  return skill.version;
}

async function snapshotInlineSkill(
  skill: Extract<Skill, { type: "inline" }>,
  usedDirectories: Set<string>,
) {
  if (skill.source?.type !== "base64" || !skill.source.data) {
    throw new AgentPluginConversionError(
      "inline-skill-invalid",
      `Inline skill '${skill.name}' does not contain a base64 archive.`,
      skill.name,
    );
  }

  const archive = base64ToBlob(skill.source.data, skill.source.media_type || "application/zip");
  const inspection = await extractSkillsFromArchive(archive);
  const invalid = inspection.diagnostics.find((item) => item.severity === "error");
  if (!inspection.parsedSkills.length || invalid) {
    throw new AgentPluginConversionError(
      "inline-skill-invalid",
      invalid?.message ?? `Inline skill '${skill.name}' does not contain a valid Agent Skill.`,
      skill.name,
    );
  }

  return inspection.parsedSkills.flatMap((parsed) => {
    const parsedError = parsed.diagnostics.find((item) => item.severity === "error");
    if (parsedError || !parsed.frontmatter || !parsed.files.some((file) => file.path === "SKILL.md")) {
      throw new AgentPluginConversionError(
        "inline-skill-invalid",
        parsedError?.message ?? `Inline skill '${skill.name}' has no valid SKILL.md.`,
        skill.name,
      );
    }
    const directory = allocateSkillDirectory(parsed.name || skill.name, usedDirectories);
    return packageSkillFiles(directory, parsed.files);
  });
}

async function snapshotReferencedSkill(
  skill: Extract<Skill, { type: "skill_reference" }>,
  resolver: AgentPluginSkillResolver,
  usedDirectories: Set<string>,
) {
  const version = resolveReferenceVersion(skill, resolver.items);
  let stored: StoredSkill | undefined;
  try {
    stored = await resolver.ensureDownloaded(skill.skill_id, version);
  } catch (cause) {
    throw new AgentPluginConversionError(
      "skill-reference-unavailable",
      cause instanceof Error ? cause.message : `Skill '${skill.skill_id}' could not be downloaded.`,
      skill.skill_id,
    );
  }
  if (!stored || !stored.files.some((file) => file.path === "SKILL.md")) {
    throw new AgentPluginConversionError(
      "skill-reference-unavailable",
      `Skill '${skill.skill_id}' could not be resolved${version ? ` at version '${version}'` : ""}.`,
      skill.skill_id,
    );
  }

  const directory = allocateSkillDirectory(stored.name, usedDirectories);
  return packageSkillFiles(directory, stored.files);
}

async function snapshotAgentSkills(agent: Agent, resolver: AgentPluginSkillResolver) {
  const usedDirectories = new Set<string>();
  const snapshots: StoredPluginFile[][] = [];
  for (const skill of agent.skills ?? []) {
    snapshots.push(skill.type === "inline"
      ? await snapshotInlineSkill(skill, usedDirectories)
      : await snapshotReferencedSkill(skill, resolver, usedDirectories));
  }
  return snapshots.flat();
}

function convertMcpServers(agent: Agent) {
  const mcpServers: Record<string, PluginMcpServer> = {};
  const settings: Record<string, PluginServerExtension> = {};

  for (const [name, server] of Object.entries(agent.mcpServers ?? {})) {
    if (server.disabled === true) continue;
    const candidate: PluginMcpServer = {
      type: "streamable-http",
      url: server.url,
      ...(server.headers ? { headers: server.headers } : {}),
    };
    const validation = validateMcpServer(name, candidate);
    if (!validation.value) {
      throw new AgentPluginConversionError(
        "mcp-server-invalid",
        validation.diagnostics[0]?.message ?? `MCP server '${name}' is not portable.`,
        name,
      );
    }
    mcpServers[name] = validation.value;

    const allowedCallers = server.allowed_callers?.filter(
      (caller): caller is "direct" | "programmatic" => caller === "direct" || caller === "programmatic",
    );
    const extension: PluginServerExtension = {
      ...(allowedCallers?.length ? { allowed_callers: allowedCallers } : {}),
      ...(typeof server.defer_loading === "boolean" ? { defer_loading: server.defer_loading } : {}),
      ...(server.namespace === true ? { namespace: true } : {}),
    };
    if (Object.keys(extension).length) settings[name] = extension;
  }

  return { mcpServers, settings };
}

export async function convertAgentToPluginDraft(
  agent: Agent,
  options: ConvertAgentToPluginOptions,
): Promise<PluginDraft> {
  const files = await snapshotAgentSkills(agent, options.skills);
  const { mcpServers, settings } = convertMcpServers(agent);
  if (!files.length && !Object.keys(mcpServers).length) {
    throw new AgentPluginConversionError(
      "empty-agent",
      `Agent '${agent.name}' has no direct skills or enabled MCP servers to package.`,
      agent.name,
    );
  }

  const name = allocateAgentPluginName(agent.name, options.existingPluginNames);
  const manifest = writeClientExtension({
    $schema: PLUGIN_SCHEMA_URL,
    name,
    version: "1.0.0",
    ...(agent.description ? { description: agent.description } : {}),
  }, options.extensionNamespace, settings);

  return {
    manifest,
    files,
    ...(Object.keys(mcpServers).length ? { mcpServers } : {}),
  };
}
