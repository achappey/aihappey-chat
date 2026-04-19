import { extractSkillsFromArchive, type StoredSkill } from "aihappey-skills";
import type { Skill as AgentSkill } from "aihappey-types";

type SkillMatchShape = {
  name?: string;
  description?: string;
  version?: string;
  body?: string;
  files?: Array<{ path: string; size?: number }>;
};

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve(result.includes(",") ? result.split(",").pop() ?? "" : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Could not read skill archive."));
    reader.readAsDataURL(blob);
  });
}

export async function readSkillArchivePayload(response: Response) {
  return blobToBase64(await response.blob());
}

function base64ToBlob(data: string, mediaType = "application/zip") {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], { type: mediaType });
}

export function getInlineAgentSkillPayload(skill?: AgentSkill) {
  return skill?.type === "inline" && skill?.source?.type === "base64"
    ? String(skill.source.data ?? "")
    : "";
}

export async function readInlineAgentSkillMetadata(skill?: AgentSkill) {
  const payload = getInlineAgentSkillPayload(skill);
  if (!payload) return undefined;

  try {
    const archive = base64ToBlob(payload, skill?.source?.media_type ?? "application/zip");
    const { parsedSkills } = await extractSkillsFromArchive(archive);
    const parsed = parsedSkills[0];
    if (!parsed) return undefined;

    return {
      skillId: parsed.frontmatter?.id ?? parsed.id,
      version: parsed.frontmatter?.version ?? parsed.version,
      name: parsed.name,
      description: parsed.description,
      body: parsed.body,
      files: parsed.files.map((file) => ({ path: file.path, size: file.size })),
    };
  } catch {
    return undefined;
  }
}

function normalizeSkillFiles(files: Array<{ path: string; size?: number }> = []) {
  return files
    .map((file) => `${String(file.path ?? "").replace(/\\/g, "/")}::${Number(file.size ?? 0)}`)
    .sort()
    .join("|");
}

export function buildSkillMatchKey(skill?: SkillMatchShape) {
  return JSON.stringify({
    name: String(skill?.name ?? "").trim(),
    description: String(skill?.description ?? "").trim(),
    version: String(skill?.version ?? "").trim(),
    body: String(skill?.body ?? "").trim(),
    files: normalizeSkillFiles(skill?.files ?? []),
  });
}

export function buildStoredSkillMatchKey(skill?: StoredSkill) {
  return buildSkillMatchKey({
    name: skill?.name,
    description: skill?.description,
    version: skill?.version,
    body: skill?.body,
    files: skill?.files?.map((file) => ({ path: file.path, size: file.size })) ?? [],
  });
}

export async function createInlineAgentSkill(storedSkill: StoredSkill, archive: Blob): Promise<AgentSkill> {
  return {
    type: "inline",
    name: storedSkill.name,
    description: storedSkill.description,
    source: {
      type: "base64",
      media_type: "application/zip",
      data: await blobToBase64(archive),
    },
  };
}
