import { useCallback } from "react";
import type { Tool } from "@modelcontextprotocol/sdk/types";
import type { FilesContextType } from "aihappey-files";
import type { SkillsContextType } from "aihappey-skills";

type ToolTextResult = {
  isError: boolean;
  content: { type: "text"; text: string }[];
  structuredContent?: Record<string, any>;
};

const okJson = (value: Record<string, any>): ToolTextResult => ({
  isError: false,
  structuredContent: value,
  content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
});

const fail = (err: unknown): ToolTextResult => ({
  isError: true,
  content: [{ type: "text", text: err instanceof Error ? err.message : String(err) }],
});

const skillIdSchema = { type: "string", description: "Local skill id or skill name." };

export const localSkillEditorListTool: Tool = {
  name: "local_skill_editor_list",
  title: "List local skills for editing",
  description: "List local Agent Skills that can be edited by the Skill Editor plugin.",
  inputSchema: { type: "object", properties: {} },
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
};

export const localSkillEditorInspectTool: Tool = {
  name: "local_skill_editor_inspect",
  title: "Inspect local skill package",
  description: "Inspect a local Agent Skill manifest, files, versions, diagnostics, and body instructions.",
  inputSchema: {
    type: "object",
    properties: { skillId: skillIdSchema, version: { type: "string", description: "Optional exact version." } },
    required: ["skillId"],
  },
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
};

export const localSkillEditorCreateTool: Tool = {
  name: "local_skill_editor_create",
  title: "Create local skill",
  description: "Create a new local spec-compliant Agent Skill from scratch with a SKILL.md manifest.",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Skill folder/name. Lowercase letters, numbers, and hyphens only." },
      description: { type: "string", description: "What the skill does and when to use it." },
      instructions: { type: "string", description: "Markdown body instructions for SKILL.md." },
      license: { type: "string" },
      compatibility: { type: "string" },
      allowedTools: { type: "string", description: "Optional allowed-tools field." },
      metadata: { type: "object", additionalProperties: { type: "string" } },
    },
    required: ["name", "description"],
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
};

