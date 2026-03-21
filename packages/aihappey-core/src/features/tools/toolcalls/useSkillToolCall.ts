import { useCallback } from "react";
import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types";
import {
  getStoredSkillFile,
  getStoredSkillFileMimeType,
  isTextSkillFile,
  listSkillResourcePaths,
  normalizeSkillRelativePath,
  type SkillCatalogItem,
  type SkillsContextType,
} from "aihappey-skills";
import { blobToBase64 } from "../../chat/files/file";
import type { ToolPlugin } from "./usePlugins";

type SkillToolResult = CallToolResult & {
  structuredContent?: Record<string, any>;
};

type ActivateSkillToolCall = {
  toolName: "activate_skill";
  input: { skill_id: string };
};

type ReadSkillResourceToolCall = {
  toolName: "read_skill_resource";
  input: { skill_id: string; path: string };
};

function getEnabledSkills(
  items: SkillCatalogItem[],
  enabledSkillIds: string[]
) {
  const byId = new Map(items.map((item) => [item.skillId, item] as const));
  return (enabledSkillIds ?? [])
    .map((skillId) => byId.get(skillId))
    .filter((item): item is SkillCatalogItem => !!item);
}

function buildSkillCatalog(skills: SkillCatalogItem[]) {
  return skills.map((skill) => `- ${skill.skillId} (${skill.name}): ${skill.description}`).join("\n");
}

function escapeAttribute(value: string) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function buildSkillUri(skillId: string, path: string) {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `skill://${encodeURIComponent(skillId)}/${encodedPath}`;
}

async function resolveEnabledSkill(
  skills: Pick<SkillsContextType, "read">,
  enabledSkills: SkillCatalogItem[],
  skillId: string
) {
  if (!skillId) throw new Error("Missing skill_id.");

  const enabledSkill = enabledSkills.find((item) => item.skillId === skillId);
  if (!enabledSkill) {
    throw new Error(
      `Skill \"${skillId}\" is not enabled. Enabled skills: ${enabledSkills.map((item) => item.skillId).join(", ") || "none"}.`
    );
  }

  const skill = await skills.read(enabledSkill.skillId);
  if (!skill) {
    throw new Error(`Skill \"${skillId}\" could not be loaded.`);
  }

  return skill;
}

