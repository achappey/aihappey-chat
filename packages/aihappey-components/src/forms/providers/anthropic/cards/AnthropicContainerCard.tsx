import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";
import {
  formatAnthropicStringList,
  parseAnthropicStringList,
} from "./AnthropicToolCardShared";

const ANTHROPIC_DEFAULT_CONTAINER_SKILLS = [
  {
    skill_id: "pptx",
    labelKey: "providers:anthropic.containerSettings.skills.pptx",
  },
  {
    skill_id: "xlsx",
    labelKey: "providers:anthropic.containerSettings.skills.xlsx",
  },
  {
    skill_id: "docx",
    labelKey: "providers:anthropic.containerSettings.skills.docx",
  },
  {
    skill_id: "pdf",
    labelKey: "providers:anthropic.containerSettings.skills.pdf",
  },
] as const;

type AnthropicDefaultContainerSkillId =
  (typeof ANTHROPIC_DEFAULT_CONTAINER_SKILLS)[number]["skill_id"];

const getNormalizedAnthropicContainerSkills = (value: any) => {
  const seen = new Set<string>();

  return Array.isArray(value?.skills)
    ? value.skills
      .map((skill: any) => {
        const skillId =
          typeof skill?.skill_id === "string" ? skill.skill_id.trim() : "";
        const type = typeof skill?.type === "string" ? skill.type.trim() : "";
        const version =
          typeof skill?.version === "string" ? skill.version.trim() : undefined;

        if (!skillId || (type !== "anthropic" && type !== "custom")) {
          return undefined;
        }

        return {
          ...(skill ?? {}),
          skill_id: skillId,
          type,
          version: version || undefined,
        };
      })
      .filter((skill: any) => {
        if (!skill) return false;

        const key = `${skill.type}:${skill.skill_id}`;
        if (seen.has(key)) return false;

        seen.add(key);
        return true;
      })
    : [];
};

export const normalizeAnthropicContainer = (value: any) => {
  if (value === undefined || value === null || value === false) {
    return undefined;
  }

  const rawContainer =
    typeof value === "string"
      ? { id: value }
      : value && typeof value === "object" && !Array.isArray(value)
        ? value
        : {};

  const id = typeof rawContainer?.id === "string" ? rawContainer.id.trim() : "";
  const skills = getNormalizedAnthropicContainerSkills(rawContainer);

  return {
    ...(id ? { id } : {}),
    ...(skills.length ? { skills } : {}),
  };
};

const getAnthropicContainerCustomSkillIds = (value: any) =>
  getNormalizedAnthropicContainerSkills(normalizeAnthropicContainer(value)).reduce(
    (acc: string[], skill: any) =>
      skill?.type === "custom" ? [...acc, skill.skill_id] : acc,
    []
  );

const getAnthropicEnabledDefaultSkillIds = (
  value: any
): AnthropicDefaultContainerSkillId[] =>
  getNormalizedAnthropicContainerSkills(normalizeAnthropicContainer(value)).reduce(
    (acc: AnthropicDefaultContainerSkillId[], skill: any) => {
      if (
        skill?.type === "anthropic" &&
        !acc.includes(skill.skill_id as AnthropicDefaultContainerSkillId) &&
        ANTHROPIC_DEFAULT_CONTAINER_SKILLS.some(
          (item) => item.skill_id === skill.skill_id
        )
      ) {
        acc.push(skill.skill_id as AnthropicDefaultContainerSkillId);
      }

      return acc;
    },
    []
  );

const buildAnthropicContainerSkills = (
  customSkillIds: string[],
  enabledDefaultSkillIds: AnthropicDefaultContainerSkillId[]
) => {
  const nextSkills = [
    ...Array.from(new Set(customSkillIds.map((item) => item.trim()).filter(Boolean))).map(
      (skill_id) => ({
        skill_id,
        type: "custom" as const,
      })
    ),
    ...ANTHROPIC_DEFAULT_CONTAINER_SKILLS.filter((skill) =>
      enabledDefaultSkillIds.includes(skill.skill_id)
    ).map((skill) => ({
      skill_id: skill.skill_id,
      type: "anthropic" as const,
      version: "latest",
    })),
  ];

  return nextSkills.length ? nextSkills : undefined;
};

export const AnthropicContainerCard = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const containerOn = config?.container !== undefined && config?.container !== null;
  const container = normalizeAnthropicContainer(config?.container) ?? {};
  const customSkillIds = getAnthropicContainerCustomSkillIds(container);
  const enabledDefaultSkillIds = getAnthropicEnabledDefaultSkillIds(container);

  const updateContainer = (nextContainer: any) =>
    updateConfig({
      ...config,
      container: normalizeAnthropicContainer(nextContainer),
    });

  return (
    <theme.Card
      size="small"
      title={t("providers:anthropic.containerSettings.title")}
      headerActions={
        <theme.Switch
          id="anthropic-container"
          checked={containerOn}
          onChange={(checked: boolean) =>
            updateConfig({
              ...config,
              container: checked
                ? normalizeAnthropicContainer(config?.container ?? {})
                : undefined,
            })
          }
        />
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <theme.Input
          label={t("providers:anthropic.containerSettings.id")}
          placeholder={t("providers:anthropic.containerSettings.idPlaceholder")}
          disabled={!containerOn}
          value={container?.id ?? ""}
          onChange={(e: any) =>
            updateContainer({
              ...container,
              id: e.target.value,
            })
          }
        />

        <theme.Input
          label={t("providers:anthropic.containerSettings.customSkillIds")}
          placeholder={t("providers:anthropic.containerSettings.customSkillIdsPlaceholder")}
          disabled={!containerOn}
          value={formatAnthropicStringList(customSkillIds)}
          onChange={(e: any) =>
            updateContainer({
              ...container,
              skills: buildAnthropicContainerSkills(
                parseAnthropicStringList(e.target.value) ?? [],
                enabledDefaultSkillIds
              ),
            })
          }
        />

        <div
          style={{
            display: "inline-grid",
            gridTemplateColumns: "repeat(4, max-content)",
            width: "auto"
          }}
        >
          {ANTHROPIC_DEFAULT_CONTAINER_SKILLS.toSorted((a, b) =>
            t(a.labelKey).localeCompare(t(b.labelKey))
          ).map((skill) => (
            <theme.Switch
              key={`anthropic-container-skill-${skill.skill_id}`}
              id={`anthropic-container-skill-${skill.skill_id}`}
              label={t(skill.labelKey)}
              size="small"
              disabled={!containerOn}
              checked={enabledDefaultSkillIds.includes(skill.skill_id)}
              onChange={(checked: boolean) => {
                const nextEnabledDefaultSkillIds = checked
                  ? [...enabledDefaultSkillIds, skill.skill_id]
                  : enabledDefaultSkillIds.filter((value) => value !== skill.skill_id);

                updateContainer({
                  ...container,
                  skills: buildAnthropicContainerSkills(
                    customSkillIds,
                    nextEnabledDefaultSkillIds
                  ),
                });
              }}
            />
          ))}
        </div>
      </div>
    </theme.Card>
  );
};
