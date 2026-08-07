import { McpRegistryServerResponse, ServerClientConfig } from "aihappey-types";
import { useTranslation } from "aihappey-i18n";
import { useDarkMode } from "usehooks-ts";
import { AuthorBadges } from "../../badges";
import { McpServerCard } from "../../cards";
import { useTheme } from "../../theme/ThemeContext";

type Props = {
  enabled: Set<string>;
  onToggle: (key: string) => void;
  mcpServers: Record<
    string,
    {
      config: ServerClientConfig;
      registry?: McpRegistryServerResponse;
    }
  >;
  onRemove?: (name: string) => void;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchAutoFocus?: boolean;
};

export const ServerManagement = ({
  enabled,
  mcpServers,
  onRemove,
  onToggle,
  search,
  onSearchChange,
  searchAutoFocus = false,
}: Props) => {
  const { SearchBox } = useTheme();
  const { t } = useTranslation();
  const { isDarkMode } = useDarkMode();
  const showSearch = search !== undefined && onSearchChange !== undefined;
  const terms = (search ?? "").trim().toLowerCase().split(/\s+/).filter(Boolean);

  const servers = Object.entries(mcpServers)
    .map(([key, server]) => ({
      key,
      displayName: server.registry?.server?.name ?? key,
      server,
    }))
    .filter(({ displayName, server }) => {
      const name = displayName.toLowerCase();
      const description = (server.registry?.server?.description ?? "").toLowerCase();

      return terms.length === 0 || terms.every((term) => name.includes(term) || description.includes(term));
    });

  return (
    <div>
      {showSearch && (
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 3,
            paddingBottom: 8,
            backgroundColor: isDarkMode ? "#292929" : "#ffffff",
          }}
        >
          <SearchBox
            value={search}
            onChange={onSearchChange}
            placeholder={t("searchPlaceholder")}
            autoFocus={searchAutoFocus}
          />
        </div>
      )}

      {!servers.length && (
        <div style={{ color: "#888", marginTop: 8 }}>{t("serverSelectModal.noServers")}</div>
      )}

      {servers.map(({ key, displayName, server }) => {
        const owners = Object.values(server?.registry?._meta ?? {})
          .flatMap((b: any) => (Array.isArray(b.authors) ? b.authors : []))
          .filter(Boolean);

        const ownerNames = owners.map((o) => o?.name).filter(Boolean);
        const renderDescription = () => <AuthorBadges authors={ownerNames} />;

        return (
          <div key={key} style={{ marginBottom: 12 }}>
            <McpServerCard
              serverName={displayName}
              serverConfig={server.config}
              checked={enabled.has(key)}
              renderDescription={renderDescription}
              registryItem={server.registry}
              onToggle={() => onToggle(key)}
              onRemove={onRemove ? () => onRemove(key) : undefined}
            />
          </div>
        );
      })}
    </div>
  );
};
