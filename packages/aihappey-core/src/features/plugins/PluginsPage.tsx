import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  PluginCard,
  PluginDetailsModal,
  PluginEditModal,
  StickyHeaderActionBar,
  useTheme,
  type PluginEditModalValues,
} from "aihappey-components";
import {
  readClientExtension,
  usePlugins,
  writeClientExtension,
  type PluginDraft,
  type PluginMcpServer,
  type PluginServerExtension,
  type StoredPlugin,
  type StoredPluginFile,
} from "aihappey-plugins";
import { useSkills } from "aihappey-skills";
import { useAppStore } from "aihappey-state";
import { useTranslation } from "aihappey-i18n";
import { useAccount } from "aihappey-auth";
import { OverviewPageHeader } from "../../ui/layout/OverviewPageHeader";
import { useIsDesktop } from "../../shell/responsive/useIsDesktop";
import { ServerCatalogModal } from "../mcp-catalog/ServerCatalogModal";
import { useChatContext } from "../chat/context/ChatContext";

const PLUGIN_ALL_FILTER_VALUE = "__ALL__";
const CONTENT_MAX_WIDTH = 760;

type PluginFilterSelections = {
  selectedKeywords: string[];
  selectedAuthors: string[];
};

type PluginFilterFacet = "keyword" | "author";

type PluginAuthor = {
  name?: string;
  email?: string;
};

const normalizeFilterValue = (value?: string) => value?.trim().toLowerCase() ?? "";

const getAuthorKey = (author?: PluginAuthor) =>
  normalizeFilterValue(author?.email) || normalizeFilterValue(author?.name);

const getAuthorLabel = (author?: PluginAuthor) =>
  author?.name?.trim() || author?.email?.trim() || "";

const isAllFilterSelected = (selected: string[]) =>
  selected.includes(PLUGIN_ALL_FILTER_VALUE);