export function buildActivateSkillTool(skills: SkillCatalogItem[]): Tool {
  return {
    name: "activate_skill",
    title: "Activate an enabled skill",
    description:
      "Loads the body instructions for an enabled agent skill. Use this when one of the available skills matches the current task. After activation, use read_skill_resource to load referenced bundled files by relative path.\n\nAvailable skills:\n" +
      buildSkillCatalog(skills),
    inputSchema: {
      type: "object",
      properties: {
        skill_id: {
          type: "string",
          enum: skills.map((skill) => skill.skillId),
          description: "Exact enabled skill id to activate.",
        },
      },
      required: ["skill_id"],
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  };
}

export function buildReadSkillResourceTool(skills: SkillCatalogItem[]): Tool {
  return {
    name: "read_skill_resource",
    title: "Read a bundled skill resource",
    description:
      "Reads a bundled file from an enabled skill by relative path. Use this after activate_skill when the skill instructions reference scripts, references, or assets. Paths are relative to the skill root.\n\nEnabled skills:\n" +
      buildSkillCatalog(skills),
    inputSchema: {
      type: "object",
      properties: {
        skill_id: {
          type: "string",
          enum: skills.map((skill) => skill.skillId),
          description: "Exact enabled skill id that owns the resource.",
        },
        path: {
          type: "string",
          description:
            "Relative path within the skill directory, for example references/REFERENCE.md or scripts/run.py.",
        },
      },
      required: ["skill_id", "path"],
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  };
}

export function useSkillToolCall(opts: {
  skills: Pick<SkillsContextType, "items" | "read">;
  enabledSkillIds: string[];
}) {
  const { skills, enabledSkillIds } = opts;
  const enabledSkills = useCallback(
    () => getEnabledSkills(skills.items ?? [], enabledSkillIds),
    [enabledSkillIds, skills.items]
  );

  const handleActivateSkill = useCallback(
    async (toolCall: ActivateSkillToolCall): Promise<SkillToolResult> => {
      const skill = await resolveEnabledSkill(skills, enabledSkills(), toolCall.input?.skill_id);
      const resourcePaths = listSkillResourcePaths(skill);
      const resourcesXml =
        resourcePaths.length > 0
          ? [
              "<skill_resources>",
              ...resourcePaths.map((path) => `  <file>${path}</file>`),
              "</skill_resources>",
            ].join("\n")
          : "<skill_resources />";

      return {
        isError: false,
        structuredContent: {
          skill: {
            name: skill.name,
            description: skill.description,
            resourcePaths,
            instructions: skill.body,
          },
        },
        content: [
          {
            type: "text",
            text: [
              `<skill_content skill_id="${escapeAttribute(skill.skillId)}" name="${escapeAttribute(skill.name)}">`,
              skill.body,
              "",
              "Use read_skill_resource with this skill_id and a relative path from the resource list when you need bundled files referenced by the instructions.",
              resourcesXml,
              "</skill_content>",
            ].join("\n"),
          },
        ],
      };
    },
    [enabledSkills, skills]
  );

  const handleReadSkillResource = useCallback(
    async (toolCall: ReadSkillResourceToolCall): Promise<SkillToolResult> => {
      const skill = await resolveEnabledSkill(skills, enabledSkills(), toolCall.input?.skill_id);
      const relativePath = normalizeSkillRelativePath(toolCall.input?.path ?? "");
      if (!relativePath) {
        throw new Error("Missing path. Provide a relative path inside the skill directory.");
      }

      const file = getStoredSkillFile(skill, relativePath);
      if (!file) {
        throw new Error(
          `Resource \"${relativePath}\" was not found in skill \"${skill.name}\".`
        );
      }

      const mimeType = getStoredSkillFileMimeType(file);
      if (isTextSkillFile(file)) {
        const text = await file.data.text();
        return {
          isError: false,
          structuredContent: {
            skillResource: {
              skillName: skill.name,
              path: relativePath,
              mimeType,
              text,
            },
          },
          content: [
            {
              type: "text",
              text: [
                `<skill_resource skill_id="${escapeAttribute(skill.skillId)}" name="${escapeAttribute(skill.name)}" path="${escapeAttribute(
                  relativePath
                )}" mimeType="${escapeAttribute(mimeType)}">`,
                text,
                "</skill_resource>",
              ].join("\n"),
            },
          ],
        };
      }

      const blob = await blobToBase64(file.data);
      return {
        isError: false,
        structuredContent: {
          skillResource: {
            skillName: skill.name,
            path: relativePath,
            mimeType,
            encoding: "base64",
          },
        },
        content: [
          {
            type: "text",
            text:
              `Binary skill resource ${relativePath} from skill ${skill.name}. ` +
              `mimeType=${mimeType}.`,
          },
          {
            type: "resource",
            resource: {
              uri: buildSkillUri(skill.skillId, relativePath),
              mimeType,
              blob,
            },
          },
        ],
      };
    },
    [enabledSkills, skills]
  );

  const activateSkillPlugin: ToolPlugin = {
    name: "activate-skill",
    match: (toolName) => toolName === "activate_skill",
    handle: handleActivateSkill,
  };

  const readSkillResourcePlugin: ToolPlugin = {
    name: "read-skill-resource",
    match: (toolName) => toolName === "read_skill_resource",
    handle: handleReadSkillResource,
  };

  return {
    enabledSkills: enabledSkills(),
    activateSkillPlugin,
    readSkillResourcePlugin,
  };
}
