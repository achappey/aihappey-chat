import type { SkillsContextType } from "aihappey-skills";

type OpenAISkillCatalogItem = {
  skillId?: string;
  name: string;
  description?: string;
};

export type OpenAISkillOption = {
  value: string;
  label: string;
  skillId: string;
  name: string;
  description: string;
  providerId: string;
  backendType: "reference" | "inline";
  referenceSkillId?: string;
};

type OpenAIShellSkillEntry =
  | {
    type: "skill_reference";
    skill_id: string;
    version?: string;
  }
  | {
    type: "inline";
    name: string;
    description: string;
    source: {
      type: "base64";
      media_type: "application/zip";
      data: string;
    };
  };

const OPENAI_CURATED_SKILL_OPTIONS: OpenAISkillOption[] = [
  {
    value: "openai/spreadsheets",
    label: "Spreadsheets",
    skillId: "openai/spreadsheets",
    name: "Spreadsheets",
    description: "",
    providerId: "openai",
    backendType: "reference",
    referenceSkillId: "openai-spreadsheets",
  },
];

function normalizeOpenAIReferenceSkillId(value: string) {
  return value === "spreadsheets" ? "openai-spreadsheets" : value;
}

function getProviderId(skillId: string) {
  return String(skillId ?? "").split("/").filter(Boolean)[0] ?? "";
}

function buildReferenceSkillId(skillId: string) {
  return normalizeOpenAIReferenceSkillId(String(skillId ?? "").replace(/^openai\//, ""));
}

function formatOpenAISkillOptionLabel(item: OpenAISkillCatalogItem) {
  const skillId = String(item.skillId ?? "").trim();
  if (!skillId) return item.name;
  return `${item.name} (${skillId})`;
}

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

export function buildOpenAISkillOptions(items: OpenAISkillCatalogItem[] = []): OpenAISkillOption[] {
  const optionsByValue = new Map<string, OpenAISkillOption>();

  for (const item of items) {
    const skillId = String(item.skillId ?? "").trim();
    if (!skillId) continue;

    const providerId = getProviderId(skillId);
    const backendType = providerId === "openai" ? "reference" : "inline";
    const value = skillId;

    if (!optionsByValue.has(value)) {
      optionsByValue.set(value, {
        value,
        label: formatOpenAISkillOptionLabel(item),
        skillId,
        name: item.name,
        description: item.description ?? "",
        providerId,
        backendType,
        referenceSkillId: backendType === "reference" ? buildReferenceSkillId(skillId) : undefined,
      });
    }
  }

  for (const option of OPENAI_CURATED_SKILL_OPTIONS) {
    if (!optionsByValue.has(option.value)) {
      optionsByValue.set(option.value, option);
    }
  }

  return Array.from(optionsByValue.values()).sort((a, b) => a.label.localeCompare(b.label));
}

export function createOpenAIShellSkillResolver(
  skills: Pick<SkillsContextType, "ensureDownloaded" | "content">,
  options: OpenAISkillOption[] = []
) {
  const optionsByValue = new Map(options.map((option) => [option.value, option]));

  return async (skillValue: string): Promise<OpenAIShellSkillEntry | undefined> => {
    const option = optionsByValue.get(skillValue);
    if (!option) return undefined;

    if (option.backendType === "reference") {
      return {
        type: "skill_reference",
        skill_id: option.referenceSkillId ?? buildReferenceSkillId(option.skillId),
      };
    }

    await skills.ensureDownloaded(option.skillId);
    const response = await skills.content.retrieve(option.skillId);
    if (!response.ok) {
      throw new Error(`Could not load the skill archive for ${option.name}.`);
    }

    const data = await blobToBase64(await response.blob());
    return {
      type: "inline",
      name: option.name,
      description: option.description,
      source: {
        type: "base64",
        media_type: "application/zip",
        data,
      },
    };
  };
}
