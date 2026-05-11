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
import type { ToolPlugin, ToolPluginDef } from "./usePlugins";

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

type SearchSkillsToolCall = {
  toolName: "search_skills";
  input?: { query?: string; limit?: number };
};

export const SKILL_SEARCH_PLUGIN_ID = "skill-search";

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

function clampSearchLimit(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 10;
  return Math.max(1, Math.min(50, Math.floor(parsed)));
}

function normalizeSearchText(value: unknown) {
  return String(value ?? "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

const SEARCH_STOP_WORDS = new Set([
  "a",
  "about",
  "agent",
  "agents",
  "an",
  "and",
  "any",
  "are",
  "as",
  "available",
  "be",
  "best",
  "can",
  "capability",
  "capabilities",
  "capable",
  "could",
  "current",
  "discover",
  "do",
  "does",
  "find",
  "for",
  "from",
  "get",
  "give",
  "handle",
  "help",
  "i",
  "in",
  "is",
  "kind",
  "like",
  "look",
  "looking",
  "me",
  "my",
  "need",
  "needed",
  "needs",
  "of",
  "on",
  "or",
  "please",
  "query",
  "search",
  "skill",
  "skills",
  "some",
  "support",
  "task",
  "tasks",
  "that",
  "the",
  "this",
  "to",
  "tool",
  "tools",
  "use",
  "using",
  "want",
  "wants",
  "we",
  "what",
  "which",
  "who",
  "with",
  "would",
]);

function tokenizeSearchText(value: unknown, options?: { dropStopWords?: boolean }) {
  const normalized = normalizeSearchText(value);
  const tokens = normalized
    .split(/[^a-z0-9]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 || /^\d+$/.test(token));

  const meaningfulTokens = options?.dropStopWords
    ? tokens.filter((token) => !SEARCH_STOP_WORDS.has(token))
    : tokens;

  return Array.from(new Set(meaningfulTokens));
}

function buildFieldIndex(value: unknown) {
  const normalized = normalizeSearchText(value);
  const tokens = tokenizeSearchText(value);
  return { normalized, tokens };
}

function scoreField(token: string, field: ReturnType<typeof buildFieldIndex>, weight: number) {
  if (!token || !field.normalized) return 0;
  if (field.normalized === token) return weight * 6;
  if (field.tokens.includes(token)) return weight * 4;
  if (field.normalized.includes(token)) return weight * 2;
  if (field.tokens.some((fieldToken) => fieldToken.startsWith(token) || token.startsWith(fieldToken))) return weight;
  return 0;
}

function scoreSkillForSearch(skill: SkillCatalogItem, tokens: string[], index: number) {
  const fields = [
    { field: buildFieldIndex(skill.skillId), weight: 12 },
    { field: buildFieldIndex(skill.name), weight: 10 },
    { field: buildFieldIndex(skill.description), weight: 4 },
    { field: buildFieldIndex(skill.origin), weight: 2 },
    { field: buildFieldIndex(skill.version), weight: 1 },
    { field: buildFieldIndex(skill.latestVersion), weight: 1 },
  ];

  let score = 0;
  let matchedTokenCount = 0;

  for (const token of tokens) {
    const tokenScore = fields.reduce((best, item) => Math.max(best, scoreField(token, item.field, item.weight)), 0);
    if (tokenScore > 0) {
      matchedTokenCount += 1;
      score += tokenScore;
    }
  }

  if (matchedTokenCount === 0) return undefined;

  return {
    skill,
    score,
    matchedTokenCount,
    index,
  };
}

function searchSkillCatalog(skills: SkillCatalogItem[], query: string, limit: number) {
  const normalizedQuery = normalizeSearchText(query);
  const tokens = tokenizeSearchText(normalizedQuery, { dropStopWords: true });
  const matches = tokens.length === 0
    ? skills
    : skills
      .map((skill, index) => scoreSkillForSearch(skill, tokens, index))
      .filter((item): item is NonNullable<typeof item> => !!item)
      .sort((a, b) =>
        b.matchedTokenCount - a.matchedTokenCount ||
        b.score - a.score ||
        a.index - b.index
      )
      .map((item) => item.skill);

  return {
    query: normalizedQuery,
    keywords: tokens,
    totalMatches: matches.length,
    skills: matches.slice(0, limit),
  };
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
  skills: Pick<SkillsContextType, "read" | "ensureDownloaded">,
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

  let skill = await skills.read(enabledSkill.skillId);
  if (!skill) {
    skill = await skills.ensureDownloaded(enabledSkill.skillId);
  }
  if (!skill) {
    throw new Error(`Skill \"${skillId}\" could not be loaded.`);
  }

  return skill;
}

export function buildActivateSkillTool(_skills: SkillCatalogItem[]): Tool {
  return {
    name: "activate_skill",
    title: "Activate an enabled skill",
    description:
      "Loads the body instructions for an enabled agent skill. Use this when one of the available skills matches the current task. After activation, use read_skill_resource to load referenced bundled files by relative path.",
    //\n\nAvailable skills:\n" +
    // buildSkillCatalog(skills),
    inputSchema: {
      type: "object",
      properties: {
        skill_id: {
          type: "string",
          description: "Exact enabled skill ID string to activate. Use the id/skill_id shown in the system context or returned by search_skills; do not invent IDs.",
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

export function buildReadSkillResourceTool(_skills: SkillCatalogItem[]): Tool {
  return {
    name: "read_skill_resource",
    title: "Read a bundled skill resource",
    description:
      "Reads a bundled file from an enabled skill by relative path. Use this after activate_skill when the skill instructions reference scripts, references, or assets. Paths are relative to the skill root.",
    //\n\nEnabled skills:\n",
    //buildSkillCatalog(skills),
    inputSchema: {
      type: "object",
      properties: {
        skill_id: {
          type: "string",
          description: "Exact enabled skill ID string that owns the resource. Reuse the same id/skill_id passed to activate_skill.",
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

export function buildSearchSkillsTool(): Tool {
  return {
    name: "search_skills",
    title: "Search skills",
    description:
      "Searches the available Agent Skills catalog by skill id, name, description, origin, and version. Use this only when the user-enabled Skill search plugin is available and you need to discover a skill for the current task. Send concise keyword queries only, not natural-language requests or prompts. Good queries look like 'excel spreadsheet csv formulas' or 'pdf extract summarize'. Activate a returned skill with activate_skill using its exact id/skill_id before following its instructions.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Keyword-only search terms for the needed capability, separated by spaces. Do not send full prompt-style questions such as 'find a skill that can help me with spreadsheets'; send 'spreadsheet excel csv' instead. Multiple keywords are ranked by coverage and relevance. If omitted, returns the first catalog entries.",
        },
        limit: {
          type: "number",
          description: "Maximum number of matching skills to return. Defaults to 10 and is capped at 50.",
        },
      },
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  };
}

export function buildSkillSearchPluginDef(skills: SkillCatalogItem[] = []): ToolPluginDef {
  return {
    name: SKILL_SEARCH_PLUGIN_ID,
    match: (toolName) => toolName === "search_skills" || toolName === "activate_skill" || toolName === "read_skill_resource",
    tools: [
      buildSearchSkillsTool(),
      buildActivateSkillTool(skills),
      buildReadSkillResourceTool(skills),
    ],
  };
}

export const skillSearchPluginDef = buildSkillSearchPluginDef();

export function useSkillToolCall(opts: {
  skills: Pick<SkillsContextType, "items" | "read" | "ensureDownloaded">;
  enabledSkillIds: string[];
  skillSearchEnabled?: boolean;
}) {
  const { skills, enabledSkillIds, skillSearchEnabled = false } = opts;
  const enabledSkills = useCallback(
    () => getEnabledSkills(skills.items ?? [], enabledSkillIds),
    [enabledSkillIds, skills.items]
  );
  const availableSkills = useCallback(
    () => skillSearchEnabled ? (skills.items ?? []) : enabledSkills(),
    [enabledSkills, skillSearchEnabled, skills.items]
  );

  const handleSearchSkills = useCallback(
    async (toolCall: SearchSkillsToolCall): Promise<SkillToolResult> => {
      if (!skillSearchEnabled) {
        throw new Error("Skill search is not enabled for this chat.");
      }

      const limit = clampSearchLimit(toolCall.input?.limit);
      const result = searchSkillCatalog(skills.items ?? [], toolCall.input?.query ?? "", limit);
      const lines = result.skills.map((skill) => {
        const version = skill.version ?? skill.downloadedVersion ?? skill.latestVersion;
        const versionSuffix = version ? ` v${version}` : "";
        const originSuffix = skill.origin ? `, ${skill.origin}` : "";
        return `- id=${skill.skillId}; skill_id=${skill.skillId}; name=${skill.name}${versionSuffix}${originSuffix}: ${skill.description}`;
      });

      return {
        isError: false,
        structuredContent: {
            skillSearch: {
              query: result.query,
              keywords: result.keywords,
              totalMatches: result.totalMatches,
            returned: result.skills.length,
            skills: result.skills.map((skill) => ({
              id: skill.skillId,
              skill_id: skill.skillId,
              name: skill.name,
              description: skill.description,
              origin: skill.origin,
              version: skill.version,
              defaultVersion: skill.defaultVersion,
              latestVersion: skill.latestVersion,
              isDownloaded: skill.isDownloaded,
            })),
          },
        },
        content: [
          {
            type: "text",
            text: [
              `<skill_search query="${escapeAttribute(result.query)}" total_matches="${result.totalMatches}" returned="${result.skills.length}">`,
              lines.length > 0 ? lines.join("\n") : "No matching skills found.",
              "Use activate_skill with a returned skill_id before following any skill instructions.",
              "</skill_search>",
            ].join("\n"),
          },
        ],
      };
    },
    [skillSearchEnabled, skills.items]
  );

  const handleActivateSkill = useCallback(
    async (toolCall: ActivateSkillToolCall): Promise<SkillToolResult> => {
      const skill = await resolveEnabledSkill(skills, availableSkills(), toolCall.input?.skill_id);
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
            id: skill.skillId,
            skill_id: skill.skillId,
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
    [availableSkills, skills]
  );

  const handleReadSkillResource = useCallback(
    async (toolCall: ReadSkillResourceToolCall): Promise<SkillToolResult> => {
      const skill = await resolveEnabledSkill(skills, availableSkills(), toolCall.input?.skill_id);
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
    [availableSkills, skills]
  );

  const searchSkillsPlugin: ToolPlugin = {
    name: SKILL_SEARCH_PLUGIN_ID,
    match: (toolName) => toolName === "search_skills" || toolName === "activate_skill" || toolName === "read_skill_resource",
    handle: async (toolCall, signal) => {
      if (toolCall.toolName === "search_skills") {
        return handleSearchSkills(toolCall);
      }
      if (toolCall.toolName === "activate_skill") {
        return handleActivateSkill(toolCall);
      }
      if (toolCall.toolName === "read_skill_resource") {
        return handleReadSkillResource(toolCall);
      }
      throw new Error(`Unsupported skill search tool: ${toolCall.toolName}`);
    },
  };

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
    searchSkillsPlugin,
    activateSkillPlugin,
    readSkillResourcePlugin,
  };
}
