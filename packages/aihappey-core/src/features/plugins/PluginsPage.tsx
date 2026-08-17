import { useCallback, useMemo, useState } from "react";
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
import { OverviewPageHeader } from "../../ui/layout/OverviewPageHeader";
import { useIsDesktop } from "../../shell/responsive/useIsDesktop";
import { ServerCatalogModal } from "../mcp-catalog/ServerCatalogModal";

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
  const plugins = usePlugins();
  const skills = useSkills();
  const favoriteSkillIds = useAppStore((state: any) => (state.favoriteSkillIds ?? []) as string[]);
  const mcpRegistries = useAppStore((state) => state.mcpRegistries);
  const mcpRegistryItems = useMemo(() => Object.values(mcpRegistries).flat(), [mcpRegistries]);
  const [search, setSearch] = useState("");
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

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return plugins.items.filter((item) => !query || `${item.name} ${item.description} ${item.keywords.join(" ")}`.toLowerCase().includes(query));
  }, [plugins.items, search]);

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
      setFeedback(editorMode === "edit" ? t("pluginsPage.saved") : t("pluginsPage.created"));
      setEditorMode(null); setEditorPlugin(undefined);
    } catch (cause) {
      setEditorError(cause instanceof Error ? cause.message : t("pluginsPage.saveFailed"));
    } finally { setSaving(false); }
  }, [draftMcpOptions, editorMode, editorPlugin, plugins, snapshotSkill, t]);

  const initialServerSettings = useMemo(
    () => editorPlugin ? readClientExtension(editorPlugin.manifest, plugins.extensionNamespace)?.mcpServers : undefined,
    [editorPlugin, plugins.extensionNamespace]
  );

  return (
    <div
      onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => { event.preventDefault(); setDragging(false); void importArchives(Array.from(event.dataTransfer.files)); }}
      style={{ minHeight: "100%", border: dragging ? "2px dotted #888" : "2px solid transparent", boxSizing: "border-box" }}
    >
      <StickyHeaderActionBar actionLabel={t("add")} onAction={() => { setEditorPlugin(undefined); setEditorMcpFromPlugin(undefined); setEditorError(null); setEditorMode("create"); }} />
      <div style={{ width: 760, maxWidth: "100%", margin: "0 auto", padding: isDesktop ? 0 : 12, boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <OverviewPageHeader title={t("pluginsPage.title")} officialUrl="https://agent-plugins.org/" docsUrl="https://agent-plugins.org/specification" />
        <theme.Text as="p" align="center">{t("pluginsPage.description")}</theme.Text>
        {feedback ? <div style={{ width: "100%", textAlign: "center", marginBottom: 12 }}>{feedback}</div> : null}
        <div style={{ display: "flex", justifyContent: "center", width: "100%", marginBottom: 16 }}>
          <div style={{ width: 360, maxWidth: "100%" }}><theme.SearchBox value={search} onChange={setSearch} placeholder={t("searchPlaceholder")} autoFocus={isDesktop} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(2, minmax(0, 1fr))" : "1fr", gap: 16, width: "100%", marginBottom: 24 }}>
          {filtered.length ? filtered.map((plugin) => (
            <PluginCard
              key={plugin.id}
              plugin={plugin}
              onView={() => void openDetails(plugin.id)}
              onDownload={() => void downloadPlugin(plugin.id)}
              onDelete={() => void plugins.delete(plugin.id)}
            />
          )) : <div style={{ color: "#888", gridColumn: "1 / -1", textAlign: "center" }}>{t("noResults")}</div>}
        </div>
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
