import { useCallback } from "react";
import type { Tool } from "@modelcontextprotocol/sdk/types";
import {
  PLUGIN_SCHEMA_URL,
  normalizePluginFilePath,
  replacePluginDraftFiles,
  storedPluginToDraft,
  validateMcpServer,
  type PluginDraft,
  type PluginManifest,
  type PluginMcpServer,
  type PluginsContextType,
  type StoredPlugin,
  type StoredPluginFile,
} from "aihappey-plugins";
import type { SkillsContextType, StoredSkill } from "aihappey-skills";

type ToolTextResult = {
  isError: boolean;
  content: { type: "text"; text: string }[];
  structuredContent?: Record<string, any>;
};

type LocalAgentPluginEditorToolCall = { toolName: string; input?: any };

const okJson = (value: Record<string, any>): ToolTextResult => ({
  isError: false,
  structuredContent: value,
  content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
});

const fail = (error: unknown): ToolTextResult => ({
  isError: true,
  content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }],
});

const pluginIdSchema = {
  type: "string",
  minLength: 1,
  description: "Installed Agent Plugin id or manifest name.",
};

const annotations = {
  read: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  create: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  write: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  remove: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
  download: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
} as const;

const manifestMetadataProperties = {
  version: { type: ["string", "null"] },
  description: { type: ["string", "null"] },
  author: {
    anyOf: [
      {
        type: "object",
        properties: { name: { type: "string" }, email: { type: "string" }, url: { type: "string" } },
        additionalProperties: false,
      },
      { type: "null" },
    ],
  },
  homepage: { type: ["string", "null"] },
  repository: { type: ["string", "null"] },
  license: { type: ["string", "null"] },
  keywords: { anyOf: [{ type: "array", items: { type: "string" } }, { type: "null" }] },
  extensions: { anyOf: [{ type: "object" }, { type: "null" }] },
};

const mcpServerSchema = {
  oneOf: [
    {
      type: "object",
      properties: {
        type: { const: "stdio" },
        command: { type: "string", minLength: 1 },
        args: { type: "array", items: { type: "string" } },
        env: { type: "object", additionalProperties: { type: "string" } },
        cwd: { type: "string" },
      },
      required: ["type", "command"],
      additionalProperties: false,
    },
    {
      type: "object",
      properties: {
        type: { enum: ["streamable-http", "sse"] },
        url: { type: "string" },
        headers: { type: "object", additionalProperties: { type: "string" } },
      },
      required: ["type", "url"],
      additionalProperties: false,
    },
  ],
};

export const localAgentPluginEditorListTool: Tool = {
  name: "local_agent_plugin_editor_list",
  title: "List Agent Plugins",
  description: "List installed Agent Plugin packages available to the browser-local Plugin editor.",
  inputSchema: { type: "object", properties: {}, additionalProperties: false },
  annotations: annotations.read,
};

export const localAgentPluginEditorInspectTool: Tool = {
  name: "local_agent_plugin_editor_inspect",
  title: "Inspect Agent Plugin",
  description: "Inspect an Agent Plugin manifest, component inventory, package files, and diagnostics.",
  inputSchema: {
    type: "object",
    properties: { pluginId: pluginIdSchema },
    required: ["pluginId"],
    additionalProperties: false,
  },
  annotations: annotations.read,
};

export const localAgentPluginEditorReadFileTool: Tool = {
  name: "local_agent_plugin_editor_read_file",
  title: "Read Agent Plugin text file",
  description: "Read a UTF-8 text package file. Root plugin.json and mcp.json are returned from inspect instead.",
  inputSchema: {
    type: "object",
    properties: { pluginId: pluginIdSchema, relativePath: { type: "string", minLength: 1 } },
    required: ["pluginId", "relativePath"],
    additionalProperties: false,
  },
  annotations: annotations.read,
};

