import { useEffect, useMemo, useState } from "react";
import type { McpRegistryServerResponse } from "aihappey-types";
import { readClientExtension, type StoredPlugin, type StoredPluginFile } from "aihappey-plugins";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";
import { formatFileSize } from "../cards/formatFileSize";
import { LimitedTextField } from "../fields/LimitedTextField";
import { CapabilityIcon } from "../images";

export type PluginDetailsModalProps = {
  open: boolean;
  plugin?: StoredPlugin;
  mcpRegistryItems?: McpRegistryServerResponse[];
  extensionNamespace?: string;
  loading?: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDownload?: () => void;
};

function downloadFile(file: StoredPluginFile) {
  const url = URL.createObjectURL(file.data);
  try {
    const anchor = document.createElement("a"); anchor.href = url;
    anchor.download = file.path.split("/").pop() || file.path; anchor.click();
  } finally { URL.revokeObjectURL(url); }
}

export const PluginDetailsModal = ({ open, plugin, mcpRegistryItems = [], extensionNamespace, loading, onClose, onEdit, onDownload }: PluginDetailsModalProps) => {
  const { Modal, Button, Card, Badge, Tabs, Tab } = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("general");
  useEffect(() => { if (open) setActiveTab("general"); }, [open]);
  const servers = Object.entries(plugin?.mcp?.mcpServers ?? {});
  const registryIndex = useMemo(() => Object.fromEntries(mcpRegistryItems.map((item) => [item.server.name.toLowerCase(), item])), [mcpRegistryItems]);
  const extensionSettings = plugin ? readClientExtension(plugin.manifest, extensionNamespace)?.mcpServers ?? {} : {};
  const badgeRow = { display: "flex", gap: 8, flexWrap: "wrap" as const, alignItems: "center" };
  const grid = { display: "grid", gap: 12, paddingTop: 12 };

  return (
    <Modal show={open} onHide={onClose} title={plugin?.name ?? t("pluginsPage.detailsTitle")} size="large" actions={(
      <div style={{ display: "flex", gap: 8 }}>
        {onEdit ? <Button variant="primary" onClick={onEdit}>{t("pluginsPage.edit")}</Button> : null}
        {onDownload ? <Button variant="secondary" icon="download" onClick={onDownload}>{t("download")}</Button> : null}
        <Button variant="secondary" onClick={onClose}>{t("close")}</Button>
      </div>
    )}>
      {loading ? <div>{t("loading")}</div> : plugin ? (
        <Tabs activeKey={activeTab} onSelect={setActiveTab}>
          <Tab eventKey="general" title={t("general")}><div style={grid}>
            <Card title={plugin.name} description={<div style={badgeRow}>
              {plugin.manifest.version ? <Badge size="small" bg="subtle">v{plugin.manifest.version}</Badge> : null}
              <Badge size="small" bg="informative">{t("pluginsPage.skillCount", { count: plugin.skills.filter((skill) => skill.valid).length })}</Badge>
              <Badge size="small" bg="informative">{t("pluginsPage.serverCount", { count: servers.length })}</Badge>
              <Badge size="small" bg="subtle">{t("pluginsPage.fileCount", { count: plugin.files.length })}</Badge>
            </div>}>
              <div>{plugin.manifest.description || t("pluginsPage.noDescription")}</div>
            </Card>
          </div></Tab>
          <Tab eventKey="skills" title={t("skills")}><div style={grid}>
            {plugin.skills.length ? plugin.skills.map((skill) => <Card key={skill.entryPath} title={skill.name} description={<div style={badgeRow}><Badge size="small" bg="subtle">{t("pluginsPage.fileCount", { count: skill.fileCount })}</Badge>{!skill.valid ? <Badge size="small" bg="danger">{t("error")}</Badge> : null}</div>}><div>{skill.description || t("pluginsPage.noDescription")}</div></Card>) : <div style={{ color: "#888" }}>{t("noResults")}</div>}
          </div></Tab>
          <Tab eventKey="modelContext" title={t("mcpPage.title")}><div style={grid}>
            {servers.length ? servers.map(([name, server]) => {
              const settings = extensionSettings[name];
              const registryItem = registryIndex[name.toLowerCase()];
              const catalogDescription = registryItem?.server.description?.trim();
              return <Card
                key={name}
                title={registryItem?.server.title ?? registryItem?.server.name ?? name}
                image={registryItem ? <CapabilityIcon icons={registryItem.server.icons} /> : undefined}
                description={settings?.defer_loading || settings?.namespace ? <div style={badgeRow}>
                  {settings.defer_loading ? <Badge size="small" appearance="neutral">{t("toolConfiguration.deferLoading")}</Badge> : null}
                  {settings.namespace ? <Badge size="small" appearance="neutral">{t("toolConfiguration.namespace")}</Badge> : null}
                </div> : undefined}
              >
                <div style={{ display: "grid", gap: 6 }}>
                  {catalogDescription ? <LimitedTextField text={catalogDescription} /> : null}
                  <span>{server.type === "stdio" ? server.command : server.url}</span>
                  {settings?.allowed_callers?.length ? <span>{t("toolConfiguration.allowedCallers")}: {settings.allowed_callers.join(", ")}</span> : null}
                  {server.type !== "streamable-http" ? <span style={{ color: "#888" }}>{t("pluginsPage.unsupportedPreserved")}</span> : null}
                </div>
              </Card>;
            }) : <div style={{ color: "#888" }}>{t("noResults")}</div>}
          </div></Tab>
          <Tab eventKey="files" title={t("files")}><div style={grid}>
            {plugin.files.length ? plugin.files.slice().sort((a, b) => a.path.localeCompare(b.path)).map((file) => <Card key={file.path} title={file.path} description={formatFileSize(file.size)} actions={<Button icon="download" size="small" variant="transparent" title={t("download")} onClick={() => downloadFile(file)} />} />) : <div style={{ color: "#888" }}>{t("noResults")}</div>}
          </div></Tab>
          {plugin.diagnostics.length ? <Tab eventKey="diagnostics" title={t("pluginsPage.diagnostics")}><div style={grid}>
            {plugin.diagnostics.map((item, index) => <Card key={`${item.code}-${index}`} title={item.code} description={<Badge size="small" bg={item.severity === "error" ? "danger" : item.severity === "warning" ? "warning" : "informative"}>{item.severity}</Badge>}><div>{item.message}{item.path ? ` (${item.path})` : ""}</div></Card>)}
          </div></Tab> : null}
        </Tabs>
      ) : <div style={{ color: "#888" }}>{t("noResults")}</div>}
    </Modal>
  );
};
