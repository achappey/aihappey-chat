import { useTheme } from "../theme/ThemeContext";
import { Agent, MenuItemProps, getAgentModels } from "aihappey-types";
import { LimitedTextField } from "../fields/LimitedTextField";
import { useTranslation } from "aihappey-i18n";
import { CapabilityIcon } from "../images/CapabilityIcon";
import { AgentFavoriteToggleButton } from "../buttons/AgentFavoriteToggleButton";
import { getModelDisplayId } from "./getModelDisplayId";
import { useDarkMode } from "usehooks-ts";
import { selectCapabilityIcon } from "../images/selectCapabilityIcon";

type AgentCardProps = {
  agent: Agent;
  providerIcons?: (NonNullable<Agent["icons"]>[number] & { providerId?: string })[];
  onEdit?: () => void
  onDelete?: () => void
  onConnectMcp?: () => void;
  onSaveAsPlugin?: () => void | Promise<void>;
  saveAsPluginDisabled?: boolean;
  showExport?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
};

export const AgentCard = ({
  agent,
  providerIcons,
  onEdit,
  onDelete,
  onConnectMcp,
  onSaveAsPlugin,
  saveAsPluginDisabled = false,
  showExport = true,
  isFavorite = false,
  onToggleFavorite,
}: AgentCardProps) => {
  const { Card, Button, Menu, Badge } = useTheme();
  const { t } = useTranslation();
  const { isDarkMode } = useDarkMode();
  const menuItems: MenuItemProps[] = [
    ...(onConnectMcp ? [{
      key: "connect-mcp",
      label: t("agents.connectMcp"),
      onClick: onConnectMcp,
    }] : []),
    ...(onSaveAsPlugin ? [{
      key: "save-as-plugin",
      label: t("agents.saveAsPlugin"),
      onClick: onSaveAsPlugin,
      disabled: saveAsPluginDisabled,
    }] : []),
    ...(onDelete ? [{
      key: "delete",
      label: t("delete"),
      onClick: onDelete,
      danger: true,
    }] : []),
  ];


  const handleExport = async () => {
    // Full object (metadata + messages + anything else)
    const json = JSON.stringify(agent, null, 2);

    // Create blob
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // Create download link
    const a = document.createElement("a");
    a.href = url;

    // Filename from conversation name
    const safeName = (agent?.name)
      .replace(/[^a-z0-9\-]+/gi, "_");

    a.download = `${safeName}.json`;
    a.click();

    URL.revokeObjectURL(url);
  };

  const exportButton = showExport
    ? <Button icon="download"
      size="small"
      title={t('download')}
      variant="transparent"
      onClick={handleExport} />
    : null;

  const headerActions = menuItems.length ? <Menu items={menuItems} /> : undefined;
  const editButton = onEdit
    ? <Button icon="edit"
      size="small"
      variant="transparent"
      onClick={onEdit} /> : undefined;

  const favoriteButton = onToggleFavorite
    ? <AgentFavoriteToggleButton
      agentName={agent?.name}
      isFavorite={isFavorite}
      onToggleFavorite={onToggleFavorite}
      size="small"
      variant="transparent"
    /> : undefined;

  const imageIcons = agent?.icons?.length ? agent.icons : providerIcons;
  const image = imageIcons?.length ? <CapabilityIcon icons={imageIcons} /> : undefined;
  // Custom agent artwork is not evidence of a provider identity.
  const providerIcon = !agent?.icons?.length ? selectCapabilityIcon(providerIcons, isDarkMode) : undefined;
  const displayedProviderId = providerIcon?.src ? providerIcon.providerId : undefined;
  const modelIds = getAgentModels(agent).map(model => model.id);

  const actions = exportButton || editButton || favoriteButton ? <>{exportButton}{editButton}{favoriteButton}</> : undefined

  return (
    <Card
      title={agent?.name}
      image={image}
      actions={actions}
      headerActions={headerActions}
      description={modelIds.length ? <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {modelIds.map(modelId => <Badge key={modelId} title={modelId} icon="brain" size="small" appearance="tint">
          {getModelDisplayId(modelId, !!displayedProviderId && modelId.startsWith(`${displayedProviderId}/`))}
        </Badge>)}
      </div> : undefined}
      size="small"
    >
      <LimitedTextField text={agent?.description} />
    </Card>
  );
};
