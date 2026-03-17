import type { SkillDiagnostic, SkillFrontmatter } from "./types";

const FRONTMATTER_RE = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/;
const SKILL_NAME_RE = /^(?!-)(?!.*--)[a-z0-9-]{1,64}(?<!-)$/;

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
  const description =
    typeof parsed.description === "string" ? parsed.description : "";

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

  if (diagnostics.some((d) => d.severity === "error")) {
    return { body, diagnostics };
  }

  return {
    body,
    diagnostics,
    frontmatter: {
      name,
      description,
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