export const localAgentPluginEditorCreateTool: Tool = {
  name: "local_agent_plugin_editor_create",
  title: "Create Agent Plugin",
  description: "Create a minimal Agent Plugins v1.0.0 package. The package name is immutable after creation.",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string", minLength: 1, maxLength: 64, description: "Spec-compliant Agent Plugin name." },
      version: { type: "string" },
      description: { type: "string" },
      author: manifestMetadataProperties.author.anyOf[0],
      homepage: { type: "string" },
      repository: { type: "string" },
      license: { type: "string" },
      keywords: { type: "array", items: { type: "string" } },
      extensions: { type: "object" },
    },
    required: ["name"],
    additionalProperties: false,
  },
  annotations: annotations.create,
};

export const localAgentPluginEditorUpdateManifestTool: Tool = {
  name: "local_agent_plugin_editor_update_manifest",
  title: "Update Agent Plugin manifest",
  description: "Patch portable plugin.json metadata while preserving omitted fields. Pass null to remove an optional field; name and $schema cannot be changed.",
  inputSchema: {
    type: "object",
    properties: { pluginId: pluginIdSchema, ...manifestMetadataProperties },
    required: ["pluginId"],
    additionalProperties: false,
  },
  annotations: annotations.write,
};

export const localAgentPluginEditorUpsertFileTool: Tool = {
  name: "local_agent_plugin_editor_upsert_file",
  title: "Upsert Agent Plugin text file",
  description: "Create or replace a UTF-8 package file outside skills/. Use the dedicated skill tools for Agent Skills; plugin.json and mcp.json are generated.",
  inputSchema: {
    type: "object",
    properties: {
      pluginId: pluginIdSchema,
      relativePath: { type: "string", minLength: 1 },
      content: { type: "string" },
      mediaType: { type: "string", description: "Defaults to text/plain." },
    },
    required: ["pluginId", "relativePath", "content"],
    additionalProperties: false,
  },
  annotations: annotations.write,
};

export const localAgentPluginEditorDeleteFileTool: Tool = {
  name: "local_agent_plugin_editor_delete_file",
  title: "Delete Agent Plugin file",
  description: "Delete one package file outside skills/. Root generated files and Agent Skill files are protected.",
  inputSchema: {
    type: "object",
    properties: { pluginId: pluginIdSchema, relativePath: { type: "string", minLength: 1 } },
    required: ["pluginId", "relativePath"],
    additionalProperties: false,
  },
  annotations: annotations.remove,
};

export const localAgentPluginEditorUpsertMcpServerTool: Tool = {
  name: "local_agent_plugin_editor_upsert_mcp_server",
  title: "Upsert Agent Plugin MCP server",
  description: "Create or replace one spec-compliant MCP server entry in root mcp.json while preserving all other entries.",
  inputSchema: {
    type: "object",
    properties: { pluginId: pluginIdSchema, serverName: { type: "string", minLength: 1 }, server: mcpServerSchema },
    required: ["pluginId", "serverName", "server"],
    additionalProperties: false,
  },
  annotations: annotations.write,
};

export const localAgentPluginEditorDeleteMcpServerTool: Tool = {
  name: "local_agent_plugin_editor_delete_mcp_server",
  title: "Delete Agent Plugin MCP server",
  description: "Delete one MCP server entry while preserving the Agent Plugin and its independent components.",
  inputSchema: {
    type: "object",
    properties: { pluginId: pluginIdSchema, serverName: { type: "string", minLength: 1 } },
    required: ["pluginId", "serverName"],
    additionalProperties: false,
  },
  annotations: annotations.remove,
};

export const localAgentPluginEditorListSkillCatalogTool: Tool = {
  name: "local_agent_plugin_editor_list_skill_catalog",
  title: "List Agent Skills for Plugin editor",
  description: "List Agent Skills from the skill catalog that can be snapshotted into an Agent Plugin package.",
  inputSchema: {
    type: "object",
    properties: { query: { type: "string", description: "Optional case-insensitive name or description filter." } },
    additionalProperties: false,
  },
  annotations: annotations.read,
};

