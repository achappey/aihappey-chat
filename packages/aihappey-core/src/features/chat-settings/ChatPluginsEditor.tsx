import { useEffect, useMemo, useRef, useState } from "react";
import { LimitedTextField, PluginMetadataBadges, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import type { PluginCatalogItem } from "aihappey-plugins";
import { useIsDesktop } from "../../shell/responsive/useIsDesktop";

export function ChatPluginsEditor({
  items,
  value,
  onChange,
  disabledIds = [],
}: {
  items: PluginCatalogItem[];
  value: string[];
  onChange: (next: string[]) => void;
  disabledIds?: string[];
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const isDesktop = useIsDesktop();
  const searchRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const selected = useMemo(() => new Set(value), [value]);
  const disabled = useMemo(() => new Set(disabledIds), [disabledIds]);
  const query = search.trim().toLowerCase();
  const visible = useMemo(() => items
    .filter((item) => !query || `${item.name} ${item.description} ${item.keywords.join(" ")}`.toLowerCase().includes(query))
    .sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: "base", numeric: true })),
  [items, query]);

  useEffect(() => {
    if (!isDesktop) return;
    const frame = requestAnimationFrame(() => searchRef.current?.querySelector<HTMLInputElement>("input")?.focus());
    return () => cancelAnimationFrame(frame);
  }, [isDesktop]);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div ref={searchRef} style={{ width: 360, maxWidth: "100%" }}>
        <theme.SearchBox value={search} onChange={setSearch} placeholder={t("searchPlaceholder")} />
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {visible.length ? visible.map((plugin) => (
          <theme.Card
            key={plugin.id}
            title={<span style={{ overflowWrap: "anywhere" }}>{plugin.name}</span>}
            size="small"
            description={(
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <PluginMetadataBadges
                  version={plugin.version}
                  skillCount={plugin.skillCount}
                  mcpServerCount={plugin.mcpServerCount}
                />
              </div>
            )}
            headerActions={(
              <theme.Switch
                 id={`chat-agent-plugin-${plugin.id}`}
                 label=""
                 checked={selected.has(plugin.id)}
                 disabled={disabled.has(plugin.id)}
                 onChange={(checked: boolean) => onChange(checked
                  ? Array.from(new Set([...value, plugin.id]))
                  : value.filter((id) => id !== plugin.id))}
              />
            )}
          >
            <LimitedTextField text={plugin.description || (t("pluginsPage.noDescription") ?? "No description")} />
          </theme.Card>
        )) : <theme.Text>{t("noResults") ?? "No results"}</theme.Text>}
      </div>
    </div>
  );
}
