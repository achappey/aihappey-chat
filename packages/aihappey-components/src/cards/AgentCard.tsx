import { useTheme } from "../theme/ThemeContext";
import { Agent, MenuItemProps } from "aihappey-types";
import { LimitedTextField } from "../fields/LimitedTextField";
import { useTranslation } from "aihappey-i18n";
import { CapabilityIcon } from "../images/CapabilityIcon";
import { AgentFavoriteToggleButton } from "../buttons/AgentFavoriteToggleButton";
import { getModelDisplayId } from "./getModelDisplayId";

type AgentCardProps = {
  agent: Agent;
  providerIcons?: Agent["icons"];
  onEdit?: () => void
  onDelete?: () => void
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
  onSaveAsPlugin,
  saveAsPluginDisabled = false,
  showExport = true,
  isFavorite = false,
  onToggleFavorite,
}: AgentCardProps) => {
  const { Card, Button, Menu, Badge } = useTheme();
  const { t } = useTranslation();
  const menuItems: MenuItemProps[] = [
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
  const modelId = agent?.model?.id;
  const modelDisplayId = modelId
    ? getModelDisplayId(modelId, !!providerIcons?.length)
    : undefined;

  const actions = exportButton || editButton || favoriteButton ? <>{exportButton}{editButton}{favoriteButton}</> : undefined

  return (
    <Card
      title={agent?.name}
      image={image}
      actions={actions}
      headerActions={headerActions}
      description={modelId ? (
        <Badge title={modelId} icon="brain" size="small" appearance="tint">
          {modelDisplayId}
        </Badge>
      ) : undefined}
      size="small"
    >
      <LimitedTextField text={agent?.description} />
    </Card>
  );
};
