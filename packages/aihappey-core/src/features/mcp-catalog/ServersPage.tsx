import { useState, useMemo, useEffect } from "react";
import { useAppStore } from "aihappey-state";
import { RegistryServerCard, StickyHeaderActionBar, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { AddServerModal } from "../mcp-servers/AddServerModal";
import { EditServerModal } from "../mcp-servers/EditServerModal";
import { OverviewPageHeader } from "../../ui/layout/OverviewPageHeader";
import { useDefaultRegistries } from "../../shell/connectors/useDefaultRegistries";
import { useIsDesktop } from "../../shell/responsive/useIsDesktop";

type EntryView = {
  displayName: string;
  cfg: any;
  canRemove: boolean;
  storeName?: string;
};

// --- Helpers -----------------------------------------------------------------

/** Extract the last path segment as a readable name. */
function lastSegment(url: string): string {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || u.hostname;
  } catch {
    const parts = url?.split("/").filter(Boolean);
    return parts[parts.length - 1] || url;
  }
}

// --- Component ---------------------------------------------------------------

export const ServersPage = () => {
  const { SearchBox, Text, Tabs, Tab } = useTheme();
  const { t } = useTranslation();

  const mcpRegistries = useAppStore((s) => s.mcpRegistries);
  const mcpServers = useAppStore((s) => s.mcpServers);
  const removeMcpServer = useAppStore((s) => s.removeMcpServer);
  const servers = Object.keys(mcpRegistries).flatMap(z => mcpRegistries[z]);
  const addMcpServer = useAppStore((s) => s.addMcpServer);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [editingName, setEditingName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  const handleEdit = (name: string) => setEditingName(name);
  const handleHideEdit = () => setEditingName(null);
  const getRegistries = useDefaultRegistries()
  const isDesktop = useIsDesktop()

  useEffect(() => {
    getRegistries();
  }, []);

  const normalizedSearch = search.trim().toLowerCase();


  const allEntries = useMemo<EntryView[]>(() => {
    return servers
      .filter((server) => server.server.name.toLowerCase().includes(normalizedSearch)
        || (server.server.description ?? "")?.toLowerCase().includes(normalizedSearch))
      .sort((a, b) => a.server.name.localeCompare(b.server.name)) // sort servers by name
      .map((server) => ({
        displayName: server.server.name,
        cfg: server,
        canRemove: true,
        storeName: server.server.name,
      }));
  }, [servers, normalizedSearch]);

  const registryUrls = useMemo(
    () => Object.keys(mcpRegistries ?? {}).sort(),
    [mcpRegistries]
  );

  function hostnameOf(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return lastSegment(url);
    }
  }


  function toEntries(list: any[]): EntryView[] {
    return (list ?? [])
      .filter(
        (server) =>
          server.server.name.toLowerCase().includes(normalizedSearch) ||
          (server.server.description ?? "").toLowerCase().includes(normalizedSearch)
      )
      .sort((a, b) => a.server.name.localeCompare(b.server.name))
      .map((server) => ({
        displayName: server.server.name,
        cfg: server,
        canRemove: true,
        storeName: server.server.name,
      }));
  }

  const registryTabs = useMemo(() => {
    return registryUrls.map((registryUrl) => ({
      registryUrl,
      title: hostnameOf(registryUrl),
      entries: toEntries(mcpRegistries[registryUrl] ?? []),
    }));
  }, [registryUrls, mcpRegistries, normalizedSearch]);

  const allVisibleEntries = useMemo(
    () => allEntries,
    [allEntries]
  );

  const renderGrid = (entries: EntryView[]) => {
    const visibleItems = entries;

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isDesktop ? "repeat(2, minmax(0, 1fr))" : "1fr",
          gap: 16,
          width: "100%",
          maxWidth: 700,
          marginBottom: 24,
          justifyItems: "center",
        }}
      >
        {visibleItems.length === 0 ? (
          <div
            style={{ color: "#888", gridColumn: "1 / -1", textAlign: "center" }}
          >
            {t("serverSelectModal.noServers")}
          </div>
        ) : (
          visibleItems.map(({ displayName, cfg, canRemove, storeName }) => {
            //   (cfg as McpRegistryServerResponse).server.name
            const remote = cfg.server.remotes?.find((a: any) => a.type == "streamable-http");

            const onInstall = mcpServers[cfg.server.name.toLowerCase()] ?
              undefined : () => {
                addMcpServer(cfg.server.name.toLowerCase(), {
                  config: {
                    type: "http",
                    url: cfg.server.remotes?.find((a: any) => a.type == "streamable-http")?.url!,
                    disabled: true
                  },
                  registry: cfg
                })
              }

            return (
              <div key={displayName}
                style={{
                  width: "100%"
                }}>

                <RegistryServerCard serverItem={cfg}
                  onInstall={onInstall}
                  onRemove={mcpServers[cfg.server.name.toLowerCase()]
                    ? () => removeMcpServer(cfg.server.name)
                    : undefined} />
              </div>
            )
          })
        )}
      </div>
    )
  };

  return (
    <>
      <StickyHeaderActionBar
        actionLabel={t("manageServersModal.add")}
        onAction={() => setShowModal(true)}
      />
      <div style={{ background: "transparent" }}>
        <div
          style={{
            width: 700,
            maxWidth: "100%",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            paddingLeft: 8,
            paddingRight: 8,
            boxSizing: "border-box",
            alignItems: "center",
          }}
        >
          <OverviewPageHeader
            title={t("mcpPage.title")}
            officialUrl={"https://modelcontextprotocol.io/"}
            docsUrl={"https://github.com/modelcontextprotocol"}
          />

          <Text as="p" align={"center" }>
            {t("mcpPage.description")}
          </Text>

          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <div style={{ width: 360, maxWidth: "100%" }}>
              <SearchBox
                value={search}
                onChange={setSearch}
                placeholder={t("searchPlaceholder")}
              />
            </div>
          </div>

          <Tabs activeKey={activeTab} onSelect={(k: string) => setActiveTab(k)}>
            <Tab
              eventKey="all"
              icon="cardList"
              title={t("all") + " (" + allVisibleEntries.length + ")"}
            >
              <div style={{ paddingTop: 12 }}>{renderGrid(allVisibleEntries)}</div>
            </Tab>

            {registryTabs.map((rt) => (
              <Tab
                key={rt.registryUrl}
                eventKey={`reg:${rt.registryUrl}`}
                title={rt.title + " (" + rt.entries.length + ")"}
              >
                <div style={{ paddingTop: 12 }}>{renderGrid(rt.entries)}</div>
              </Tab>
            ))}
          </Tabs>

          <AddServerModal show={showModal} onHide={() => setShowModal(false)} />
          {editingName && (
            <EditServerModal
              show={!!editingName}
              onHide={handleHideEdit}
              name={editingName}
            />
          )}
        </div>
      </div>
    </>
  );
};
