import { useState, useMemo, useEffect, useCallback } from "react";
import { useAppStore } from "aihappey-state";
import { AuthorBadges, RegistryServerCard, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { useRecentlyUsed } from "./useRecentlyUsed";
import { useDarkMode } from "usehooks-ts";
import { useAccount } from "aihappey-auth";
import { McpRegistryServerResponse, TagItem } from "aihappey-types";
import { useDefaultRegistries } from "../../shell/connectors/useDefaultRegistries";

type Props = {
  show: boolean;
  onHide: () => void;
  addMcpServer: (item: McpRegistryServerResponse) => void
  removeMcpServer: (item: McpRegistryServerResponse) => void
  installedServerKeys: string[]
};

function getBaseDomain(hostname: string): string {
  const parts = hostname.split(".");
  if (parts.length >= 2) return parts.slice(-2).join(".");
  return hostname;
}

export const ServerCatalogModal = ({ show, onHide,
  installedServerKeys,
  removeMcpServer, addMcpServer }: Props) => {
  const { Modal, Button, Switch, SearchBox, Tabs, Tab, Tags } = useTheme();
  const { t } = useTranslation();
  const account = useAccount()
  const getRegistries = useDefaultRegistries()
  const mcpRegistries = useAppStore((s) => s.mcpRegistries);
  const quickSearches = useAppStore((s) => s.quickSearches);
  const [showBaseDomain, setShowBaseDomain] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "recent" | "my">("all");
  const recently = useRecentlyUsed(); // string[] of remote URLs
  const recentlySet = useMemo(() => new Set(recently), [recently]);
  const servers = Object.keys(mcpRegistries).flatMap(z => mcpRegistries[z])

  useEffect(() => {
    if (show)
      getRegistries();
  }, [show]);

  const handleClose = () => {
    setSearch("");
    onHide();
  };

  const isRecent = useCallback(
    (server: McpRegistryServerResponse) =>
      server?.server.remotes?.some((z) => recentlySet.has(z.url)) ?? false,
    [recentlySet]
  );

  const baseDomain = getBaseDomain(window.location.hostname);

  const filterAndSort = useCallback(
    (list: McpRegistryServerResponse[]) => {
      const terms = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
      const registrable = baseDomain.toLowerCase();
      const reversed = registrable.split(".").reverse().join(".");

      return list
        .filter((server: McpRegistryServerResponse) => {
          const name = (server?.server.name ?? "").toLowerCase();
          const description = (server?.server.description ?? "").toLowerCase();
          const matchesText =
            terms.length === 0 ||
            terms.every(term => name.includes(term) || description.includes(term));

          // only check the host part (voor de slash)
          const host = name.split("/")[0];
          const matchesDomain =
            !showBaseDomain ||
            host.endsWith(registrable) ||
            host === reversed ||
            host.startsWith(reversed + ".");

          return matchesText && matchesDomain;
        })
        .sort((a: McpRegistryServerResponse, b: McpRegistryServerResponse) => a.server.name.localeCompare(b.server.name));
    },
    [search, showBaseDomain, baseDomain]
  );

  const allFiltered = useMemo(() => filterAndSort(servers ?? []), [servers, filterAndSort]);
  const recentFiltered = useMemo(
    () => filterAndSort((servers ?? []).filter(isRecent)),
    [servers, isRecent, filterAndSort]
  );

  const myFiltered = useMemo(
    () => {
      const email = account?.username?.toLowerCase();

      return filterAndSort(
        (servers ?? []).filter((s: McpRegistryServerResponse) => {
          if (!email) return false;
          if (!s._meta) return false;

          const blocks = Object.values(s._meta);

          // owners per metadata block
          const owners = blocks.flatMap((b: any) =>
            Array.isArray(b.authors) ? b.authors : []
          );

          // owner.email match
          return owners.some((o: any) =>
            o?.email?.toLowerCase() === email
          );
        })
      );
    },
    [servers, account?.username, filterAndSort]
  );

  const { isDarkMode } = useDarkMode();
  const renderServerList = (list: McpRegistryServerResponse[]) => {
    if (!list || list.length === 0) {
      return <div style={{ color: "#888", marginTop: 8 }}>{t("serverSelectModal.noServers")}</div>;
    }

    return (<div style={{ marginTop: 8 }}>
      {list.map((server) => {

        const owners = Object.values(server?._meta ?? {})
          .flatMap((block: any) => Array.isArray(block.authors) ? block.authors : [])
          .filter(Boolean);

        const ownerNames = owners
          .map(owner => owner?.name)
          .filter(Boolean);

        const url = server.server.remotes?.find(a => a.type == "streamable-http")?.url;
        const exists = installedServerKeys.includes(server.server.name.toLowerCase());
        const exists222 = url && installedServerKeys
          .map(a => a.toLowerCase())
          .includes(url.toLowerCase());
   
        const renderDescription = () => <AuthorBadges authors={ownerNames} />;

        return <div key={server.server.name} style={{ marginBottom: 12 }}>
          <RegistryServerCard
            serverItem={server}
            translations={{
              install: t('install'),
              uninstall: t('uninstall'),
              sourceCode: t('sourceCode')
            }}
            renderDescription={renderDescription}
            onRemove={exists ? () => removeMcpServer(server) : undefined}
            onInstall={exists ? undefined : () => addMcpServer(server)}
          />
        </div>
      })}
    </div>);
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      actions={
        <Button onClick={handleClose}
          variant="secondary"
          type="button">
          {t("close")}
        </Button>
      }
      title={t("catalogModal.catalog")}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          maxHeight: "70vh",          // or whatever fits your modal
          overflowY: "auto",          // <-- moved here
        }}
      >
        {/* Sticky header: search + tags + tabs */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 3,
            backgroundColor: isDarkMode ? "#292929" : "#ffffff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SearchBox value={search} onChange={setSearch} placeholder={t("searchPlaceholder")} autoFocus />
            <Switch
              id={"base-domain"}
              label={baseDomain}
              checked={showBaseDomain}
              onChange={() => setShowBaseDomain((v) => !v)}
            />
          </div>

          {quickSearches && quickSearches?.length > 0 && (
            <div style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginTop: 6
            }}>
              {quickSearches?.map((q) => (
                <Button
                  key={q}
                  type="button"
                  variant="outline"
                  size="small"
                  onClick={() => setSearch(q)}
                >
                  {q}
                </Button>
              ))}
            </div>
          )}

          <div style={{ marginTop: 8 }}>
            <Tabs activeKey={activeTab} onSelect={(k: any) => setActiveTab(k as "all" | "recent")}>
              <Tab eventKey={"all"} title={t("all")} ><></></Tab>
              <Tab eventKey={"recent"} title={t("recentlyUsed")} ><></></Tab>
              <Tab eventKey={"my"} title={t("my")} ><></></Tab>
            </Tabs>
          </div>
        </div>

        {/* List (no own overflow) */}
        <div style={{ flex: 1, minHeight: 0, minWidth: 320 }}>
          {activeTab === "all"
            ? renderServerList(allFiltered)
            : activeTab === "recent"
              ? renderServerList(recentFiltered)
              : renderServerList(myFiltered)}
        </div>
      </div>
    </Modal>
  );
};