export const localAgentPluginEditorAddSkillTool: Tool = {
  name: "local_agent_plugin_editor_add_skill",
  title: "Add catalog Agent Skill to Agent Plugin",
  description: "Resolve an Agent Skill from the skill catalog, download it when needed, validate it, and snapshot its complete directory under skills/<name>/. Re-adding replaces that embedded snapshot.",
  inputSchema: {
    type: "object",
    properties: {
      pluginId: pluginIdSchema,
      skillId: { type: "string", minLength: 1, description: "Skill catalog id, skill id, or exact name." },
      version: { type: "string", description: "Optional exact catalog skill version." },
    },
    required: ["pluginId", "skillId"],
    additionalProperties: false,
  },
  annotations: annotations.download,
};

export const localAgentPluginEditorRemoveSkillTool: Tool = {
  name: "local_agent_plugin_editor_remove_skill",
  title: "Remove Agent Skill from Agent Plugin",
  description: "Remove one embedded Agent Skill directory from an Agent Plugin package without changing the source catalog skill.",
  inputSchema: {
    type: "object",
    properties: { pluginId: pluginIdSchema, skillName: { type: "string", minLength: 1 } },
    required: ["pluginId", "skillName"],
    additionalProperties: false,
  },
  annotations: annotations.remove,
};

export const localAgentPluginEditorDeleteTool: Tool = {
  name: "local_agent_plugin_editor_delete",
  title: "Delete Agent Plugin",
  description: "Delete an installed Agent Plugin package and all of its locally stored package data.",
  inputSchema: {
    type: "object",
    properties: { pluginId: pluginIdSchema },
    required: ["pluginId"],
    additionalProperties: false,
  },
  annotations: annotations.remove,
};

export const localAgentPluginEditorPluginDef = {
  name: "local-agent-plugin-editor",
  match: (toolName: string) => toolName.startsWith("local_agent_plugin_editor_"),
  tools: [
    localAgentPluginEditorListTool,
    localAgentPluginEditorInspectTool,
    localAgentPluginEditorReadFileTool,
    localAgentPluginEditorCreateTool,
    localAgentPluginEditorUpdateManifestTool,
    localAgentPluginEditorUpsertFileTool,
    localAgentPluginEditorDeleteFileTool,
    localAgentPluginEditorUpsertMcpServerTool,
    localAgentPluginEditorDeleteMcpServerTool,
    localAgentPluginEditorListSkillCatalogTool,
    localAgentPluginEditorAddSkillTool,
    localAgentPluginEditorRemoveSkillTool,
    localAgentPluginEditorDeleteTool,
  ],
};

function summarizePlugin(plugin: StoredPlugin, affectedFiles: string[] = []) {
  return {
    success: true,
    pluginId: plugin.id,
    name: plugin.name,
    version: plugin.manifest.version,
    skillCount: plugin.skills.filter((skill) => skill.valid).length,
    mcpServerCount: Object.keys(plugin.mcp?.mcpServers ?? {}).length,
    affectedFiles,
    diagnostics: plugin.diagnostics,
  };
}

function inspectPlugin(plugin: StoredPlugin) {
  return {
    ...summarizePlugin(plugin),
    manifest: plugin.manifest,
    mcp: plugin.mcp,
    skills: plugin.skills,
    files: plugin.files.map(({ path, size, mediaType }) => ({ path, size, mediaType })),
  };
}

async function requirePlugin(plugins: PluginsContextType, id: string) {
  const plugin = await plugins.read(String(id ?? ""));
  if (!plugin) throw new Error(`Agent Plugin '${id}' was not found.`);
  return plugin;
}

function editablePackagePath(value: unknown) {
  const path = normalizePluginFilePath(value);
  if (path === "plugin.json" || path === "mcp.json") {
    throw new Error(`${path} is generated; use the manifest or MCP server tools.`);
  }
  if (path === "skills" || path.startsWith("skills/")) {
    throw new Error("Agent Skill package paths are managed only by the add/remove skill tools.");
  }
  return path;
}

function pluginDraftWithManifestPatch(plugin: StoredPlugin, input: Record<string, unknown>): PluginDraft {
  const draft = storedPluginToDraft(plugin);
  const manifest: Record<string, unknown> = { ...draft.manifest };
  for (const key of ["version", "description", "author", "homepage", "repository", "license", "keywords", "extensions"]) {
    if (!(key in input)) continue;
    if (input[key] == null) delete manifest[key];
    else manifest[key] = input[key];
  }
  return { ...draft, manifest: manifest as PluginManifest };
}

