import { McpRegistryServerResponse, ServerClientConfig } from "aihappey-types";
import { AuthorBadges } from "../badges";
import { McpServerCard } from "../cards";

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
};

export const ServerManagement = ({
  enabled,
  mcpServers,
  onRemove,
  onToggle,
}: Props) => {
  const servers = Object.entries(mcpServers).map(([key, server]) => ({
    key,
    displayName: server.registry?.server?.name ?? key,
    server,
  }));

  return (
    <div style={{ overflowY: "auto" }}>
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
