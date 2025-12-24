import { useState, useMemo, useEffect } from "react";
import { useAppStore } from "aihappey-state";
import { RegistryServerCard, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { ServersHeader } from "./ServersHeader";
import { AddServerModal } from "../mcp-servers/AddServerModal";
import { EditServerModal } from "../mcp-servers/EditServerModal";
import { OverviewPageHeader } from "../../ui/layout/OverviewPageHeader";
import { useDefaultRegistries } from "../../shell/connectors/useDefaultRegistries";
import { serverStats } from "../../runtime/chat-app/serverStats";

type RankingItem = { url?: string; type?: string; score?: number };

type EntryView = {
  displayName: string;
  cfg: any;
  canRemove: boolean;
  storeName?: string;
};
type RankingStatsShape =
  | string[]
  | {
    order?: string[];
    servers?: string[];
    byName?: Record<string, RankingItem>;
  }
  | Record<string, RankingItem>;

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

/** Parse the TEXT result returned by the tool into a shape we can consume. */
function parseStatsFromText(
  text: string
): { order: string[]; byName: Record<string, RankingItem> } | undefined {
  if (!text) return undefined;
  try {
    const json = JSON.parse(text);
    const tables = json?.tables;
    if (!Array.isArray(tables)) return undefined;
    const primary =
      tables.find((t: any) => t?.name === "PrimaryResult") ?? tables[0];
    const rows: any[] = primary?.rows ?? [];
    const order: string[] = [];
    const byName: Record<string, RankingItem> = {};

    for (const row of rows) {
      // expected row form: [Url, TotalRequests]
      const url = String(row[0] ?? "");
      const total = Number(row[1] ?? 0);
      if (!url) continue;
      const seg = lastSegment(url).toLowerCase();
      order.push(seg);
      byName[seg] = { url, score: total };
    }
    return { order, byName };
  } catch {
    return undefined;
  }
}

function deriveTopNames(stats: RankingStatsShape | undefined): string[] {
  if (!stats) return [];
  if (Array.isArray(stats)) return stats.slice();
  if ("order" in stats && Array.isArray((stats as any).order))
    return (stats as any).order.slice();
  if ("servers" in stats && Array.isArray((stats as any).servers))
    return (stats as any).servers.slice();
  if ("byName" in stats && (stats as any).byName) {
    const entries = Object.entries(
      (stats as any).byName as Record<string, RankingItem>
    );
    return entries
      .sort((a, b) => (b[1].score ?? 0) - (a[1].score ?? 0))
      .map(([name]) => name);
  }
  const entries = Object.entries(stats as Record<string, RankingItem>);
  return entries
    .sort((a, b) => (b[1].score ?? 0) - (a[1].score ?? 0))
    .map(([name]) => name);
}

function deriveTopDetails(
  stats: RankingStatsShape | undefined
): Record<string, RankingItem> {
  if (!stats) return {};
  if (Array.isArray(stats)) return {};
  if ("byName" in stats && (stats as any).byName)
    return (stats as any).byName as Record<string, RankingItem>;
  return stats as Record<string, RankingItem>;
}

function normalizeUrl(u?: string) {
  if (!u) return "";
  try {
    const url = new URL(u);
    const path = url.pathname.replace(/\/+$/g, "");
    return `${url.origin}${path}`.toLowerCase();
  } catch {
    return u.replace(/\/+$/g, "").toLowerCase();
  }
}

// --- Component ---------------------------------------------------------------

export const ServersPage = () => {
  const { SearchBox, Paragraph, Tabs, Tab } = useTheme();
  const { t } = useTranslation();

  const mcpRegistries = useAppStore((s) => s.mcpRegistries);
  const mcpServers = useAppStore((s) => s.mcpServers);
  const removeMcpServer = useAppStore((s) => s.removeMcpServer);
  const servers = Object.keys(mcpRegistries).flatMap(z => mcpRegistries[z]);
  const addMcpServer = useAppStore((s) => s.addMcpServer);
  // Optional: chatAppMcp tool accessor (uncomment in your store if available)

  // rankings stats could come from the store OR from the tool TEXT response we parse locally
  const storeRankingsStats = useAppStore(
    (s: any) => s.rankingsStats ?? s.rankingStats
  ) as RankingStatsShape | undefined;
  const [localRankingsStats, setLocalRankingsStats] = useState<
    RankingStatsShape | undefined
  >(undefined);
  const rankingsStats = localRankingsStats ?? storeRankingsStats;
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [editingName, setEditingName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("top"); // "top" | "all"
  const handleEdit = (name: string) => setEditingName(name);
  const handleHideEdit = () => setEditingName(null);
  const getRegistries = useDefaultRegistries()

  useEffect(() => {
    getRegistries();
  }, []);

  // --- Fetch & parse rankings via tool (TEXT result) -------------------------
  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const stats = await serverStats();
        const parsed = parseStatsFromText(stats);
        if (!cancelled && parsed) {

          setLocalRankingsStats(parsed);
        }
      } catch (e) {
        // swallow – page should still work with store data
        // console.warn("Failed to load MCP server stats", e);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  // --- Data derivation -------------------------------------------------------
  const topNames = useMemo(
    () => deriveTopNames(rankingsStats),
    [rankingsStats]
  ); // names are lowercase last segments
  const topDetails = useMemo(
    () => deriveTopDetails(rankingsStats),
    [rankingsStats]
  );

  const normalizedSearch = search.trim().toLowerCase();

  // Build fast lookups:
  // 1) URL -> store name
  // 2) lastSegment(lower) -> store name
  // 3) storeName(lower) -> canonical store name (case-insensitive name hit)
  const { urlToStoreName, segToStoreName, lowerToStoreName } = useMemo(() => {
    const urlMap = new Map<string, string>();
    const segMap = new Map<string, string>();
    const nameMap = new Map<string, string>();
    for (const server of servers) {
      nameMap.set(server.server.name.toLowerCase(), server.server.name);
      const remote = server.server.remotes?.find(a => a.type == "streamable-http");
      if (!remote) continue
      const key = normalizeUrl(remote?.url);
      if (key) urlMap.set(key, server.server.name);
      const seg = lastSegment(remote?.url!).toLowerCase();
      if (seg) segMap.set(seg, server.server.name);
    }
    return {
      urlToStoreName: urlMap,
      segToStoreName: segMap,
      lowerToStoreName: nameMap,
    };
  }, [servers]);


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
  console.log(allEntries)
  const topEntries = useMemo<EntryView[]>(() => {
    if (!topNames.length) return [];
    const items: EntryView[] = [];
    for (const segLower of topNames) {
      const detail = topDetails[segLower];
      const url = (detail?.url || "").toString();

      const fromUrl = url ? urlToStoreName.get(normalizeUrl(url)) : undefined;
      const fromSeg = segToStoreName.get(segLower);
      const fromName = lowerToStoreName.get(segLower);

      const resolvedStoreName = fromUrl || fromSeg || fromName;

      // EXCLUDE ranked items that do not exist in the All items list
      if (!resolvedStoreName) continue;

      const storeCfg = servers.find(a => a.server.name === resolvedStoreName);
      if (!storeCfg) continue; // double safety

      const displayName = resolvedStoreName; // keep original casing from the store
      const cfg: any | RankingItem = storeCfg;

      if (!displayName.toLowerCase().includes(normalizedSearch)) continue;

      const canRemove = true;
      items.push({ displayName, cfg, canRemove, storeName: resolvedStoreName });
    }
    return items;
  }, [
    topNames,
    topDetails,
    servers,
    urlToStoreName,
    segToStoreName,
    lowerToStoreName,
    normalizedSearch,
  ]);





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

  const renderGrid = (entries: EntryView[]) => {
    const visibleItems = activeTab == "all"
      ? entries
      : entries.filter(a => a.displayName.indexOf("ai.smithery") == -1);

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
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
                  maxWidth: 320,
                  width: "100%"
                }}>

                <RegistryServerCard serverItem={cfg}
                  onInstall={onInstall}
                  translations={{
                    install: t('install'),
                    uninstall: t('uninstall'),
                    sourceCode: t('sourceCode')
                  }}
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
      <ServersHeader onAddServer={() => setShowModal(true)} />
      <div style={{ background: "transparent" }}>
        <div
          style={{
            width: 700,
            maxWidth: "100%",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <OverviewPageHeader
            title={t("mcpPage.title")}
            officialUrl={"https://modelcontextprotocol.io/"}
            docsUrl={"https://github.com/modelcontextprotocol"}
          />

          <Paragraph style={{ textAlign: "center" }}>
            {t("mcpPage.description")}
          </Paragraph>

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
            <Tab eventKey="top" icon="trending" title={t("mcpPage.trending")}>
              <div style={{ paddingTop: 12 }}>{renderGrid(topEntries)}</div>
            </Tab>
            <Tab eventKey="all" icon="cardList" title={t("all")}>
              <div style={{ paddingTop: 12 }}>{renderGrid(allEntries)}</div>
            </Tab>

            {registryTabs.map((rt) => (
              <Tab
                key={rt.registryUrl}
                eventKey={`reg:${rt.registryUrl}`}
                title={rt.title}
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