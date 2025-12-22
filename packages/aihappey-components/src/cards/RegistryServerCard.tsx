import { McpRegistryServerResponse } from "aihappey-types";
import { useTheme } from "../theme/ThemeContext";
import { McpServerCardButtons } from "../buttons/McpServerCardButtons";
import { LimitedTextField } from "../fields/LimitedTextField";
import { useMcpServer } from "./useMcpServer";
import { CapabilityIcon } from "../images/CapabilityIcon";

type RegistryServerCardProps = {
  serverItem: McpRegistryServerResponse;
  translations?: any
  renderDescription?: () => React.ReactElement
  onInstall?: () => void;
  onRemove?: () => void;
};

export const RegistryServerCard = ({ serverItem,
  onRemove,
  translations,
  renderDescription,
  onInstall }: RegistryServerCardProps) => {
  const { name, websiteUrl, remotes,
    description, title } = serverItem.server;
  const url = remotes?.find(a => a.type == "streamable-http")?.url;
  const { Card, Button } = useTheme();

  const mcpServer = useMcpServer(serverItem.server)
  const headerActions = onRemove ? <Button
    size="small"
    variant="outline"
    onClick={onRemove}
  >{translations?.uninstall ?? "uninstall"}
  </Button>
    : onInstall ? <Button
      size="small"
      onClick={onInstall}
    >{translations?.install ?? "install"}
    </Button>
      : undefined

  return (
    <Card
      title={title ?? name}
      description={renderDescription
        ? renderDescription() : undefined}
      image={<CapabilityIcon icons={serverItem?.server?.icons} />}
      size="small"
      headerActions={headerActions}
      actions={
        <McpServerCardButtons url={url!}
          translations={translations}
          websiteUrl={websiteUrl}
          respositoryUrl={mcpServer.repositoryUrl}
        />
      }
    >
      <LimitedTextField text={description} />
    </Card>
  );
};