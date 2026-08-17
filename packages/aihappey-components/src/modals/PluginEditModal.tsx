import { useEffect, useMemo, useRef, useState } from "react";
import type { McpRegistryServerResponse, ServerClientConfig } from "aihappey-types";
import type {
  PluginManifest,
  PluginMcpServer,
  PluginServerExtension,
  StoredPlugin,
  StoredPluginFile,
} from "aihappey-plugins";
import { PLUGIN_NAME_PATTERN, PLUGIN_SCHEMA_URL } from "aihappey-plugins";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";
import { formatFileSize } from "../cards/formatFileSize";
import { LimitedTextField } from "../fields/LimitedTextField";
import { ServerManagement } from "../forms/model-context/ServerManagement";

export type PluginSkillOption = {
  id: string;
  label: string;
  description?: string;
  favorite?: boolean;
  iconUrl?: string;
};

export type PluginMcpOption = {
  id: string;
  label: string;
  config: ServerClientConfig;
  registry?: McpRegistryServerResponse;
};

export type PluginEditModalValues = {
  manifest: PluginManifest;
  files: StoredPluginFile[];
  mcpServers: Record<string, PluginMcpServer>;
  selectedSkillIds: string[];
  selectedMcpIds: string[];
  serverSettings: Record<string, PluginServerExtension>;
};

export type PluginEditModalProps = {
  open: boolean;
  mode: "create" | "edit";
  plugin?: StoredPlugin;
  skillOptions: PluginSkillOption[];
  mcpOptions: PluginMcpOption[];
  initialSelectedSkillIds?: string[];
  initialSelectedMcpIds?: string[];
  extensionNamespace?: string;
  initialServerSettings?: Record<string, PluginServerExtension>;
  saving?: boolean;
  error?: string | null;
  onOpenMcpCatalog?: () => void;
  onRemoveMcpServer?: (id: string) => void;
  onClose: () => void;
  onSave: (values: PluginEditModalValues) => void | Promise<void>;
};

