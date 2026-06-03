import { useMemo } from "react";
import { LocalToolsSettingsForm } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";

export type SkillToggleGroupItem = {
  id: string;
  label: string;
  description?: string;
  origin?: "local" | "remote";
};

export type SkillToggleGroupsProps = {
  value: string[];
  onChange: (next: string[]) => void;
  items: SkillToggleGroupItem[];
  favoriteSkillIds?: string[];
  remoteTitle: string;
  localTitle?: string;
  columns?: number;
};

const sortByLabel = <T extends { label: string }>(items: T[]) =>
  [...items].sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base", numeric: true }));

export const SkillToggleGroups = ({
  value,
  onChange,
  items,
  favoriteSkillIds = [],
  remoteTitle,
  localTitle,
  columns = 2,
}: SkillToggleGroupsProps) => {
  const { t } = useTranslation();

  const favoriteSet = useMemo(
    () => new Set((favoriteSkillIds ?? []).filter(Boolean)),
    [favoriteSkillIds]
  );

  const groups = useMemo(() => {
    const favoriteItems = sortByLabel(items.filter((item) => favoriteSet.has(item.id)));
    const remoteItems = sortByLabel(items.filter((item) => item.origin === "remote" && !favoriteSet.has(item.id)));
    const localItems = sortByLabel(items.filter((item) => item.origin === "local" && !favoriteSet.has(item.id)));

    return {
      favoriteItems,
      remoteItems,
      localItems,
    };
  }, [favoriteSet, items]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {groups.favoriteItems.length > 0 ? (
        <LocalToolsSettingsForm
          formTitle={t("favorites") ?? "Favorites"}
          value={value}
          onChange={onChange}
          columns={columns}
          items={groups.favoriteItems}
        />
      ) : null}

      {groups.localItems.length > 0 ? (
        <LocalToolsSettingsForm
          formTitle={localTitle ?? t("local") ?? "Local"}
          value={value}
          onChange={onChange}
          columns={columns}
          items={groups.localItems}
        />
      ) : null}

      {groups.remoteItems.length > 0 ? (
        <LocalToolsSettingsForm
          formTitle={remoteTitle}
          value={value}
          onChange={onChange}
          columns={columns}
          items={groups.remoteItems}
        />
      ) : null}
    </div>
  );
};