function skillSnapshotFiles(skill: StoredSkill): StoredPluginFile[] {
  if (skill.diagnostics.some((item) => item.severity === "error")) {
    throw new Error(`Agent Skill '${skill.name}' is invalid and cannot be added to an Agent Plugin.`);
  }
  if (!skill.files.some((file) => file.path === "SKILL.md")) {
    throw new Error(`Agent Skill '${skill.name}' does not contain SKILL.md.`);
  }
  return skill.files.map((file) => ({
    path: `skills/${skill.name}/${file.path}`,
    data: file.data,
    size: file.size,
    mediaType: file.data.type || undefined,
  }));
}

export function useLocalAgentPluginEditorRuntime(
  plugins: PluginsContextType,
  skills: SkillsContextType
) {
  const handle = useCallback(
    async (toolCall: LocalAgentPluginEditorToolCall): Promise<ToolTextResult> => {
      try {
        const input = toolCall.input ?? {};
        switch (toolCall.toolName) {
          case "local_agent_plugin_editor_list":
            return okJson({ agentPlugins: plugins.items });

          case "local_agent_plugin_editor_inspect":
            return okJson(inspectPlugin(await requirePlugin(plugins, input.pluginId)));

          case "local_agent_plugin_editor_read_file": {
            const plugin = await requirePlugin(plugins, input.pluginId);
            const path = normalizePluginFilePath(input.relativePath);
            if (path === "plugin.json") return okJson({ pluginId: plugin.id, path, content: `${JSON.stringify(plugin.manifest, null, 2)}\n` });
            if (path === "mcp.json") {
              if (!plugin.mcp) throw new Error("This Agent Plugin has no mcp.json.");
              return okJson({ pluginId: plugin.id, path, content: `${JSON.stringify(plugin.mcp, null, 2)}\n` });
            }
            const file = plugin.files.find((item) => item.path === path);
            if (!file) throw new Error(`Agent Plugin file '${path}' was not found.`);
            return okJson({ pluginId: plugin.id, path, mediaType: file.mediaType, content: await file.data.text() });
          }

          case "local_agent_plugin_editor_create": {
            const manifest: PluginManifest = {
              $schema: PLUGIN_SCHEMA_URL,
              name: input.name,
              ...(input.version !== undefined ? { version: input.version } : {}),
              ...(input.description !== undefined ? { description: input.description } : {}),
              ...(input.author !== undefined ? { author: input.author } : {}),
              ...(input.homepage !== undefined ? { homepage: input.homepage } : {}),
              ...(input.repository !== undefined ? { repository: input.repository } : {}),
              ...(input.license !== undefined ? { license: input.license } : {}),
              ...(input.keywords !== undefined ? { keywords: input.keywords } : {}),
              ...(input.extensions !== undefined ? { extensions: input.extensions } : {}),
            };
            return okJson(summarizePlugin(await plugins.create({ manifest, files: [] }), ["plugin.json"]));
          }

          case "local_agent_plugin_editor_update_manifest": {
            const current = await requirePlugin(plugins, input.pluginId);
            const updated = await plugins.update(current.id, pluginDraftWithManifestPatch(current, input));
            return okJson(summarizePlugin(updated, ["plugin.json"]));
          }

          case "local_agent_plugin_editor_upsert_file": {
            const current = await requirePlugin(plugins, input.pluginId);
            const path = editablePackagePath(input.relativePath);
            const data = new Blob([String(input.content ?? "")], { type: input.mediaType || "text/plain" });
            const addition: StoredPluginFile = { path, data, size: data.size, mediaType: data.type || undefined };
            const draft = replacePluginDraftFiles(storedPluginToDraft(current), (file) => file.path.toLowerCase() === path.toLowerCase(), [addition]);
            return okJson(summarizePlugin(await plugins.update(current.id, draft), [path]));
          }

          case "local_agent_plugin_editor_delete_file": {
            const current = await requirePlugin(plugins, input.pluginId);
            const path = editablePackagePath(input.relativePath);
            if (!current.files.some((file) => file.path === path)) throw new Error(`Agent Plugin file '${path}' was not found.`);
            const draft = replacePluginDraftFiles(storedPluginToDraft(current), (file) => file.path === path, []);
            return okJson(summarizePlugin(await plugins.update(current.id, draft), [path]));
          }

          case "local_agent_plugin_editor_upsert_mcp_server": {
            const current = await requirePlugin(plugins, input.pluginId);
            const serverName = String(input.serverName ?? "");
            const validation = validateMcpServer(serverName, input.server);
            if (!validation.value) throw new Error(validation.diagnostics[0]?.message ?? "Invalid MCP server entry.");
            const draft = storedPluginToDraft(current);
            draft.mcpServers = { ...(draft.mcpServers ?? {}), [serverName]: validation.value as PluginMcpServer };
            return okJson(summarizePlugin(await plugins.update(current.id, draft), ["mcp.json"]));
          }

          case "local_agent_plugin_editor_delete_mcp_server": {
            const current = await requirePlugin(plugins, input.pluginId);
            const draft = storedPluginToDraft(current);
            const serverName = String(input.serverName ?? "");
            if (!draft.mcpServers || !(serverName in draft.mcpServers)) throw new Error(`MCP server '${serverName}' was not found.`);
            const { [serverName]: _, ...remaining } = draft.mcpServers;
            draft.mcpServers = remaining;
            return okJson(summarizePlugin(await plugins.update(current.id, draft), ["mcp.json"]));
          }

          case "local_agent_plugin_editor_list_skill_catalog": {
            const query = String(input.query ?? "").trim().toLowerCase();
            const items = (skills.items ?? []).filter((item) => !query || `${item.name} ${item.description}`.toLowerCase().includes(query));
            return okJson({ skills: items });
          }

          case "local_agent_plugin_editor_add_skill": {
            const current = await requirePlugin(plugins, input.pluginId);
            const requested = String(input.skillId ?? "");
            const catalogItem = (skills.items ?? []).find((item) =>
              item.skillId === requested || item.id === requested || item.name === requested
            );
            if (!catalogItem) throw new Error(`Agent Skill '${requested}' was not found in the skill catalog.`);
            const stored = await skills.ensureDownloaded(catalogItem.skillId, input.version);
            if (!stored) throw new Error(`Agent Skill '${requested}' could not be downloaded from the skill catalog.`);
            const prefix = `skills/${stored.name}/`;
            const additions = skillSnapshotFiles(stored);
            const draft = replacePluginDraftFiles(storedPluginToDraft(current), (file) => file.path.startsWith(prefix), additions);
            const updated = await plugins.update(current.id, draft);
            return okJson({ ...summarizePlugin(updated, additions.map((file) => file.path)), skillId: catalogItem.skillId, skillName: stored.name, skillVersion: stored.version });
          }

          case "local_agent_plugin_editor_remove_skill": {
            const current = await requirePlugin(plugins, input.pluginId);
            const skillName = String(input.skillName ?? "");
            const embedded = current.skills.find((skill) => skill.name === skillName || skill.directory === skillName);
            if (!embedded) throw new Error(`Embedded Agent Skill '${skillName}' was not found in this Agent Plugin.`);
            const prefix = `skills/${embedded.directory}/`;
            const affectedFiles = current.files.filter((file) => file.path.startsWith(prefix)).map((file) => file.path);
            const draft = replacePluginDraftFiles(storedPluginToDraft(current), (file) => file.path.startsWith(prefix), []);
            return okJson({ ...summarizePlugin(await plugins.update(current.id, draft), affectedFiles), removedSkill: embedded.name });
          }

          case "local_agent_plugin_editor_delete": {
            const current = await requirePlugin(plugins, input.pluginId);
            await plugins.delete(current.id);
            return okJson({ success: true, deletedPluginId: current.id, deletedPluginName: current.name });
          }

          default:
            throw new Error(`Unsupported tool: ${toolCall.toolName}`);
        }
      } catch (error) {
        return fail(error);
      }
    },
    [plugins, skills]
  );

  return { name: localAgentPluginEditorPluginDef.name, handle };
}
