import type { SkillDiagnostic, SkillFrontmatter, SkillWriteDefinition } from "./types";

const FRONTMATTER_RE = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/;
export const SKILL_NAME_RE = /^(?!-)(?!.*--)[a-z0-9-]{1,64}(?<!-)$/;
const SKILL_ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]*(?:\/[A-Za-z0-9][A-Za-z0-9_-]*)*$/;
const SKILL_VERSION_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

export function normalizeSkillName(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export function validateSkillName(value: unknown) {
  const name = normalizeSkillName(value);
  if (!name) throw new Error("name is required.");
  if (!SKILL_NAME_RE.test(name)) {
    throw new Error(
      "name must contain only lowercase letters, numbers, and single hyphens, and it must not start or end with a hyphen."
    );
  }
  return name;
}

export function validateSkillDescription(value: unknown) {
  const description = String(value ?? "").trim();
  if (!description) throw new Error("description is required.");
  if (description.length > 1024) throw new Error("description must be 1024 characters or less.");
  return description;
}

export function normalizeSkillRelativePath(value: unknown) {
  return String(value ?? "")
    .replace(/\\/g, "/")
    .replace(/^\.\/?/, "")
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/")
    .trim();
}

export function validateSkillRelativePath(value: unknown, options?: { allowManifest?: boolean }) {
  const path = normalizeSkillRelativePath(value);
  if (!path) throw new Error("relativePath is required.");
  if (path === ".." || path.startsWith("../") || path.includes("/../") || path.includes("//")) {
    throw new Error("relativePath must stay inside the skill folder.");
  }
  if (!options?.allowManifest && path.toLowerCase() === "skill.md") {
    throw new Error("Use the manifest update tool for SKILL.md.");
  }
  return path === "skill.md" ? "SKILL.md" : path;
}

function toYamlScalar(value: string) {
  return JSON.stringify(String(value ?? ""));
}

function normalizeMetadata(metadata: Record<string, string> | undefined | null) {
  const result: Record<string, string> = {};
  for (const [rawKey, rawValue] of Object.entries(metadata ?? {})) {
    const key = String(rawKey ?? "").trim();
    if (!key) throw new Error("metadata keys cannot be empty.");
    if (!/^[A-Za-z0-9_.-]+$/.test(key)) {
      throw new Error(`metadata key '${key}' contains unsupported characters.`);
    }
    result[key] = String(rawValue ?? "").trim();
  }
  return result;
}

export function buildDefaultSkillInstructions(name: string) {
  return `# ${name}\n\n## When to use this skill\nDescribe when this skill should be activated.\n\n## Instructions\nAdd the exact workflow the agent should follow.`;
}

export function normalizeSkillWriteDefinition(definition: SkillWriteDefinition): Required<Pick<SkillWriteDefinition, "name" | "description">> & SkillWriteDefinition {
  const name = validateSkillName(definition.name);
  const description = validateSkillDescription(definition.description);
  const compatibility = String(definition.compatibility ?? "").trim();
  if (compatibility && compatibility.length > 500) {
    throw new Error("compatibility must be 500 characters or less.");
  }
  return {
    ...definition,
    name,
    description,
    instructions: String(definition.instructions ?? "").trim() || buildDefaultSkillInstructions(name),
    license: String(definition.license ?? "").trim() || undefined,
    compatibility: compatibility || undefined,
    metadata: normalizeMetadata(definition.metadata),
    allowedTools: String(definition.allowedTools ?? "").trim() || undefined,
    skillId: String(definition.skillId ?? "").trim() || undefined,
  };
}

export function renderSkillMarkdown(definition: SkillWriteDefinition & { version?: string; defaultVersion?: string; latestVersion?: string }) {
  const normalized = normalizeSkillWriteDefinition(definition);
  const lines = ["---"];
  if (normalized.skillId) lines.push(`id: ${toYamlScalar(normalized.skillId)}`);
  lines.push(`name: ${toYamlScalar(normalized.name)}`);
  lines.push(`description: ${toYamlScalar(normalized.description)}`);
  if (definition.version) lines.push(`version: ${toYamlScalar(definition.version)}`);
  if (definition.defaultVersion) lines.push(`default-version: ${toYamlScalar(definition.defaultVersion)}`);
  if (definition.latestVersion) lines.push(`latest-version: ${toYamlScalar(definition.latestVersion)}`);
  if (normalized.license) lines.push(`license: ${toYamlScalar(normalized.license)}`);
  if (normalized.compatibility) lines.push(`compatibility: ${toYamlScalar(normalized.compatibility)}`);
  if (normalized.metadata && Object.keys(normalized.metadata).length > 0) {
    lines.push("metadata:");
    for (const [key, value] of Object.entries(normalized.metadata).sort(([a], [b]) => a.localeCompare(b))) {
      lines.push(`  ${key}: ${toYamlScalar(value)}`);
    }
  }
  if (normalized.allowedTools) lines.push(`allowed-tools: ${toYamlScalar(normalized.allowedTools)}`);
  lines.push("---", "", normalized.instructions ?? buildDefaultSkillInstructions(normalized.name));
  return `${lines.join("\n").trim()}\n`;
}

function stripQuotes(value: string) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function normalizeValue(value: string) {
  return stripQuotes(value).trim();
}

function normalizeVersionIdentifier(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  return SKILL_VERSION_RE.test(text) ? text : undefined;
}

function parseYamlLikeFrontmatter(source: string) {
  const result: Record<string, string | Record<string, string>> = {};
  let currentMapKey: string | undefined;

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.replace(/\t/g, "  ");
    if (!line.trim() || line.trimStart().startsWith("#")) continue;

    const nestedMatch = line.match(/^\s{2,}([A-Za-z0-9_.-]+):\s*(.*)$/);
    if (nestedMatch && currentMapKey) {
      const [, key, rawValue] = nestedMatch;
      const current = (result[currentMapKey] ??= {}) as Record<string, string>;
      current[key] = normalizeValue(rawValue);
      continue;
    }

    const match = line.match(/^([A-Za-z0-9_.-]+):\s*(.*)$/);
    if (!match) {
      currentMapKey = undefined;
      continue;
    }

    const [, key, rawValue] = match;
    if (!rawValue.trim()) {
      result[key] = {};
      currentMapKey = key;
      continue;
    }

    result[key] = normalizeValue(rawValue);
    currentMapKey = undefined;
  }

  return result;
}

