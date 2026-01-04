// -components/src/modals/ServerCatalogSearchContents.tsx
import { ReactNode, useCallback, useMemo } from "react";
import { useTranslation } from "aihappey-i18n";
import { useDarkMode } from "usehooks-ts";
import { McpRegistryServerResponse } from "aihappey-types";
import { useTheme } from "../theme/ThemeContext";

export type ServerCatalogTabKey = "all" | "recent" | "my";

export type ServerCatalogRenderItemArgs = {
  server: McpRegistryServerResponse;
  exists: boolean;
  ownerNames: string[];
};

type Props = {
  servers: McpRegistryServerResponse[];
  installedServerKeys: string[];
  recentlyUsedUrls: Set<string>;
  ownerEmail?: string;

  search: string;
  onSearchChange: (v: string) => void;

  activeTab: ServerCatalogTabKey;
  onTabChange: (k: ServerCatalogTabKey) => void;

  quickSearches?: string[];

  enableBaseDomainToggle: boolean;
  baseDomain: string;
  showBaseDomain: boolean;
  onToggleBaseDomain: () => void;

  renderItem: (args: ServerCatalogRenderItemArgs) => ReactNode;
};

export const ServerCatalogSearchContentList = ({
  servers,
  installedServerKeys,
  recentlyUsedUrls,
  ownerEmail,

  search,
  onSearchChange,

  activeTab,
  onTabChange,

  quickSearches,

  enableBaseDomainToggle,
  baseDomain,
  showBaseDomain,
  onToggleBaseDomain,

  renderItem,
}: Props) => {
  const { Button, Switch, SearchBox, Tabs, Tab } = useTheme();
  const { t } = useTranslation();
  const { isDarkMode } = useDarkMode();

  const isRecent = useCallback(
    (server: McpRegistryServerResponse) =>
      server?.server.remotes?.some((z) => recentlyUsedUrls.has(z.url)) ?? false,
    [recentlyUsedUrls]
  );

  const filterAndSort = useCallback(
    (list: McpRegistryServerResponse[]) => {
      const terms = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
      const registrable = baseDomain.toLowerCase();
      const reversed = registrable.split(".").reverse().join(".");

      return list
        .filter((server) => {
          const name = (server?.server.name ?? "").toLowerCase();
          const description = (server?.server.description ?? "").toLowerCase();

          const matchesText =
            terms.length === 0 ||
            terms.every((term) => name.includes(term) || description.includes(term));

          const host = name.split("/")[0];
          const matchesDomain =
            !showBaseDomain ||
            host.endsWith(registrable) ||
            host === reversed ||
            host.startsWith(reversed + ".");

          return matchesText && matchesDomain;
        })
        .sort((a, b) => a.server.name.localeCompare(b.server.name));
    },
    [search, showBaseDomain, baseDomain]
  );

  const allFiltered = useMemo(() => filterAndSort(servers ?? []), [servers, filterAndSort]);
  const recentFiltered = useMemo(
    () => filterAndSort((servers ?? []).filter(isRecent)),
    [servers, isRecent, filterAndSort]
  );

  const myFiltered = useMemo(() => {
    const email = ownerEmail?.toLowerCase();
    if (!email) return [];

    return filterAndSort(
      (servers ?? []).filter((s) => {
        if (!s._meta) return false;

        const blocks = Object.values(s._meta);
        const owners = blocks.flatMap((b: any) => (Array.isArray(b.authors) ? b.authors : []));
        return owners.some((o: any) => o?.email?.toLowerCase() === email);
      })
    );
  }, [servers, ownerEmail, filterAndSort]);

  const list =
    activeTab === "all" ? allFiltered : activeTab === "recent" ? recentFiltered : myFiltered;

  const renderList = (items: McpRegistryServerResponse[]) => {
    if (!items?.length) {
      return <div style={{ color: "#888", marginTop: 8 }}>{t("serverSelectModal.noServers")}</div>;
    }

    return (
      <div style={{ marginTop: 8 }}>
        {items.map((server) => {
          const owners = Object.values(server?._meta ?? {})
            .flatMap((block: any) => (Array.isArray(block.authors) ? block.authors : []))
            .filter(Boolean);

          const ownerNames = owners.map((o: any) => o?.name).filter(Boolean);

          const url = server.server.remotes?.find((a) => a.type === "streamable-http")?.url;

          const exists = installedServerKeys
            .map((x) => x.toLowerCase())
            .some((k) => k === server.server.name.toLowerCase() || (!!url && k === url.toLowerCase()));

          return (
            <div key={server.server.name} style={{ marginBottom: 12 }}>
              {renderItem({ server, exists, ownerNames })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 3,
          backgroundColor: isDarkMode ? "#292929" : "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <SearchBox value={search} onChange={onSearchChange} placeholder={t("searchPlaceholder")} autoFocus />

          {enableBaseDomainToggle && (
            <Switch id="base-domain" label={baseDomain} checked={showBaseDomain} onChange={onToggleBaseDomain} />
          )}
        </div>

        {!!quickSearches?.length && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
            {quickSearches.map((q) => (
              <Button key={q} type="button" variant="outline" size="small" onClick={() => onSearchChange(q)}>
                {q}
              </Button>
            ))}
          </div>
        )}

        <div style={{ marginTop: 8 }}>
          <Tabs activeKey={activeTab} onSelect={(k: any) => onTabChange(k as ServerCatalogTabKey)}>
            <Tab eventKey="all" title={t("all")}>
              {null}
            </Tab>
            <Tab eventKey="recent" title={t("recentlyUsed")}>
              {null}
            </Tab>
            <Tab eventKey="my" title={t("my")}>
              {null}
            </Tab>
          </Tabs>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, minWidth: 320 }}>{renderList(list)}</div>
    </div>
  );
};
