import { useEffect, useMemo, useState } from "react";
import { useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import type { SkillCatalogItem, SkillVersion } from "aihappey-skills";
import {
  AGENT_SKILL_DEFAULT_VERSION,
  AGENT_SKILL_LATEST_VERSION,
} from "./agentSkills";

export type AgentSkillMode = "inline" | "reference";

export type AgentSkillEditorValue = {
  enabled: boolean;
  mode: AgentSkillMode;
  version: string;
};

type AgentSkillsEditorProps = {
  items: SkillCatalogItem[];
  favoriteSkillIds: string[];
  values: Record<string, AgentSkillEditorValue>;
  disabledSkillIds?: string[];
  listVersions: (skillId: string) => Promise<{ data: SkillVersion[] }>;
  onToggle: (skillId: string, enabled: boolean) => void;
  onModeChange: (skillId: string, mode: AgentSkillMode) => void;
  onVersionChange: (skillId: string, version: string) => void;
};

const sortSkills = (items: SkillCatalogItem[]) => [...items].sort((left, right) =>
  left.name.localeCompare(right.name, undefined, { sensitivity: "base", numeric: true })
);

const normalizeText = (value: unknown) => String(value ?? "").trim().toLowerCase();

export const AgentSkillsEditor = ({
  items,
  favoriteSkillIds,
  values,
  disabledSkillIds = [],
  listVersions,
  onToggle,
  onModeChange,
  onVersionChange,
}: AgentSkillsEditorProps) => {
  const { Card, SearchBox, Select, Switch, ToggleButton, Text } = useTheme();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const favoriteSet = useMemo(() => new Set(favoriteSkillIds), [favoriteSkillIds]);
  const disabledSet = useMemo(() => new Set(disabledSkillIds), [disabledSkillIds]);
  const [versionsBySkillId, setVersionsBySkillId] = useState<Record<string, string[]>>({});
  const [versionErrors, setVersionErrors] = useState<Record<string, boolean>>({});
  const query = normalizeText(search);

  const groups = useMemo(() => {
    const filteredItems = query
      ? items.filter((item) => normalizeText(`${item.name} ${item.description}`).includes(query))
      : items;

    return {
      favorites: sortSkills(filteredItems.filter((item) => favoriteSet.has(item.skillId))),
      other: sortSkills(filteredItems.filter((item) => !favoriteSet.has(item.skillId))),
    };
  }, [favoriteSet, items, query]);

  useEffect(() => {
    let cancelled = false;
    const enabledItems = items.filter((item) => values[item.skillId]?.enabled);

    void Promise.all(enabledItems.map(async (item) => {
      if (versionsBySkillId[item.skillId] || versionErrors[item.skillId]) return;
      try {
        const page = await listVersions(item.skillId);
        if (cancelled) return;
        const versions = Array.from(new Set(page.data.map((entry) => entry.version).filter(Boolean)));
        setVersionsBySkillId((current) => ({ ...current, [item.skillId]: versions }));
      } catch {
        if (!cancelled) setVersionErrors((current) => ({ ...current, [item.skillId]: true }));
      }
    }));

    return () => { cancelled = true; };
  }, [items, listVersions, values, versionErrors, versionsBySkillId]);

  const renderSkillCard = (item: SkillCatalogItem) => {
    const value = values[item.skillId] ?? {
      enabled: false,
      mode: item.origin === "remote" ? "reference" : "inline",
      version: item.origin === "remote" ? AGENT_SKILL_LATEST_VERSION : AGENT_SKILL_DEFAULT_VERSION,
    };
    const disabled = disabledSet.has(item.skillId);
    const concreteVersions = versionsBySkillId[item.skillId] ?? [];
    const versionOptions = [
      { value: AGENT_SKILL_DEFAULT_VERSION, label: t("default") ?? "Default" },
      { value: AGENT_SKILL_LATEST_VERSION, label: t("agentSkills.latest") ?? "Latest" },
      ...concreteVersions.map((version) => ({ value: version, label: version })),
    ].filter((option, index, all) => all.findIndex((candidate) => candidate.value === option.value) === index);
    const currentVersion = value.version || AGENT_SKILL_DEFAULT_VERSION;
    const enableSwitch = (
      <Switch
        id={`agent-skill-${item.skillId}`}
        label=""
        checked={value.enabled}
        disabled={disabled}
        onChange={(checked: boolean) => onToggle(item.skillId, checked)}
      />
    );

    return (
      <Card
        key={item.skillId}
        title={<span style={{ overflowWrap: "anywhere" }}>{item.name}</span>}
        size="small"
        headerActions={enableSwitch}
      >
        {value.enabled ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, width: "100%" }}>
            {item.origin === "remote" ? (
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <ToggleButton
                  size="small"
                  variant="subtle"
                  icon="attachment"
                  checked={value.mode === "inline"}
                  disabled={disabled}
                  aria-label={t("agentSkills.inlineTooltip") ?? "Skill as attachment"}
                  title={t("agentSkills.inlineTooltip") ?? "Skill as attachment"}
                  onClick={() => onModeChange(item.skillId, "inline")}
                />
                <ToggleButton
                  size="small"
                  variant="subtle"
                  icon="link"
                  checked={value.mode === "reference"}
                  disabled={disabled}
                  aria-label={t("agentSkills.referenceTooltip") ?? "Download Skill from the catalog"}
                  title={t("agentSkills.referenceTooltip") ?? "Download Skill from the catalog"}
                  onClick={() => onModeChange(item.skillId, "reference")}
                />
              </div>
            ) : null}
            <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
              <Select
                aria-label={`${item.name} ${t("version") ?? "Version"}`}
                values={[currentVersion]}
                valueTitle={versionOptions.find((option) => option.value === currentVersion)?.label ?? currentVersion}
                disabled={disabled}
                style={{ width: "100%", maxWidth: "100%", minWidth: 0 }}
                onChange={(version: string) => onVersionChange(item.skillId, String(version))}
              >
                {versionOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
            </div>
          </div>
        ) : null}
      </Card>
    );
  };

  const renderSection = (title: string, groupItems: SkillCatalogItem[]) => (
    <section style={{ display: "grid", gap: 12 }}>
      <Text><strong>{title}</strong></Text>
      {groupItems.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 330px), 1fr))", gap: 12 }}>
          {groupItems.map(renderSkillCard)}
        </div>
      ) : (
        <Text>{t("noResults") ?? "No results"}</Text>
      )}
    </section>
  );

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div style={{ width: 360, maxWidth: "100%" }}>
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder={t("searchPlaceholder")}
        />
      </div>
      {groups.favorites.length > 0
        ? renderSection(t("favorites") ?? "Favorites", groups.favorites)
        : null}
      {renderSection(t("skills") ?? "Skills", groups.other)}
    </div>
  );
};
