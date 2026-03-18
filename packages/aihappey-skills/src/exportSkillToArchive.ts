import JSZip from "jszip";
import type { SkillArchiveExport, StoredSkill } from "./types";

function normalizeArchivePath(path: string) {
  return path
    .replace(/\\/g, "/")
    .replace(/^\.?\//, "")
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/");
}

function isSafeArchivePath(path: string) {
  return !!path && path !== ".." && !path.startsWith("../") && !path.includes("/../");
}

function toArchiveRootName(name: string) {
  return (
    String(name ?? "")
      .trim()
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "skill"
  );
}

function toYamlScalar(value: string) {
  return JSON.stringify(String(value ?? ""));
}

function buildSkillMarkdown(skill: StoredSkill) {
  const lines = [
    "---",
    `id: ${toYamlScalar(skill.skillId)}`,
    `name: ${toYamlScalar(skill.frontmatter.name)}`,
    `description: ${toYamlScalar(skill.frontmatter.description)}`,
    `version: ${toYamlScalar(skill.version)}`,
    `default-version: ${toYamlScalar(skill.defaultVersion)}`,
    `latest-version: ${toYamlScalar(skill.latestVersion)}`,
  ];

  if (skill.frontmatter.license) {
    lines.push(`license: ${toYamlScalar(skill.frontmatter.license)}`);
  }

  if (skill.frontmatter.compatibility) {
    lines.push(`compatibility: ${toYamlScalar(skill.frontmatter.compatibility)}`);
  }

  if (skill.frontmatter.metadata && Object.keys(skill.frontmatter.metadata).length > 0) {
    lines.push("metadata:");
    for (const [key, value] of Object.entries(skill.frontmatter.metadata)) {
      lines.push(`  ${key}: ${toYamlScalar(value)}`);
    }
  }

  if (skill.frontmatter.allowedTools) {
    lines.push(`allowed-tools: ${toYamlScalar(skill.frontmatter.allowedTools)}`);
  }

  lines.push("---");

  const body = skill.body.trim();
  if (body) {
    lines.push("", body);
  }

  return lines.join("\n");
}

export async function exportSkillToArchive(skill: StoredSkill): Promise<SkillArchiveExport> {
  const zip = new JSZip();
  const rootName = toArchiveRootName(skill.name);
  const rootFolder = zip.folder(rootName);

  if (!rootFolder) {
    throw new Error("Could not create the skill archive root folder.");
  }

  let hasSkillMarkdown = false;

  for (const file of skill.files) {
    const relativePath = normalizeArchivePath(file.path);
    if (!isSafeArchivePath(relativePath)) {
      continue;
    }

    if (relativePath === "SKILL.md") {
      hasSkillMarkdown = true;
    }

    rootFolder.file(relativePath, file.data);
  }

  if (!hasSkillMarkdown) {
    rootFolder.file("SKILL.md", buildSkillMarkdown(skill));
  }

  const blob = await zip.generateAsync({
    type: "blob",
    mimeType: "application/zip",
  });

  return {
    filename: `${rootName}.zip`,
    blob,
  };
}
