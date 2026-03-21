type OpenAISkillCatalogItem = {
  skillId?: string;
  name: string;
};

export type OpenAISkillOption = {
  value: string;
  label: string;
};

const OPENAI_CURATED_SKILL_OPTIONS: OpenAISkillOption[] = [
  {
    value: "openai-spreadsheets",
    label: "Spreadsheets",
  },
];

function normalizeOpenAISkillValue(value: string) {
  return value === "spreadsheets" ? "openai-spreadsheets" : value;
}

export function buildOpenAISkillOptions(items: OpenAISkillCatalogItem[] = []): OpenAISkillOption[] {
  const optionsByValue = new Map<string, OpenAISkillOption>();

  for (const item of items) {
    if (!item.skillId?.startsWith("openai/")) continue;

    const value = normalizeOpenAISkillValue(item.skillId.replace(/^openai\//, ""));
    if (!value) continue;

    if (!optionsByValue.has(value)) {
      optionsByValue.set(value, {
        value,
        label: item.name,
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
