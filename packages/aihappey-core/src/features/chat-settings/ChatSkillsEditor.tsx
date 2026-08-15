import { useEffect, useMemo, useRef, useState } from "react";
import { LimitedTextField, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import type { SkillCatalogItem } from "aihappey-skills";
import { useDarkMode } from "usehooks-ts";
import { PROVIDERS } from "../../runtime/providers/providerMetadata";
import { useIsDesktop } from "../../shell/responsive/useIsDesktop";

type ChatSkillsEditorProps = {
  items: SkillCatalogItem[];
  favoriteSkillIds: string[];
  value: string[];
  remoteTitle: string;
  onChange: (next: string[]) => void;
};

const normalizeText = (value: unknown) => String(value ?? "").trim().toLowerCase();

const sortSkills = (items: SkillCatalogItem[]) => [...items].sort((left, right) =>
  left.name.localeCompare(right.name, undefined, { sensitivity: "base", numeric: true })
);

const getProviderKeyFromSkillId = (skillId: string) => {
  const parts = skillId.split("/").filter(Boolean);
  return parts.length > 1 ? parts[0].toLowerCase() : null;
};

export const ChatSkillsEditor = ({
  items,
  favoriteSkillIds,
  value,
  remoteTitle,
  onChange,
}: ChatSkillsEditorProps) => {
  const { Card, Image, SearchBox, Switch, Text } = useTheme();
  const { t } = useTranslation();
  const isDarkMode = useDarkMode();
  const isDesktop = useIsDesktop();
  const searchBoxContainerRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const query = normalizeText(search);
  const enabledSet = useMemo(() => new Set(value), [value]);
  const favoriteSet = useMemo(() => new Set(favoriteSkillIds), [favoriteSkillIds]);

  useEffect(() => {
    if (!isDesktop) return;

    const frame = window.requestAnimationFrame(() => {
      searchBoxContainerRef.current?.querySelector<HTMLInputElement>("input")?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isDesktop]);

  const groups = useMemo(() => {
    const filteredItems = query
      ? items.filter((item) => normalizeText(`${item.name} ${item.description}`).includes(query))
      : items;

    return {
      favorites: sortSkills(filteredItems.filter((item) => favoriteSet.has(item.skillId))),
      local: sortSkills(filteredItems.filter(
        (item) => item.origin === "local" && !favoriteSet.has(item.skillId)
      )),
      remote: sortSkills(filteredItems.filter(
        (item) => item.origin === "remote" && !favoriteSet.has(item.skillId)
      )),
    };
  }, [favoriteSet, items, query]);

  const renderSkillCard = (item: SkillCatalogItem) => {
    const providerKey = item.origin === "remote" ? getProviderKeyFromSkillId(item.skillId) : null;
    const providerIcons = providerKey ? PROVIDERS[providerKey]?.icons : undefined;
    const iconImage =
      providerIcons?.find((icon) => icon.theme === (isDarkMode ? "dark" : "light"))?.src ??
      providerIcons?.[0]?.src;
    const image = iconImage ? (
      <Image height={32} title={item.name} shape="square" src={iconImage} />
    ) : undefined;
    const enabled = enabledSet.has(item.skillId);

    return (
      <Card
        key={item.skillId}
        title={<span style={{ overflowWrap: "anywhere" }}>{item.name}</span>}
        size="small"
        image={image}
        headerActions={
          <Switch
            id={`chat-skill-${item.skillId}`}
            label=""
            checked={enabled}
            onChange={(checked: boolean) => {
              onChange(
                checked
                  ? Array.from(new Set([...value, item.skillId]))
                  : value.filter((skillId) => skillId !== item.skillId)
              );
            }}
          />
        }
      >
        <LimitedTextField
          text={item.description?.trim() || (t("agentSkills.noDescription") ?? "No description available.")}
        />
      </Card>
    );
  };

  const renderSection = (title: string, groupItems: SkillCatalogItem[]) => (
    <section style={{ display: "grid", gap: 12 }}>
      <Text><strong>{title}</strong></Text>
      {groupItems.length > 0 ? (
        <div style={{ display: "grid", gap: 12 }}>
          {groupItems.map(renderSkillCard)}
        </div>
      ) : (
        <Text>{t("noResults") ?? "No results"}</Text>
      )}
    </section>
  );

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div ref={searchBoxContainerRef} style={{ width: 360, maxWidth: "100%" }}>
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder={t("searchPlaceholder")}
        />
      </div>
      {groups.favorites.length > 0
        ? renderSection(t("favorites") ?? "Favorites", groups.favorites)
        : null}
      {groups.local.length > 0
        ? renderSection(t("local") ?? "Local", groups.local)
        : null}
      {renderSection(remoteTitle, groups.remote)}
    </div>
  );
};
