import { McpRegistryServerResponse, ServerClientConfig } from "aihappey-types";
import { useTheme } from "../theme/ThemeContext";
import { McpServerCardButtons } from "../buttons/McpServerCardButtons";
import { LimitedTextField } from "../fields/LimitedTextField";
import { getRepositoryUrl } from "./getRepositoryUrl";
import { CapabilityIcon } from "../images";

type McpServerCardProps = {
  serverConfig: ServerClientConfig;
  serverName: string
  checked: boolean
  registryItem?: McpRegistryServerResponse;
  renderDescription?: () => React.ReactElement
  onToggle?: () => void;
  onRemove?: () => void;
};

export const McpServerCard = ({ serverConfig,
  serverName,
  registryItem,
  checked,
  onToggle,
  renderDescription,
  onRemove }: McpServerCardProps) => {
  const url = serverConfig.url;
  const { Card, Switch } = useTheme();
  const headerActions = onToggle ? <Switch
    id={`switch-${url}`}
    checked={checked}
    onChange={onToggle}
  /> : undefined

  const image = <CapabilityIcon icons={registryItem?.server.icons} />

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
          onDelete={onRemove}
          websiteUrl={registryItem?.server?.websiteUrl}
          respositoryUrl={getRepositoryUrl(registryItem?.server)}
        />
      }
    >
      <LimitedTextField text={registryItem?.server?.description} />
    </Card>
  );
};