export function parseSkillMarkdown(
  text: string,
  expectedDirectoryName: string
): {
  frontmatter?: SkillFrontmatter;
  body: string;
  diagnostics: SkillDiagnostic[];
} {
  const diagnostics: SkillDiagnostic[] = [];
  const match = text.match(FRONTMATTER_RE);

  if (!match) {
    diagnostics.push({
      severity: "error",
      code: "skill-missing-frontmatter",
      message: "SKILL.md must start with YAML frontmatter enclosed by --- delimiters.",
    });
    return { body: text.trim(), diagnostics };
  }

  const [, yamlSource, bodySource] = match;
  const body = bodySource.trim();
  const parsed = parseYamlLikeFrontmatter(yamlSource);

  const name = typeof parsed.name === "string" ? parsed.name : "";
  const id = typeof parsed.id === "string" ? parsed.id.trim() : "";
  const description =
    typeof parsed.description === "string" ? parsed.description : "";
  const version = normalizeVersionIdentifier(parsed.version);
  const defaultVersion = normalizeVersionIdentifier(parsed["default-version"]);
  const latestVersion = normalizeVersionIdentifier(parsed["latest-version"]);

  if (!name) {
    diagnostics.push({
      severity: "error",
      code: "skill-missing-name",
      message: "Skill frontmatter must include a non-empty name field.",
    });
  }

  if (!description) {
    diagnostics.push({
      severity: "error",
      code: "skill-missing-description",
      message: "Skill frontmatter must include a non-empty description field.",
    });
  }

  if (!id) {
    diagnostics.push({
      severity: "warning",
      code: "skill-missing-id",
      message: "Skill frontmatter should include an id field for OpenAI-compatible skill catalogs.",
      skillName: name || undefined,
    });
  } else if (!SKILL_ID_RE.test(id)) {
    diagnostics.push({
      severity: "warning",
      code: "skill-invalid-id",
      message:
        "Skill id should start with a letter or number and only contain letters, numbers, underscores, hyphens, and optional provider prefixes separated by slashes.",
      skillName: name || undefined,
    });
  }

  if (name && !SKILL_NAME_RE.test(name)) {
    diagnostics.push({
      severity: "warning",
      code: "skill-invalid-name",
      message:
        "Skill name should use lowercase letters, numbers, and hyphens only, without leading, trailing, or consecutive hyphens.",
      skillName: name,
    });
  }

  if (name && expectedDirectoryName && name !== expectedDirectoryName) {
    diagnostics.push({
      severity: "warning",
      code: "skill-name-mismatch",
      message: `Skill name \"${name}\" does not match directory \"${expectedDirectoryName}\".`,
      skillName: name,
    });
  }

  if (!body) {
    diagnostics.push({
      severity: "warning",
      code: "skill-no-markdown-body",
      message: "Skill instructions are empty after frontmatter.",
      skillName: name || undefined,
    });
  }

  if (typeof parsed.version === "string" && !version) {
    diagnostics.push({
      severity: "warning",
      code: "skill-invalid-version",
      message: "Skill version must be a non-empty identifier such as 1, 2, 3, or latest.",
      skillName: name || undefined,
    });
  }

  if (typeof parsed["default-version"] === "string" && !defaultVersion) {
    diagnostics.push({
      severity: "warning",
      code: "skill-invalid-version",
      message: "Skill default-version must be a non-empty identifier such as 1 or latest.",
      skillName: name || undefined,
    });
  }

  if (typeof parsed["latest-version"] === "string" && !latestVersion) {
    diagnostics.push({
      severity: "warning",
      code: "skill-invalid-version",
      message: "Skill latest-version must be a non-empty identifier such as 1 or latest.",
      skillName: name || undefined,
    });
  }

  if (diagnostics.some((d) => d.severity === "error")) {
    return { body, diagnostics };
  }

  return {
    body,
    diagnostics,
    frontmatter: {
      id: SKILL_ID_RE.test(id) ? id : undefined,
      name,
      description,
      version,
      defaultVersion,
      latestVersion,
      license: typeof parsed.license === "string" ? parsed.license : undefined,
      compatibility:
        typeof parsed.compatibility === "string"
          ? parsed.compatibility
          : undefined,
      metadata:
        parsed.metadata && typeof parsed.metadata === "object"
          ? (parsed.metadata as Record<string, string>)
          : undefined,
      allowedTools:
        typeof parsed["allowed-tools"] === "string"
          ? parsed["allowed-tools"]
          : undefined,
    },
  };
}
