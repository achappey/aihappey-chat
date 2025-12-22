import { McpRegistryServerResponse, ServerClientConfig } from "aihappey-types";
import { useTheme } from "../theme/ThemeContext";
import { McpServerCardButtons } from "../buttons/McpServerCardButtons";
import { LimitedTextField } from "../fields/LimitedTextField";
import { useMcpServer } from "./useMcpServer";

type McpServerCardProps = {
  serverConfig: ServerClientConfig;
  serverName: string
  checked: boolean
  registryItem?: McpRegistryServerResponse;
  translations?: any
  renderDescription?: () => React.ReactElement
  onToggle?: () => void;
  onRemove?: () => void;
};

export const McpServerCard = ({ serverConfig,
  serverName,
  registryItem,
  checked,
  translations,
  onToggle,
  renderDescription,
  onRemove }: McpServerCardProps) => {
  const url = serverConfig.url;
  const { Card, Image, Switch } = useTheme();
  const mcpServer = useMcpServer(registryItem?.server)

  const headerActions = onToggle ? <Switch
    id={`switch-${url}`}
    checked={checked}
    onChange={onToggle}
  /> : undefined

  const image = mcpServer.icon ? <Image src={mcpServer.icon}
    height={32}
    shape="square" /> : undefined

  return (
    <Card
      title={registryItem?.server?.title ?? serverName}
      description={renderDescription
        ? renderDescription() : undefined}
      image={image}
      size="small"
      headerActions={headerActions}
      actions={
        <McpServerCardButtons url={url}
          translations={translations}
          onDelete={onRemove}
          websiteUrl={registryItem?.server?.websiteUrl}
          respositoryUrl={mcpServer.repositoryUrl}
        />
      }
    >
      <LimitedTextField text={registryItem?.server?.description} />
    </Card>
  );
};