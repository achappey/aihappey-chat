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
  const { Card, Select, Switch, ToggleButton, Text } = useTheme();
  const { t } = useTranslation();
  const favoriteSet = useMemo(() => new Set(favoriteSkillIds), [favoriteSkillIds]);
  const disabledSet = useMemo(() => new Set(disabledSkillIds), [disabledSkillIds]);
  const [versionsBySkillId, setVersionsBySkillId] = useState<Record<string, string[]>>({});
  const [versionErrors, setVersionErrors] = useState<Record<string, boolean>>({});

  const groups = useMemo(() => ({
    favorites: sortSkills(items.filter((item) => favoriteSet.has(item.skillId))),
    other: sortSkills(items.filter((item) => !favoriteSet.has(item.skillId))),
  }), [favoriteSet, items]);

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

  const renderRow = (item: SkillCatalogItem) => {
    const value = values[item.skillId] ?? {
      enabled: false,
      mode: item.origin === "remote" ? "reference" : "inline",
      version: item.origin === "remote" ? AGENT_SKILL_LATEST_VERSION : AGENT_SKILL_DEFAULT_VERSION,
    };
    const disabled = disabledSet.has(item.skillId);
    const concreteVersions = versionsBySkillId[item.skillId] ?? [];
    const versionOptions = [
      { value: AGENT_SKILL_DEFAULT_VERSION, label: t("default") ?? "Default" },
      { value: AGENT_SKILL_LATEST_VERSION, label: t("latest") ?? "Latest" },
      ...concreteVersions.map((version) => ({ value: version, label: version })),
    ].filter((option, index, all) => all.findIndex((candidate) => candidate.value === option.value) === index);
    const currentVersion = value.version || AGENT_SKILL_DEFAULT_VERSION;

    return (
      <div
        key={item.skillId}
        style={{
          display: "grid",
          gridTemplateColumns: "auto minmax(180px, 1fr) 190px minmax(150px, 190px)",
          alignItems: "center",
          gap: 12,
          minHeight: 44,
        }}
      >
        <Switch
          id={`agent-skill-${item.skillId}`}
          label=""
          checked={value.enabled}
          disabled={disabled}
          onChange={(checked: boolean) => onToggle(item.skillId, checked)}
        />
        <Text>{item.name}</Text>
        <div style={{ display: "flex", gap: 6, visibility: item.origin === "remote" ? "visible" : "hidden" }}>
          <ToggleButton
            size="small"
            variant="subtle"
            checked={value.mode === "inline"}
            disabled={!value.enabled || disabled}
            onClick={() => onModeChange(item.skillId, "inline")}
          >
            Inline
          </ToggleButton>
          <ToggleButton
            size="small"
            variant="subtle"
            checked={value.mode === "reference"}
            disabled={!value.enabled || disabled}
            onClick={() => onModeChange(item.skillId, "reference")}
          >
            Reference
          </ToggleButton>
        </div>
        {value.enabled ? (
          <Select
            aria-label={`${item.name} ${t("version") ?? "Version"}`}
            values={[currentVersion]}
            valueTitle={versionOptions.find((option) => option.value === currentVersion)?.label ?? currentVersion}
            disabled={disabled}
            onChange={(version: string) => onVersionChange(item.skillId, String(version))}
          >
            {versionOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
        ) : <div />}
      </div>
    );
  };

  const renderCard = (title: string, groupItems: SkillCatalogItem[]) => (
    <Card title={title}>
      {groupItems.length > 0 ? (
        <div style={{ display: "grid", gap: 6 }}>{groupItems.map(renderRow)}</div>
      ) : (
        <Text>{t("noResults") ?? "No results"}</Text>
      )}
    </Card>
  );

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {renderCard(t("favorites") ?? "Favorites", groups.favorites)}
      {renderCard(t("skills") ?? "Skills", groups.other)}
    </div>
  );
};
