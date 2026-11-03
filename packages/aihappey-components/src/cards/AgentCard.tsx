import { useTheme } from "../theme/ThemeContext";
import { Agent, MenuItemProps } from "aihappey-types";
import { LimitedTextField } from "../fields/LimitedTextField";
import { useTranslation } from "aihappey-i18n";
import { CapabilityIcon } from "../images/CapabilityIcon";
import { AgentFavoriteToggleButton } from "../buttons/AgentFavoriteToggleButton";
import { useEffect, useState } from "react";
import { AuthorBadge } from "../badges/AuthorBadge";

type AgentCardProps = {
  agent: Agent;
  providerIcons?: (NonNullable<Agent["icons"]>[number] & { providerId?: string })[];
  onEdit?: () => void
  onDelete?: () => void
  onConnectMcp?: () => void;
  onSaveAsPlugin?: () => void | Promise<void>;
  saveAsPluginDisabled?: boolean;
  showExport?: boolean;
  getExportAgent?: () => Promise<Agent>;
  loadMenuItems?: () => Promise<MenuItemProps[]>;
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
  getExportAgent,
  loadMenuItems,
  isFavorite = false,
  onToggleFavorite,
}: AgentCardProps) => {
  const { Card, Button, Menu } = useTheme();
  const { t } = useTranslation();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string>();
  const [remoteItems, setRemoteItems] = useState<MenuItemProps[]>();
  const [loadingActions, setLoadingActions] = useState(false);
  useEffect(() => { setRemoteItems(undefined); }, [agent]);
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
    if (exporting) return;
    setExporting(true);
    setExportError(undefined);
    try {
    // Full object (metadata + messages + anything else)
    const definition = getExportAgent ? await getExportAgent() : agent;
    const json = JSON.stringify(definition, null, 2);

    // Create blob
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // Create download link
    const a = document.createElement("a");
    a.href = url;

    // Filename from conversation name
    const safeName = (definition.name)
      .replace(/[^a-z0-9\-]+/gi, "_");

    a.download = `${safeName}.json`;
    a.click();

    URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : String(error));
    } finally { setExporting(false); }
  };

  const exportButton = showExport
    ? <Button icon="download"
      size="small"
      title={t('download')}
      disabled={exporting}
      variant="transparent"
      onClick={handleExport} />
    : null;

  const headerActions = loadMenuItems ? <span onClickCapture={() => {
    if (remoteItems || loadingActions) return;
    setLoadingActions(true);
    void loadMenuItems().then(items => setRemoteItems(items.length ? items : [
      { key: "no-actions", label: t("noResults"), disabled: true },
    ])).catch(error => setExportError(error instanceof Error ? error.message : String(error)))
      .finally(() => setLoadingActions(false));
  }}><Menu items={remoteItems ?? [{ key: "loading", label: t("loading"), disabled: true }]} /></span>
    : menuItems.length ? <Menu items={menuItems} /> : undefined;
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
  const owner = agent.owned_by?.trim();

  const actions = exportButton || editButton || favoriteButton ? <>{exportButton}{editButton}{favoriteButton}</> : undefined

  return (
    <Card
      title={agent?.name}
      image={image}
      actions={actions}
      headerActions={headerActions}
      description={owner ? <AuthorBadge author={owner} /> : undefined}
      size="small"
    >
      <LimitedTextField text={agent?.description} />
      {exportError ? <div role="alert">{exportError}</div> : null}
    </Card>
  );
};
