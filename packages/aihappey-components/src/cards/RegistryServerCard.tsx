import { McpRegistryServerResponse } from "aihappey-types";
import { useTheme } from "../theme/ThemeContext";
import { McpServerCardButtons } from "../buttons/McpServerCardButtons";
import { LimitedTextField } from "../fields/LimitedTextField";
import { CapabilityIcon } from "../images/CapabilityIcon";
import { useTranslation } from "aihappey-i18n";
import { getRepositoryUrl } from "./getRepositoryUrl";
import { VersionBadge } from "../badges/VersionBadge";

type RegistryServerCardProps = {
  serverItem: McpRegistryServerResponse;
  renderDescription?: () => React.ReactElement
  onInstall?: () => void;
  onRemove?: () => void;
};

export const RegistryServerCard = ({ serverItem,
  onRemove,
  renderDescription,
  onInstall }: RegistryServerCardProps) => {
  const { name, websiteUrl, remotes,
    description, title, version } = serverItem.server;
  const url = remotes?.find(a => a.type == "streamable-http")?.url;
  const { Card, Button } = useTheme();
  const { t } = useTranslation();
  const renderedDescription = renderDescription?.();
  
  const headerActions = onRemove ? <Button
    size="small"
    variant="outline"
    onClick={onRemove}
  >{t("uninstall")}
  </Button>
    : onInstall ? <Button
      size="small"
      onClick={onInstall}
    >{t("install")}
    </Button>
      : undefined

  return (
    <Card
      title={title ?? name}
      description={version ? (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <VersionBadge version={version} />
          {renderedDescription}
        </div>
      ) : renderedDescription}
      image={<CapabilityIcon icons={serverItem?.server?.icons} />}
      size="small"
      headerActions={headerActions}
      actions={
        <McpServerCardButtons url={url!}
          websiteUrl={websiteUrl}
          respositoryUrl={getRepositoryUrl(serverItem.server)}
        />
      }
    >
      <LimitedTextField text={description} />
    </Card>
  );
};