const sameSelection = (a: string[], b: string[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

const togglePluginMultiSelectValue = (current: string[], value: string) => {
  if (value === PLUGIN_ALL_FILTER_VALUE) return [PLUGIN_ALL_FILTER_VALUE];

  const active = isAllFilterSelected(current) ? [] : current;
  const next = active.includes(value)
    ? active.filter((item) => item !== value)
    : [...active, value];

  return next.length > 0 ? next : [PLUGIN_ALL_FILTER_VALUE];
};

const keepAvailableSelection = (
  selected: string[],
  options: string[],
  counts: Record<string, number>
) => {
  if (isAllFilterSelected(selected)) return selected;

  const optionSet = new Set(options);
  const next = selected.filter(
    (value) => optionSet.has(value) && (counts[value] ?? 0) > 0
  );

  return next.length > 0 ? next : [PLUGIN_ALL_FILTER_VALUE];
};

const getMultiSelectValueTitle = (
  selected: string[],
  labelsByValue: Map<string, string>,
  allLabel: string
) => {
  if (isAllFilterSelected(selected)) return allLabel;
  return selected.map((value) => labelsByValue.get(value) ?? value).join(", ");
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
  } finally { URL.revokeObjectURL(url); }
}

export const PluginsPage = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const isDesktop = useIsDesktop();
  const account = useAccount();
  const chat = useChatContext();
  const hasAuthenticatedAuthorIdentity = chat.config.getAccessToken != null;
  const plugins = usePlugins();
  const skills = useSkills();
  const favoriteSkillIds = useAppStore((state: any) => (state.favoriteSkillIds ?? []) as string[]);
  const favoritePluginIds = useAppStore((state) => state.favoritePluginIds);
  const toggleFavoritePlugin = useAppStore((state) => state.toggleFavoritePlugin);
  const setFavoritePluginIds = useAppStore((state) => state.setFavoritePluginIds);
  const mcpRegistries = useAppStore((state) => state.mcpRegistries);
  const mcpRegistryItems = useMemo(() => Object.values(mcpRegistries).flat(), [mcpRegistries]);
  const [search, setSearch] = useState("");
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([PLUGIN_ALL_FILTER_VALUE]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([PLUGIN_ALL_FILTER_VALUE]);
  const [activeTab, setActiveTab] = useState("all");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [details, setDetails] = useState<StoredPlugin | undefined>();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit" | null>(null);
  const [editorPlugin, setEditorPlugin] = useState<StoredPlugin | undefined>();
  const [saving, setSaving] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [showMcpCatalog, setShowMcpCatalog] = useState(false);
  const [draftMcpOptions, setDraftMcpOptions] = useState<Array<{
    id: string;
    label: string;
    config: { type: "http" | "sse"; url: string; headers?: Record<string, string> };
    registry?: any;
  }>>([]);

  const collator = useMemo(
    () => new Intl.Collator(undefined, { sensitivity: "base", numeric: true }),
    []
  );

  const keywordOptions = useMemo(() => {
    const labelsByValue = new Map<string, string>();
    plugins.items.forEach((item) => {
      item.keywords.forEach((keyword) => {
        const label = keyword.trim();
        const value = normalizeFilterValue(label);
        if (value && !labelsByValue.has(value)) labelsByValue.set(value, label);
      });
    });

    return Array.from(labelsByValue, ([value, label]) => ({ value, label }))
      .sort((a, b) => collator.compare(a.label, b.label));
  }, [collator, plugins.items]);

  const authorOptions = useMemo(() => {
    const labelsByValue = new Map<string, string>();
    plugins.items.forEach((item) => {
      const value = getAuthorKey(item.author);
      const label = getAuthorLabel(item.author);
      if (value && label && !labelsByValue.has(value)) labelsByValue.set(value, label);
    });

    return Array.from(labelsByValue, ([value, label]) => ({ value, label }))
      .sort((a, b) => collator.compare(a.label, b.label));
  }, [collator, plugins.items]);

  const currentSelections = useMemo<PluginFilterSelections>(() => ({
    selectedKeywords,
    selectedAuthors,
  }), [selectedAuthors, selectedKeywords]);

  const normalizedSearch = useMemo(() => search.trim().toLowerCase(), [search]);

  const pluginMatchesFilters = useCallback((
    item: (typeof plugins.items)[number],
    selections: PluginFilterSelections,
    omittedFacet?: PluginFilterFacet,
    includeSearch = true
  ) => {
    const haystack = `${item.name} ${item.description} ${item.keywords.join(" ")}`.toLowerCase();
    const matchesSearch = !includeSearch || !normalizedSearch || haystack.includes(normalizedSearch);

    const keywordValues = new Set(item.keywords.map(normalizeFilterValue).filter(Boolean));
    const matchesKeywords =
      omittedFacet === "keyword" ||
      isAllFilterSelected(selections.selectedKeywords) ||
      selections.selectedKeywords.every((keyword) => keywordValues.has(keyword));

    const authorKey = getAuthorKey(item.author);
    const matchesAuthor =
      omittedFacet === "author" ||
      isAllFilterSelected(selections.selectedAuthors) ||
      (!!authorKey && selections.selectedAuthors.includes(authorKey));

    return matchesSearch && matchesKeywords && matchesAuthor;
  }, [normalizedSearch, plugins.items]);

  const countPlugins = useCallback((
    selections: PluginFilterSelections,
    omittedFacet?: PluginFilterFacet,
    includeSearch = true
  ) => plugins.items.reduce(
    (count, item) => count + (pluginMatchesFilters(item, selections, omittedFacet, includeSearch) ? 1 : 0),
    0
  ), [pluginMatchesFilters, plugins.items]);

  const keywordCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const activeKeywords = isAllFilterSelected(selectedKeywords) ? [] : selectedKeywords;

    keywordOptions.forEach(({ value }) => {
      const nextKeywords = activeKeywords.includes(value)
        ? activeKeywords
        : [...activeKeywords, value];
      counts[value] = countPlugins({
        ...currentSelections,
        selectedKeywords: nextKeywords.length > 0 ? nextKeywords : [PLUGIN_ALL_FILTER_VALUE],
      });
    });

    return counts;
  }, [countPlugins, currentSelections, keywordOptions, selectedKeywords]);

  const authorCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    authorOptions.forEach(({ value }) => {
      counts[value] = countPlugins({
        ...currentSelections,
        selectedAuthors: [value],
      });
    });
    return counts;
  }, [authorOptions, countPlugins, currentSelections]);

  const cleanupCounts = useMemo(() => {
    const keywords: Record<string, number> = {};
    const activeKeywords = isAllFilterSelected(selectedKeywords) ? [] : selectedKeywords;
    keywordOptions.forEach(({ value }) => {
      const nextKeywords = activeKeywords.includes(value)
        ? activeKeywords
        : [...activeKeywords, value];
      keywords[value] = countPlugins({
        ...currentSelections,
        selectedKeywords: nextKeywords.length > 0 ? nextKeywords : [PLUGIN_ALL_FILTER_VALUE],
      }, undefined, false);
    });

    const authors: Record<string, number> = {};
    authorOptions.forEach(({ value }) => {
      authors[value] = countPlugins({
        ...currentSelections,
        selectedAuthors: [value],
      }, undefined, false);
    });

    return { keywords, authors };
  }, [authorOptions, countPlugins, currentSelections, keywordOptions, selectedKeywords]);

  const filtered = useMemo(
    () => plugins.items.filter((item) => pluginMatchesFilters(item, currentSelections)),
    [currentSelections, pluginMatchesFilters, plugins.items]
  );

  useEffect(() => {
    setSelectedKeywords((current) => {
      const next = keepAvailableSelection(
        current,
        keywordOptions.map(({ value }) => value),
        cleanupCounts.keywords
      );
      return sameSelection(current, next) ? current : next;
    });

    setSelectedAuthors((current) => {
      const next = keepAvailableSelection(
        current,
        authorOptions.map(({ value }) => value),
        cleanupCounts.authors
      );
      return sameSelection(current, next) ? current : next;
    });
  }, [authorOptions, cleanupCounts, keywordOptions]);

  const favoritePluginSet = useMemo(
    () => new Set((favoritePluginIds ?? []).filter(Boolean)),
    [favoritePluginIds]
  );

  const favoriteFiltered = useMemo(
    () => filtered.filter((plugin) => favoritePluginSet.has(plugin.id)),
    [favoritePluginSet, filtered]
  );

  const skillOptions = useMemo(() => {
    const catalog = skills.items.map((item) => ({
    id: item.skillId,
    label: item.name,
    description: item.description,
    favorite: favoriteSkillIds.includes(item.skillId),
  }));
    const embedded = (editorPlugin?.skills ?? [])
      .filter((skill) => !catalog.some((item) => item.label === skill.name))
      .map((skill) => ({ id: `embedded:${skill.directory}`, label: skill.name, description: skill.description, favorite: false }));
    return [...catalog, ...embedded].sort((a, b) => a.label.localeCompare(b.label));
  }, [editorPlugin?.skills, favoriteSkillIds, skills.items]);

  const initialSelectedSkillIds = useMemo(() => (editorPlugin?.skills ?? []).map((skill) =>
    skills.items.find((item) => item.name === skill.name)?.skillId ?? `embedded:${skill.directory}`
  ), [editorPlugin?.skills, skills.items]);
  const initialSelectedMcpIds = useMemo(() => draftMcpOptions.map((item) => item.id), [draftMcpOptions]);

  const setEditorMcpFromPlugin = useCallback((plugin?: StoredPlugin) => {
    const registryIndex = mcpRegistryItems.reduce<Record<string, any>>((index, item) => {
      index[item.server.name.toLowerCase()] = item;
      return index;
    }, {});
    setDraftMcpOptions(Object.entries(plugin?.mcp?.mcpServers ?? {}).flatMap(([id, server]) => {
      if (server.type === "stdio") return [];
      return [{
        id,
        label: id,
        config: { type: server.type === "sse" ? "sse" as const : "http" as const, url: server.url, headers: server.headers },
        registry: registryIndex[id.toLowerCase()],
      }];
    }));
  }, [mcpRegistryItems]);

  const openDetails = useCallback(async (id: string) => {
    setDetailsOpen(true); setDetailsLoading(true);
    try { setDetails(await plugins.read(id)); }
    finally { setDetailsLoading(false); }
  }, [plugins]);

  const downloadPlugin = useCallback(async (id: string) => {
    const archive = await plugins.exportArchive(id);
    if (archive) downloadBlob(archive.blob, archive.filename);
  }, [plugins]);

  const deletePlugin = useCallback(async (id: string) => {
    await plugins.delete(id);
    setFavoritePluginIds((favoritePluginIds ?? []).filter((pluginId) => pluginId !== id));
  }, [favoritePluginIds, plugins, setFavoritePluginIds]);

  const importArchives = useCallback(async (files: File[]) => {
    const archives = files.filter((file) => file.name.toLowerCase().endsWith(".zip"));
    if (!archives.length) { setFeedback(t("pluginsPage.importZipOnly")); return; }
    let imported = 0;
    const messages: string[] = [];
    for (const archive of archives) {
      const result = await plugins.importArchive(archive);
      if (result.imported.length) imported += result.imported.length;
      else if (result.diagnostics[0]?.message) messages.push(result.diagnostics[0].message);
    }
    setFeedback(imported ? t("pluginsPage.imported", { count: imported }) : messages[0] || t("pluginsPage.importFailed"));
  }, [plugins, t]);

  const snapshotSkill = useCallback(async (skillId: string): Promise<StoredPluginFile[]> => {
    if (skillId.startsWith("embedded:")) {
      const directory = skillId.slice("embedded:".length);
      return (editorPlugin?.files ?? []).filter((file) => file.path.startsWith(`skills/${directory}/`));
    }
    const stored = await skills.ensureDownloaded(skillId);
    if (!stored) throw new Error(t("pluginsPage.editor.skillSnapshotFailed", { skill: skillId }));
    return stored.files.map((file) => ({
      path: `skills/${stored.name}/${file.path}`,
      data: file.data,
      size: file.size,
      mediaType: file.data.type || undefined,
    }));
  }, [editorPlugin?.files, skills, t]);

  const savePlugin = useCallback(async (values: PluginEditModalValues) => {
    setSaving(true); setEditorError(null);
    try {
      const selectedSkillFiles = (await Promise.all(values.selectedSkillIds.map(snapshotSkill))).flat();
      const files = [
        ...values.files.filter((file) => !file.path.startsWith("skills/")),
        ...selectedSkillFiles,
      ];
      const mcpServers: Record<string, PluginMcpServer> = Object.fromEntries(Object.entries(values.mcpServers).filter(([, server]) => server.type === "stdio"));
      const extensionSettings: Record<string, PluginServerExtension> = { ...values.serverSettings };
      for (const id of values.selectedMcpIds) {
        const source = draftMcpOptions.find((item) => item.id === id);
        if (!source) continue;
        mcpServers[id] = {
          type: source.config.type === "sse" ? "sse" : "streamable-http",
          url: source.config.url,
          ...(source.config.headers ? { headers: source.config.headers } : {}),
        };
      }
      const manifest = writeClientExtension(values.manifest, plugins.extensionNamespace, extensionSettings);
      const draft: PluginDraft = { manifest, files, ...(Object.keys(mcpServers).length ? { mcpServers } : {}) };
      if (editorMode === "edit" && editorPlugin) await plugins.update(editorPlugin.id, draft);
      else await plugins.create(draft);
      setEditorMode(null); setEditorPlugin(undefined);
    } catch (cause) {
      setEditorError(cause instanceof Error ? cause.message : t("pluginsPage.saveFailed"));
    } finally { setSaving(false); }
  }, [draftMcpOptions, editorMode, editorPlugin, plugins, snapshotSkill, t]);

  const initialServerSettings = useMemo(
    () => editorPlugin ? readClientExtension(editorPlugin.manifest, plugins.extensionNamespace)?.mcpServers : undefined,
    [editorPlugin, plugins.extensionNamespace]
  );

  const renderGrid = (items: typeof filtered) => (
    <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(2, minmax(0, 1fr))" : "1fr", gap: 16, width: "100%", marginBottom: 24 }}>
      {items.length ? items.map((plugin) => (
        <PluginCard
          key={plugin.id}
          plugin={plugin}
          onView={() => void openDetails(plugin.id)}
          onDownload={() => void downloadPlugin(plugin.id)}
          onDelete={() => void deletePlugin(plugin.id)}
          isFavorite={favoritePluginSet.has(plugin.id)}
          onToggleFavorite={() => toggleFavoritePlugin(plugin.id)}
        />
      )) : <div style={{ color: "#888", gridColumn: "1 / -1", textAlign: "center" }}>{t("noResults")}</div>}
    </div>
  );

  const SelectComponent = theme.Select || "select";
  const keywordLabelsByValue = new Map(keywordOptions.map(({ value, label }) => [value, label]));
  const authorLabelsByValue = new Map(authorOptions.map(({ value, label }) => [value, label]));
  const resolveSelectionValue = (event: ChangeEvent<HTMLSelectElement> | any) =>
    event?.target?.value ?? event?.currentTarget?.value ?? event;
  const formatCountedLabel = (label: string, count?: number) =>
    typeof count === "number" ? `${label} (${count})` : label;

  return (
    <div
      onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => { event.preventDefault(); setDragging(false); void importArchives(Array.from(event.dataTransfer.files)); }}
      style={{ minHeight: "100%", border: dragging ? "2px dotted #888" : "2px solid transparent", boxSizing: "border-box" }}
    >
      <StickyHeaderActionBar actionLabel={t("add")} onAction={() => { setEditorPlugin(undefined); setEditorMcpFromPlugin(undefined); setEditorError(null); setEditorMode("create"); }} />
      <div style={{ width: CONTENT_MAX_WIDTH, maxWidth: "100%", margin: "0 auto", padding: isDesktop ? 0 : 12, boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <OverviewPageHeader title={t("pluginsPage.title")} officialUrl="https://agent-plugins.org/" docsUrl="https://agent-plugins.org/specification" />
            <theme.Text as="p" align="center">{t("pluginsPage.description")}</theme.Text>
            {feedback ? <div style={{ width: "100%", textAlign: "center", marginBottom: 12 }}>{feedback}</div> : null}
            <div style={{ width: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
              <div style={{ flex: "1 1 280px", minWidth: 240, maxWidth: 360 }}>
                <theme.SearchBox value={search} onChange={setSearch} placeholder={t("searchPlaceholder")} autoFocus={isDesktop} />
              </div>
              <div style={{ width: 180, maxWidth: "100%" }}>
                <SelectComponent
                  values={selectedKeywords}
                  multiselect={true}
                  size="small"
                  label={t("pluginsPage.editor.keywords")}
                  valueTitle={getMultiSelectValueTitle(selectedKeywords, keywordLabelsByValue, t("all"))}
                  onChange={(event: ChangeEvent<HTMLSelectElement> | any) => {
                    const value = resolveSelectionValue(event);
                    if (typeof value !== "string") return;
                    if (value !== PLUGIN_ALL_FILTER_VALUE && (keywordCounts[value] ?? 0) === 0 && !selectedKeywords.includes(value)) return;
                    setSelectedKeywords((current) => togglePluginMultiSelectValue(current, value));
                  }}
                  aria-label="Plugin keyword filter"
                >
                  <option value={PLUGIN_ALL_FILTER_VALUE}>{t("all")}</option>
                  {keywordOptions.map(({ value, label }) => (
                    <option key={value} value={value} disabled={(keywordCounts[value] ?? 0) === 0 && !selectedKeywords.includes(value)}>
                      {formatCountedLabel(label, keywordCounts[value])}
                    </option>
                  ))}
                </SelectComponent>
              </div>
              <div style={{ width: 180, maxWidth: "100%" }}>
                <SelectComponent
                  values={selectedAuthors}
                  multiselect={true}
                  size="small"
                  label={t("pluginsPage.editor.author")}
                  valueTitle={getMultiSelectValueTitle(selectedAuthors, authorLabelsByValue, t("all"))}
                  onChange={(event: ChangeEvent<HTMLSelectElement> | any) => {
                    const value = resolveSelectionValue(event);
                    if (typeof value !== "string") return;
                    if (value !== PLUGIN_ALL_FILTER_VALUE && (authorCounts[value] ?? 0) === 0 && !selectedAuthors.includes(value)) return;
                    setSelectedAuthors((current) => togglePluginMultiSelectValue(current, value));
                  }}
                  aria-label="Plugin author filter"
                >
                  <option value={PLUGIN_ALL_FILTER_VALUE}>{t("all")}</option>
                  {authorOptions.map(({ value, label }) => (
                    <option key={value} value={value} disabled={(authorCounts[value] ?? 0) === 0 && !selectedAuthors.includes(value)}>
                      {formatCountedLabel(label, authorCounts[value])}
                    </option>
                  ))}
                </SelectComponent>
              </div>
            </div>
            <theme.Tabs activeKey={activeTab} onSelect={setActiveTab}>
              <theme.Tab eventKey="all" icon="cardList" title={`${t("all")} (${filtered.length})`}>
                <div style={{ paddingTop: 12 }}>{renderGrid(filtered)}</div>
              </theme.Tab>
              <theme.Tab eventKey="favorites" icon="starFilled" title={`${t("favorites")} (${favoriteFiltered.length})`}>
                <div style={{ paddingTop: 12 }}>{renderGrid(favoriteFiltered)}</div>
              </theme.Tab>
            </theme.Tabs>
            <PluginDetailsModal
              open={detailsOpen}
              plugin={details}
              mcpRegistryItems={mcpRegistryItems}
              loading={detailsLoading}
              extensionNamespace={plugins.extensionNamespace}
              onClose={() => { setDetailsOpen(false); setDetails(undefined); }}
              onDownload={details ? () => void downloadPlugin(details.id) : undefined}
              onEdit={details ? () => { setEditorPlugin(details); setEditorMcpFromPlugin(details); setEditorError(null); setEditorMode("edit"); setDetailsOpen(false); } : undefined}
            />
            <PluginEditModal
              open={editorMode !== null}
              mode={editorMode ?? "create"}
              plugin={editorPlugin}
              skillOptions={skillOptions}
              mcpOptions={draftMcpOptions}
              initialSelectedSkillIds={initialSelectedSkillIds}
              initialSelectedMcpIds={initialSelectedMcpIds}
              extensionNamespace={plugins.extensionNamespace}
              initialServerSettings={initialServerSettings}
              authorIdentityName={hasAuthenticatedAuthorIdentity ? account?.name : undefined}
              authorIdentityEmail={hasAuthenticatedAuthorIdentity ? account?.username : undefined}
              authorIdentityReadOnly={hasAuthenticatedAuthorIdentity}
              saving={saving}
              error={editorError}
              onOpenMcpCatalog={() => setShowMcpCatalog(true)}
              onRemoveMcpServer={(id) => setDraftMcpOptions((current) => current.filter((item) => item.id !== id))}
              onClose={() => { if (!saving) { setEditorMode(null); setEditorPlugin(undefined); setEditorError(null); } }}
              onSave={savePlugin}
            />
            <ServerCatalogModal
              show={showMcpCatalog}
              onHide={() => setShowMcpCatalog(false)}
              installedServerKeys={draftMcpOptions.map((item) => item.id)}
              addMcpServer={(item) => {
                const remote = item.server.remotes?.find((entry) => entry.type === "streamable-http") ?? item.server.remotes?.find((entry) => entry.type === "sse");
                if (!remote) return;
                const id = item.server.name.toLowerCase();
                setDraftMcpOptions((current) => current.some((entry) => entry.id === id) ? current : [...current, {
                  id,
                  label: item.server.title || item.server.name,
                  config: { type: remote.type === "sse" ? "sse" : "http", url: remote.url },
                  registry: item,
                }]);
              }}
              removeMcpServer={(item) => setDraftMcpOptions((current) => current.filter((entry) => entry.id !== item.server.name.toLowerCase()))}
            />
      </div>
    </div>
  );
};
