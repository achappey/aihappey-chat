import { parseSkillMarkdown } from "aihappey-skills";
import { normalizePluginFilePath } from "./package";
import { readClientExtension } from "./validation";
import type {
  PluginServerExtension,
  StoredPlugin,
  StoredPluginFile,
} from "./types";

export const PLUGIN_SKILL_ID_PREFIX = "plugin/";
export const PLUGIN_MCP_KEY_PREFIX = "agent-plugin/";

export type RuntimePluginSkill = {
  skillId: string;
  pluginId: string;
  pluginName: string;
  directory: string;
  name: string;
  description: string;
};

export type RuntimePluginSkillContent = RuntimePluginSkill & {
  body: string;
  files: StoredPluginFile[];
};

export type RuntimePluginMcpServer = {
  key: string;
  pluginId: string;
  pluginName: string;
  serverName: string;
  type: "http" | "sse";
  url: string;
  headers?: Record<string, string>;
  settings?: PluginServerExtension;
};

export type RuntimePlugin = {
  id: string;
  name: string;
  description: string;
  version?: string;
  skills: RuntimePluginSkill[];
  files: StoredPluginFile[];
  mcpServers: RuntimePluginMcpServer[];
  stored: StoredPlugin;
};

const encodeKeyPart = (value: string) => encodeURIComponent(value.trim().toLowerCase());

export const pluginSkillId = (pluginId: string, directory: string) =>
  `${PLUGIN_SKILL_ID_PREFIX}${encodeKeyPart(pluginId)}/${encodeURIComponent(directory)}`;

export const pluginMcpServerKey = (pluginId: string, serverName: string) =>
  `${PLUGIN_MCP_KEY_PREFIX}${encodeKeyPart(pluginId)}/${encodeKeyPart(serverName)}`;

export const isPluginOwnedMcpServerKey = (key: string) =>
  String(key ?? "").toLowerCase().startsWith(PLUGIN_MCP_KEY_PREFIX);

export const listPluginPackageFiles = (plugin: StoredPlugin) =>
  plugin.files.filter((file) => !file.path.startsWith("skills/"));

export function buildRuntimePlugin(
  plugin: StoredPlugin,
  extensionNamespace?: string,
): RuntimePlugin {
  const extension = readClientExtension(plugin.manifest, extensionNamespace);
  const skills = plugin.skills
    .filter((skill) => skill.valid)
    .map((skill): RuntimePluginSkill => ({
      skillId: pluginSkillId(plugin.id, skill.directory),
      pluginId: plugin.id,
      pluginName: plugin.name,
      directory: skill.directory,
      name: skill.name,
      description: skill.description,
    }));

  const mcpServers = Object.entries(plugin.mcp?.mcpServers ?? {}).flatMap(
    ([serverName, server]): RuntimePluginMcpServer[] => {
      if (server.type === "stdio") return [];
      return [{
        key: pluginMcpServerKey(plugin.id, serverName),
        pluginId: plugin.id,
        pluginName: plugin.name,
        serverName,
        type: server.type === "sse" ? "sse" : "http",
        url: server.url,
        ...(server.headers ? { headers: { ...server.headers } } : {}),
        ...(extension?.mcpServers?.[serverName]
          ? { settings: { ...extension.mcpServers[serverName] } }
          : {}),
      }];
    },
  );

  return {
    id: plugin.id,
    name: plugin.name,
    description: plugin.manifest.description ?? "",
    version: plugin.manifest.version,
    skills,
    files: listPluginPackageFiles(plugin),
    mcpServers,
    stored: plugin,
  };
}

export async function readRuntimePluginSkill(
  plugin: RuntimePlugin,
  skillId: string,
): Promise<RuntimePluginSkillContent | undefined> {
  const descriptor = plugin.skills.find((skill) => skill.skillId === skillId);
  if (!descriptor) return undefined;

  const root = `skills/${descriptor.directory}/`;
  const entry = plugin.stored.files.find((file) => file.path === `${root}SKILL.md`);
  if (!entry) return undefined;

  const parsed = parseSkillMarkdown(await entry.data.text(), descriptor.directory);
  if (parsed.diagnostics.some((item) => item.severity === "error")) return undefined;

  return {
    ...descriptor,
    name: parsed.frontmatter?.name || descriptor.name,
    description: parsed.frontmatter?.description || descriptor.description,
    body: parsed.body,
    files: plugin.stored.files
      .filter((file) => file.path.startsWith(root))
      .map((file) => ({ ...file, path: file.path.slice(root.length) })),
  };
}

export function getRuntimePluginFile(plugin: RuntimePlugin, path: string) {
  const normalized = normalizePluginFilePath(path);
  if (normalized.startsWith("skills/")) {
    throw new Error("Use read_skill_resource for files inside a plugin skill.");
  }
  return plugin.files.find((file) => file.path === normalized);
}