export const localSkillEditorUpdateManifestTool: Tool = {
  name: "local_skill_editor_update_manifest",
  title: "Update local skill manifest",
  description:
    "Update SKILL.md metadata and/or instructions. This creates a new incremented skill version and keeps previous versions readable/restorable.",
  inputSchema: {
    type: "object",
    properties: {
      skillId: skillIdSchema,
      description: { type: "string" },
      instructions: { type: "string" },
      license: { type: "string" },
      compatibility: { type: "string" },
      allowedTools: { type: "string" },
      metadata: { type: "object", additionalProperties: { type: "string" } },
    },
    required: ["skillId"],
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
};

export const localSkillEditorUpsertFileTool: Tool = {
  name: "local_skill_editor_upsert_file",
  title: "Upsert local skill text file",
  description:
    "Create or update a UTF-8 text file inside a local skill package in place. Use update_manifest for SKILL.md.",
  inputSchema: {
    type: "object",
    properties: {
      skillId: skillIdSchema,
      relativePath: { type: "string", description: "Path inside skill, e.g. references/REFERENCE.md." },
      content: { type: "string", description: "UTF-8 text content to write." },
      mimeType: { type: "string", description: "Optional MIME type; defaults to text/plain." },
    },
    required: ["skillId", "relativePath", "content"],
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
};

export const localSkillEditorImportLocalFileTool: Tool = {
  name: "local_skill_editor_import_local_file",
  title: "Import local file into skill",
  description:
    "Copy an existing locally stored file, including PDFs or Office files, into a local skill package in place without conversion.",
  inputSchema: {
    type: "object",
    properties: {
      skillId: skillIdSchema,
      localFileName: { type: "string", description: "Exact local file name from the local files plugin." },
      relativePath: { type: "string", description: "Destination path inside the skill package." },
    },
    required: ["skillId", "localFileName", "relativePath"],
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
};

export const localSkillEditorDeleteFileTool: Tool = {
  name: "local_skill_editor_delete_file",
  title: "Delete local skill file",
  description: "Delete a file from the current default version of a local skill package. SKILL.md cannot be deleted.",
  inputSchema: {
    type: "object",
    properties: { skillId: skillIdSchema, relativePath: { type: "string" } },
    required: ["skillId", "relativePath"],
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
};

export const localSkillEditorRestoreVersionTool: Tool = {
  name: "local_skill_editor_restore_version",
  title: "Restore local skill version",
  description: "Restore a previous local skill version by copying it into a new incremented version and making it default.",
  inputSchema: {
    type: "object",
    properties: { skillId: skillIdSchema, version: { type: "string" } },
    required: ["skillId", "version"],
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
};

export const localSkillEditorDeleteSkillTool: Tool = {
  name: "local_skill_editor_delete_skill",
  title: "Delete local skill",
  description: "Delete an entire local skill package and all local versions.",
  inputSchema: { type: "object", properties: { skillId: skillIdSchema }, required: ["skillId"] },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
};

export const localSkillEditorPluginDef = {
  name: "local-skill-editor",
  match: (toolName: string) => toolName.startsWith("local_skill_editor_"),
  tools: [
    localSkillEditorListTool,
    localSkillEditorInspectTool,
    localSkillEditorCreateTool,
    localSkillEditorUpdateManifestTool,
    localSkillEditorUpsertFileTool,
    localSkillEditorImportLocalFileTool,
    localSkillEditorDeleteFileTool,
    localSkillEditorRestoreVersionTool,
    localSkillEditorDeleteSkillTool,
  ],
};

type LocalSkillEditorToolCall = { toolName: string; input?: any };

function summarizeSkill(skill: any, affectedFiles: string[] = []) {
  return {
    success: true,
    skillId: skill.skillId,
    name: skill.name,
    version: skill.version,
    defaultVersion: skill.defaultVersion,
    latestVersion: skill.latestVersion,
    affectedFiles,
    diagnostics: skill.diagnostics ?? [],
    restorationHint: "Use local_skill_editor_restore_version with skillId and a previous version to restore older behavior.",
  };
}

async function resolveLocalFile(files: FilesContextType | null | undefined, name: string) {
  if (!files) throw new Error("Files context not available.");
  const file = files.items.find((item) => item.name === name);
  if (!file) throw new Error(`Local file not found: ${name}`);
  const stored = await files.read(file.id);
  if (!stored) throw new Error(`Local file not found: ${name}`);
  return { file, stored };
}

export function useLocalSkillEditorRuntime(
  skills: SkillsContextType,
  files?: FilesContextType | null
) {
  const handle = useCallback(
    async (toolCall: LocalSkillEditorToolCall): Promise<ToolTextResult> => {
      try {
        const input = toolCall.input ?? {};
        switch (toolCall.toolName) {
          case "local_skill_editor_list":
            return okJson({
              skills: (skills.items ?? []).filter((item) => item.origin === "local" || item.isDownloaded),
            });

          case "local_skill_editor_inspect": {
            const result = await skills.inspectSkill(input.skillId, input.version);
            return okJson({
              ...summarizeSkill(result.skill),
              files: result.files,
              frontmatter: result.skill.frontmatter,
              body: result.skill.body,
              warnings: result.warnings,
              errors: result.errors,
            });
          }

          case "local_skill_editor_create": {
            const skill = await skills.createSkill(input);
            return okJson(summarizeSkill(skill, ["SKILL.md"]));
          }

          case "local_skill_editor_update_manifest": {
            const skill = await skills.updateSkillManifest(input.skillId, input);
            return okJson(summarizeSkill(skill, ["SKILL.md"]));
          }

          case "local_skill_editor_upsert_file": {
            const blob = new Blob([String(input.content ?? "")], { type: input.mimeType ?? "text/plain" });
            const skill = await skills.upsertSkillFile(input.skillId, {
              relativePath: input.relativePath,
              data: blob,
            });
            return okJson(summarizeSkill(skill, [input.relativePath]));
          }

          case "local_skill_editor_import_local_file": {
            const { stored } = await resolveLocalFile(files, input.localFileName);
            const skill = await skills.upsertSkillFile(input.skillId, {
              relativePath: input.relativePath,
              data: stored.data,
            });
            return okJson(summarizeSkill(skill, [input.relativePath]));
          }

          case "local_skill_editor_delete_file": {
            const skill = await skills.deleteSkillFile(input.skillId, input.relativePath);
            return okJson(summarizeSkill(skill, [input.relativePath]));
          }

          case "local_skill_editor_restore_version": {
            const skill = await skills.restoreSkillVersion(input.skillId, input.version);
            return okJson(summarizeSkill(skill, ["SKILL.md"]));
          }

          case "local_skill_editor_delete_skill": {
            await skills.delete(input.skillId);
            return okJson({ success: true, deletedSkillId: input.skillId });
          }

          default:
            throw new Error(`Unsupported tool: ${toolCall.toolName}`);
        }
      } catch (e) {
        return fail(e);
      }
    },
    [files, skills]
  );

  return { name: localSkillEditorPluginDef.name, handle };
}
