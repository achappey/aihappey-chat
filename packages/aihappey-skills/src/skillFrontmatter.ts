import type { SkillDiagnostic, SkillFrontmatter } from "./types";

const FRONTMATTER_RE = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/;
const SKILL_NAME_RE = /^(?!-)(?!.*--)[a-z0-9-]{1,64}(?<!-)$/;
const SKILL_ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]*(?:\/[A-Za-z0-9][A-Za-z0-9_-]*)*$/;
const SKILL_VERSION_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

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
