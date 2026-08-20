import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppStore } from "aihappey-state";
import { AuthorBadges, LimitedTextField, LocalToolsSettingsForm, PluginMetadataBadges, RegistryServerCard, VersionBadge, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { useLocalTools } from "aihappey-tools";
import { useSkills } from "aihappey-skills";
import { usePlugins } from "aihappey-plugins";
import { McpRegistryServerResponse } from "aihappey-types";
import { useAccount } from "aihappey-auth";
import { useDarkMode } from "usehooks-ts";
import { useDefaultRegistries } from "../../../../shell/connectors/useDefaultRegistries";
import { PROVIDERS } from "../../../../runtime/providers/providerMetadata";
import { ContextSearchGrid, contextTabTitle } from "./ContextSearchGrid";
import {
  allBuiltInPluginDefs,
  normalizeCatalogText,
} from "../../../tools/toolCatalogItems";

type ContextSearchTab = "tools" | "skills" | "plugins" | "catalog";

type Props = {
  open: boolean;
  onClose: (catalogInstallHappened: boolean) => void;
};

const keyOf = (name: string) => name.trim().toLowerCase();

const getProviderKeyFromSkillId = (skillId: string) => {
  const parts = skillId.split("/").filter(Boolean);
  return parts.length > 1 ? parts[0].toLowerCase() : null;
};

function ownerNames(server: McpRegistryServerResponse) {
  return Object.values(server?._meta ?? {})
    .flatMap((block: any) => (Array.isArray(block.authors) ? block.authors : []))
    .map((o: any) => o?.name)
    .filter(Boolean);
}

function matchesRegistryServer(server: McpRegistryServerResponse, search: string, ownerEmail?: string) {
  const q = normalizeCatalogText(search);
  if (!q) return true;
  const owners = Object.values(server?._meta ?? {})
    .flatMap((block: any) => (Array.isArray(block.authors) ? block.authors : []))
    .filter(Boolean);
  const hay = normalizeCatalogText([
    server?.server?.name,
    server?.server?.title,
    server?.server?.description,
    server?.server?.websiteUrl,
    ...(server?.server?.remotes ?? []).map((r: any) => r?.url),
    ...owners.map((o: any) => `${o?.name ?? ""} ${o?.email ?? ""}`),
    ownerEmail ?? "",
  ].join(" "));
  return hay.includes(q);
}

const CATALOG_PAGE_SIZE = 20;

export const ContextSearchModal = ({ open, onClose }: Props) => {
  const { Modal, Button, SearchBox, Tabs, Tab, Card, Switch, Badge, Image } = useTheme();
  const { t } = useTranslation();
  const account = useAccount();
  const getRegistries = useDefaultRegistries();
  const isDarkMode = useDarkMode();

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<ContextSearchTab>("tools");
  const [catalogInstallHappened, setCatalogInstallHappened] = useState(false);
  const [catalogVisibleCount, setCatalogVisibleCount] = useState(CATALOG_PAGE_SIZE);

  const activePlugins = useAppStore((s) => s.activePlugins);
  const setActivePlugins = useAppStore((s) => s.setActivePlugins);
  const enabledLocalTools = useAppStore((s) => (s as any).enabledLocalTools as string[]);
  const setEnabledLocalTools = useAppStore((s) => (s as any).setEnabledLocalTools as (names: string[]) => void);
  const enabledSkillIds = useAppStore((s) => s.enabledSkillIds);
  const setEnabledSkillIds = useAppStore((s) => s.setEnabledSkillIds);
  const favoriteSkillIds = useAppStore((s: any) => s.favoriteSkillIds as string[] | undefined);
  const enabledAgentPluginIds = useAppStore((s) => s.enabledAgentPluginIds);
  const setEnabledAgentPluginIds = useAppStore((s) => s.setEnabledAgentPluginIds);
  const mcpRegistries = useAppStore((s) => s.mcpRegistries);
  const mcpServers = useAppStore((s) => s.mcpServers);
  const addMcpServer = useAppStore((s) => s.addMcpServer);
  const removeMcpServer = useAppStore((s) => s.removeMcpServer);

  const localTools = useLocalTools();
  const skills = useSkills();
  const plugins = usePlugins();
  const [draftEnabledAgentPluginIds, setDraftEnabledAgentPluginIds] = useState<string[]>([]);

  const collator = useMemo(
    () => new Intl.Collator(undefined, { sensitivity: "base", numeric: true }),
    []
  );

  useEffect(() => {
    if (open && Object.keys(mcpRegistries ?? {}).length === 0) void getRegistries();
  }, [getRegistries, mcpRegistries, open]);

  useEffect(() => {
    if (!open) return;
    setCatalogInstallHappened(false);
    setCatalogVisibleCount(CATALOG_PAGE_SIZE);
    setDraftEnabledAgentPluginIds([...(enabledAgentPluginIds ?? [])]);
  }, [enabledAgentPluginIds, open]);

  useEffect(() => {
    setCatalogVisibleCount(CATALOG_PAGE_SIZE);
  }, [search]);

  const close = useCallback(() => {
    setEnabledAgentPluginIds(draftEnabledAgentPluginIds);
    setSearch("");
    setActiveTab("tools");
    onClose(catalogInstallHappened);
  }, [catalogInstallHappened, draftEnabledAgentPluginIds, onClose, setEnabledAgentPluginIds]);

  const q = normalizeCatalogText(search);

  const visibleToolToggles = useMemo(() => {
    const pluginItems = allBuiltInPluginDefs.map((def) => {
      const label = t("plugins." + def.name);
      const searchableTools = (def.tools ?? []).map((tool: any) => [
        tool.name,
        tool.title,
        tool.description,
        JSON.stringify(tool.inputSchema ?? {}),
      ].filter(Boolean).join(" ")).join(" ");
      return {
        id: `plugin:${def.name}`,
        rawId: def.name,
        label,
        kind: "plugin" as const,
        hay: normalizeCatalogText(`${def.name} ${label} ${searchableTools}`),
      };
    });

    const customToolItems = (localTools.items ?? []).map((tool: any) => {
      const label = tool.title || tool.id;
      return {
        id: `local:${tool.id}`,
        rawId: tool.id,
        label: `${label} · ${t("customTools")}`,
        kind: "local" as const,
        hay: normalizeCatalogText(`${tool.id} ${tool.title ?? ""} ${tool.description ?? ""} ${tool.execute ?? ""} ${t("customTools")}`),
      };
    });

    return [...pluginItems, ...customToolItems]
      .filter((item) => !q || item.hay.includes(q))
      .sort((a, b) => collator.compare(a.label, b.label));
  }, [collator, localTools.items, q, t]);

  const toolToggleValue = useMemo(() => [
    ...(activePlugins ?? []).map((id) => `plugin:${id}`),
    ...(enabledLocalTools ?? []).map((id) => `local:${id}`),
  ], [activePlugins, enabledLocalTools]);

  const handleToolToggleChange = (next: string[]) => {
    setActivePlugins(next.filter((id) => id.startsWith("plugin:")).map((id) => id.slice("plugin:".length)));
    setEnabledLocalTools(next.filter((id) => id.startsWith("local:")).map((id) => id.slice("local:".length)));
  };

  const skillItems = useMemo(
    () => (skills.items ?? []).map((item) => ({
      id: item.skillId,
      name: item.name,
      version: item.version,
      description: item.description,
      origin: item.origin,
    })).sort((a, b) => collator.compare(a.name, b.name)),
    [collator, skills.items]
  );
  const visibleSkills = useMemo(
    () => skillItems.filter((item) => !q || normalizeCatalogText(`${item.id} ${item.name} ${item.version ?? ""} ${item.description ?? ""} ${item.origin ?? ""}`).includes(q)),
    [q, skillItems]
  );

  const favoriteSkillSet = useMemo(() => new Set(favoriteSkillIds ?? []), [favoriteSkillIds]);
  const toggleArrayValue = (current: string[], id: string, checked: boolean) => {
    const list = Array.isArray(current) ? current : [];
    if (checked) return list.includes(id) ? list : [...list, id];
    return list.filter((item) => item !== id);
  };

  const handleSkillToggle = async (skillId: string, checked: boolean) => {
    const next = toggleArrayValue(enabledSkillIds ?? [], skillId, checked);
    setEnabledSkillIds(next);
    if (checked) {
      try {
        await skills.ensureDownloaded(skillId);
      } catch (err) {
        console.error("Failed to download enabled skill", err);
      }
    }
  };

  const visiblePlugins = useMemo(
    () => (plugins.items ?? [])
      .filter((plugin) => !q || normalizeCatalogText([
        plugin.id,
        plugin.name,
        plugin.description,
        plugin.version,
        plugin.author?.name,
        plugin.author?.email,
        ...(plugin.keywords ?? []),
      ].filter(Boolean).join(" ")).includes(q))
      .sort((a, b) => collator.compare(a.name, b.name)),
    [collator, plugins.items, q]
  );

  const handlePluginToggle = (pluginId: string, checked: boolean) => {
    setDraftEnabledAgentPluginIds((current) => toggleArrayValue(current, pluginId, checked));
  };

  const catalogServers = useMemo(
    () => Object.keys(mcpRegistries ?? {}).flatMap((key) => mcpRegistries[key] ?? []),
    [mcpRegistries]
  );
  const ownerEmail = account?.username?.toLowerCase();
  const visibleCatalogServers = useMemo(
    () => catalogServers
      .filter((server) => matchesRegistryServer(server, search, ownerEmail))
      .sort((a, b) => collator.compare(a.server.name, b.server.name)),
    [catalogServers, collator, ownerEmail, search]
  );

  const installedServerKeys = useMemo(() => Object.keys(mcpServers ?? {}), [mcpServers]);
  const serverExists = useCallback((server: McpRegistryServerResponse) => {
    const url = server.server.remotes?.find((a) => a.type === "streamable-http")?.url;
    return installedServerKeys
      .map((x) => x.toLowerCase())
      .some((k) => k === server.server.name.toLowerCase() || (!!url && k === url.toLowerCase()));
  }, [installedServerKeys]);

  const onInstall = (item: McpRegistryServerResponse) => {
    const key = keyOf(item.server.name);
    if (mcpServers[key]) return;
    const remote = item.server.remotes?.find((a) => a.type === "streamable-http");
    if (!remote?.url) return;
    addMcpServer(key, {
      config: {
        type: "http",
        url: remote.url,
        disabled: true,
      },
      registry: item,
    });
    setCatalogInstallHappened(true);
  };

  const onUninstall = (item: McpRegistryServerResponse) => {
    const key = keyOf(item.server.name);
    if (mcpServers[key]) removeMcpServer(key);
  };

  const visiblePagedCatalogServers = visibleCatalogServers.slice(0, catalogVisibleCount);
  const toolCount = visibleToolToggles.length;

  return (
    <Modal
      show={open}
      onHide={close}
      title={t("search") ?? "Search"}
      actions={<Button type="button" variant="secondary" onClick={close}>{t("close")}</Button>}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 320 }}>
        <SearchBox value={search} onChange={setSearch} placeholder={t("searchPlaceholder")} autoFocus />

        <Tabs activeKey={activeTab} onSelect={(k: any) => setActiveTab(k as ContextSearchTab)}>
          <Tab eventKey="tools" icon="tool" title={contextTabTitle(t("tools") ?? "Tools", toolCount)}>
            <div style={styles.tabContent}>
              {visibleToolToggles.length > 0 ? (
                <LocalToolsSettingsForm
                  formTitle={t("tools") ?? "Tools"}
                  items={visibleToolToggles}
                  value={toolToggleValue}
                  onChange={handleToolToggleChange}
                  columns={2}
                />
              ) : <div style={styles.empty}>{t("noResults")}</div>}
            </div>
          </Tab>

          <Tab eventKey="skills" icon="skills" title={contextTabTitle(t("skills") ?? "Skills", visibleSkills.length)}>
            <ContextSearchGrid empty={visibleSkills.length === 0}>
              {visibleSkills.map((skill) => {
                const providerKey = skill.origin === "remote" ? getProviderKeyFromSkillId(skill.id) : null;
                const providerIcons = providerKey ? PROVIDERS[providerKey]?.icons : undefined;
                const iconImage =
                  providerIcons?.find((icon) => icon.theme === (isDarkMode ? "dark" : "light"))?.src ??
                  providerIcons?.[0]?.src;
                const image = iconImage ? (
                  <Image height={32} title={skill.name} shape="square" src={iconImage} />
                ) : undefined;

                return (
                  <Card
                    key={skill.id}
                    title={<span style={{ overflowWrap: "anywhere" }}>{skill.name}</span>}
                    description={(
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        {skill.version ? (
                          <VersionBadge version={skill.version} />
                        ) : null}
                      </div>
                    )}
                    size="small"
                    image={image}
                    headerActions={
                      <Switch
                        id={`context-skill-${skill.id}`}
                        size="small"
                        checked={(enabledSkillIds ?? []).includes(skill.id)}
                        onChange={(checked: boolean) => void handleSkillToggle(skill.id, checked)}
                      />
                    }
                  >
                    {skill.description ? <LimitedTextField text={skill.description} rows={4} /> : null}
                  </Card>
                );
              })}
            </ContextSearchGrid>
          </Tab>

          <Tab eventKey="plugins" icon="plugins" title={contextTabTitle(t("pluginsPage.title") ?? "Plugins", visiblePlugins.length)}>
            <ContextSearchGrid empty={visiblePlugins.length === 0}>
              {visiblePlugins.map((plugin) => (
                <Card
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
                    <Switch
                      id={`context-agent-plugin-${plugin.id}`}
                      size="small"
                      checked={draftEnabledAgentPluginIds.includes(plugin.id)}
                      onChange={(checked: boolean) => handlePluginToggle(plugin.id, checked)}
                    />
                  )}
                >
                  <LimitedTextField text={plugin.description || (t("pluginsPage.noDescription") ?? "No description")} rows={4} />
                </Card>
              ))}
            </ContextSearchGrid>
          </Tab>

          <Tab eventKey="catalog" icon="mcpServer" title={contextTabTitle(t("serverSelectModal.title") ?? "Model Context", visibleCatalogServers.length)}>
            <div style={styles.catalogList}>
              {visibleCatalogServers.length === 0 ? (
                <div style={styles.empty}>{t("serverSelectModal.noServers") ?? t("noResults")}</div>
              ) : visiblePagedCatalogServers.map((server) => {
                const exists = serverExists(server);
                return (
                  <RegistryServerCard
                    key={server.server.name}
                    serverItem={server}
                    renderDescription={() => <AuthorBadges authors={ownerNames(server)} />}
                    onRemove={exists ? () => onUninstall(server) : undefined}
                    onInstall={!exists ? () => onInstall(server) : undefined}
                  />
                );
              })}
              {visibleCatalogServers.length > catalogVisibleCount ? (
                <div style={styles.showMoreRow}>
                  <Button
                    type="button"
                    variant="subtle"
                    onClick={() => setCatalogVisibleCount((count) => count + CATALOG_PAGE_SIZE)}
                  >
                    {t("showMore") ?? "Show more"}
                  </Button>
                </div>
              ) : null}
            </div>
          </Tab>
        </Tabs>
      </div>
    </Modal>
  );
};

const styles: Record<string, React.CSSProperties> = {
  tabContent: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    paddingTop: 12,
  },
  catalogList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    paddingTop: 12,
  },
  empty: {
    color: "#888",
    textAlign: "center",
    padding: 16,
  },
  showMoreRow: {
    display: "flex",
    justifyContent: "center",
    padding: 12,
  },
};