function inputValue(value: any) { return value?.target?.value ?? value ?? ""; }
function toggleValue(id: string, values: string[]) { return values.includes(id) ? values.filter((item) => item !== id) : [...values, id]; }
function uploadPath(file: File) {
  return String((file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name)
    .replace(/\\/g, "/").replace(/^\/+/, "").split("/").filter((part) => part && part !== "." && part !== "..").join("/");
}
function downloadFile(file: StoredPluginFile) {
  const url = URL.createObjectURL(file.data);
  try {
    const anchor = document.createElement("a"); anchor.href = url;
    anchor.download = file.path.split("/").pop() || file.path; anchor.click();
  } finally { URL.revokeObjectURL(url); }
}

export const PluginEditModal = ({
  open, mode, plugin, skillOptions, mcpOptions, initialSelectedSkillIds = [], initialSelectedMcpIds = [],
  extensionNamespace, initialServerSettings, saving, error, onOpenMcpCatalog, onRemoveMcpServer, onClose, onSave,
}: PluginEditModalProps) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const fileInput = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("general");
  const [name, setName] = useState("");
  const [version, setVersion] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<StoredPluginFile[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [selectedMcpIds, setSelectedMcpIds] = useState<string[]>([]);
  const [serverSettings, setServerSettings] = useState<Record<string, PluginServerExtension>>({});
  const [skillSearch, setSkillSearch] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!open) return;
    setActiveTab("general"); setName(plugin?.manifest.name ?? ""); setVersion(plugin?.manifest.version ?? "");
    setDescription(plugin?.manifest.description ?? ""); setFiles(plugin?.files ?? []);
    setSelectedSkillIds(initialSelectedSkillIds); setSelectedMcpIds(initialSelectedMcpIds);
    setServerSettings(initialServerSettings ?? {}); setSkillSearch(""); setIsDragging(false);
  }, [initialSelectedMcpIds, initialSelectedSkillIds, initialServerSettings, open, plugin]);

  useEffect(() => {
    if (!open) return;
    const ids = mcpOptions.map((option) => option.id);
    setSelectedMcpIds(ids);
    if (extensionNamespace) {
    setServerSettings((current) => {
        const next = { ...current };
        mcpOptions.forEach((option) => {
          if (!next[option.id] && typeof option.config.disabled === "boolean") next[option.id] = { disabled: option.config.disabled };
        });
        return next;
      });
    }
  }, [extensionNamespace, mcpOptions, open]);

  const normalizedName = name.trim().toLowerCase();
  const canSave = !saving && normalizedName.length <= 64 && PLUGIN_NAME_PATTERN.test(normalizedName);
  const sortedFiles = useMemo(() => files.slice().sort((a, b) => a.path.localeCompare(b.path)), [files]);
  const query = skillSearch.trim().toLowerCase();
  const visibleSkills = useMemo(() => skillOptions
    .filter((item) => !query || `${item.label} ${item.description ?? ""}`.toLowerCase().includes(query))
    .sort((a, b) => Number(!!b.favorite) - Number(!!a.favorite) || a.label.localeCompare(b.label)), [query, skillOptions]);
  const serverItems = useMemo(() => Object.fromEntries(mcpOptions.map((option) => [option.id, { config: option.config, registry: option.registry }])), [mcpOptions]);

  const addFiles = (uploads: File[]) => setFiles((current) => {
    const next = new Map(current.map((file) => [file.path.toLowerCase(), file]));
    uploads.forEach((upload) => {
      const path = uploadPath(upload);
      if (path && path !== "plugin.json" && path !== "mcp.json") next.set(path.toLowerCase(), { path, data: upload, size: upload.size, mediaType: upload.type || undefined });
    });
    return Array.from(next.values());
  });

  const updateSetting = (id: string, patch: Partial<PluginServerExtension>) => setServerSettings((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  const renderServerSettings = (id: string) => {
    const option = mcpOptions.find((item) => item.id === id);
    if (!extensionNamespace || (serverSettings[id]?.disabled ?? option?.config.disabled ?? false)) return null;
    const callers = serverSettings[id]?.allowed_callers ?? [];
    const callerOptions: Array<"direct" | "programmatic"> = ["direct", "programmatic"];
    return (
      <div style={{ display: "grid", gridTemplateColumns: "minmax(180px, 1fr) auto", alignItems: "end", gap: 16, marginTop: 16 }}>
        <theme.Select
          label={t("toolConfiguration.allowedCallers")}
          multiselect
          values={callers}
          valueTitle={callers.length ? callers.map((caller) => t(`providers:openai.programmaticToolCalling.allowedCallersOptions.${caller}`)).join(", ") : ""}
          onChange={(caller: "direct" | "programmatic") => updateSetting(id, {
            allowed_callers: toggleValue(caller, callers) as Array<"direct" | "programmatic">,
          })}
        >
          {callerOptions.map((caller) => (
            <option key={caller} value={caller}>{t(`providers:openai.programmaticToolCalling.allowedCallersOptions.${caller}`)}</option>
          ))}
        </theme.Select>
        <theme.Switch
          id={`plugin-defer-${id}`}
          label={t("toolConfiguration.deferLoading")}
          checked={serverSettings[id]?.defer_loading === true}
          onChange={(checked: boolean) => updateSetting(id, { defer_loading: checked })}
        />
      </div>
    );
  };

  const buildManifest = (): PluginManifest => {
    const { version: _oldVersion, description: _oldDescription, ...preserved } = plugin?.manifest ?? { $schema: PLUGIN_SCHEMA_URL, name: normalizedName };
    return { ...preserved, $schema: PLUGIN_SCHEMA_URL, name: normalizedName, ...(version.trim() ? { version: version.trim() } : {}), ...(description.trim() ? { description: description.trim() } : {}) };
  };

  return (
    <theme.Modal show={open} onHide={onClose} title={mode === "create" ? t("pluginsPage.editor.newTitle") : plugin?.name ?? "New plugin"} size="large" actions={(
      <div style={{ display: "flex", gap: 8 }}>
        <theme.Button variant="primary" disabled={!canSave} onClick={() => void onSave({ manifest: buildManifest(), files, mcpServers: plugin?.mcp?.mcpServers ?? {}, selectedSkillIds, selectedMcpIds, serverSettings })}>{saving ? t("saving") : t("save")}</theme.Button>
        <theme.Button variant="secondary" disabled={!!saving} onClick={onClose}>{t("close")}</theme.Button>
      </div>
    )}>
      {error ? <div style={{ color: "#c00", marginBottom: 12 }}>{error}</div> : null}
      <theme.Tabs activeKey={activeTab} onSelect={setActiveTab}>
        <theme.Tab eventKey="general" title={t("general")}><div style={{ display: "grid", gap: 12, paddingTop: 12 }}>
          <theme.Input label={t("name")} value={name} disabled={mode === "edit"} onChange={(value: any) => setName(inputValue(value))} />
          <theme.Input label={t("pluginsPage.editor.version")} value={version} onChange={(value: any) => setVersion(inputValue(value))} />
          <theme.TextArea label={t("description")} value={description} rows={5} onChange={(value: any) => setDescription(inputValue(value))} />
        </div></theme.Tab>
        <theme.Tab eventKey="skills" title={t("skills")}><div style={{ display: "grid", gap: 18, paddingTop: 12 }}>
          <div style={{ width: 360, maxWidth: "100%" }}><theme.SearchBox value={skillSearch} onChange={setSkillSearch} placeholder={t("searchPlaceholder")} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 330px), 1fr))", gap: 12 }}>
            {visibleSkills.map((option) => (
              <theme.Card key={option.id} title={<span style={{ overflowWrap: "anywhere" }}>{option.label}</span>} size="small" image={option.iconUrl ? <theme.Image height={32} title={option.label} shape="square" src={option.iconUrl} /> : undefined} headerActions={<theme.Switch id={`plugin-skill-${option.id}`} label="" checked={selectedSkillIds.includes(option.id)} onChange={() => setSelectedSkillIds((current) => toggleValue(option.id, current))} />}>
                <LimitedTextField text={option.description?.trim() || t("agentSkills.noDescription")} />
              </theme.Card>
            ))}
          </div>
          {!visibleSkills.length ? <theme.Text>{t("noResults")}</theme.Text> : null}
        </div></theme.Tab>
        <theme.Tab eventKey="modelContext" title={t("mcpPage.title")}><div style={{ display: "grid", gap: 12, paddingTop: 12 }}>
          <ServerManagement
            enabled={new Set(mcpOptions.filter((option) => !(serverSettings[option.id]?.disabled ?? option.config.disabled ?? false)).map((option) => option.id))}
            onToggle={(id) => {
              if (!extensionNamespace) return;
              const option = mcpOptions.find((item) => item.id === id);
              updateSetting(id, { disabled: !(serverSettings[id]?.disabled ?? option?.config.disabled ?? false) });
            }}
            onRemove={onRemoveMcpServer}
            mcpServers={serverItems}
            renderServerSettings={renderServerSettings}
          />
          {onOpenMcpCatalog ? <div><theme.Button icon="catalog" variant="subtle" onClick={onOpenMcpCatalog}>{t("manageServersModal.catalog")}</theme.Button></div> : null}
          {!extensionNamespace ? <theme.Text>{t("pluginsPage.editor.noExtensionNamespace")}</theme.Text> : null}
        </div></theme.Tab>
        <theme.Tab eventKey="files" title={t("files")}><div style={{ display: "grid", gap: 12, paddingTop: 12 }}>
          <input ref={fileInput} type="file" multiple style={{ display: "none" }} onChange={(event) => { addFiles(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
          <div style={{ border: `2px dashed ${isDragging ? "currentColor" : "rgba(127,127,127,.45)"}`, borderRadius: 8, padding: 24, textAlign: "center" }} onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setIsDragging(false)} onDrop={(event) => { event.preventDefault(); setIsDragging(false); addFiles(Array.from(event.dataTransfer.files)); }}>
            <div style={{ marginBottom: 8 }}>{t("skillsPage.editor.dropFiles")}</div>
            <theme.Button variant="secondary" onClick={() => fileInput.current?.click()}>{t("skillsPage.editor.chooseFiles")}</theme.Button>
          </div>
          {sortedFiles.length ? sortedFiles.map((file) => <theme.Card key={file.path} title={file.path} description={formatFileSize(file.size)} actions={<div style={{ display: "flex", gap: 4 }}><theme.Button icon="download" size="small" variant="transparent" title={t("download")} onClick={() => downloadFile(file)} /><theme.Button icon="delete" size="small" variant="transparent" title={t("delete")} onClick={() => setFiles((items) => items.filter((item) => item.path !== file.path))} /></div>} />) : <theme.Card title={t("files")}><div style={{ color: "#888" }}>{t("noResults")}</div></theme.Card>}
        </div></theme.Tab>
      </theme.Tabs>
    </theme.Modal>
  );
};
