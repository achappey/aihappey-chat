import { useMemo } from "react";
import type { MenuItemProps } from "aihappey-types";
import type { PluginCatalogItem } from "aihappey-plugins";
import { useTranslation } from "aihappey-i18n";
import { LimitedTextField } from "../fields/LimitedTextField";
import { useTheme } from "../theme/ThemeContext";

export type PluginCardProps = {
  plugin: PluginCatalogItem;
  onView: () => void;
  onDownload: () => void;
  onDelete?: () => void;
};

export const PluginCard = ({ plugin, onView, onDownload, onDelete }: PluginCardProps) => {
  const { Card, Menu, Button, Badge } = useTheme();
  const { t } = useTranslation();
  const menuItems = useMemo<MenuItemProps[]>(() => onDelete ? [{ key: "delete", label: t("delete"), onClick: onDelete }] : [], [onDelete, t]);
  return (
    <Card
      title={plugin.name}
      size="small"
      description={(
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {plugin.version ? <Badge size="small" bg="subtle">v{plugin.version}</Badge> : null}
          <Badge size="small" appearance="neutral" icon="skills">{t("pluginsPage.skillCount", { count: plugin.skillCount })}</Badge>
          <Badge size="small" appearance="neutral" icon="mcpServer">{t("pluginsPage.serverCount", { count: plugin.mcpServerCount })}</Badge>
        </div>
      )}
      actions={(
        <>
          <Button icon="eye" size="small" variant="transparent" title={t("details")} onClick={onView} />
          <Button icon="download" size="small" variant="transparent" title={t("download")} onClick={onDownload} />
        </>
      )}
      headerActions={onDelete ? <Menu items={menuItems} /> : undefined}
    >
      <LimitedTextField text={plugin.description || t("pluginsPage.noDescription")} />
    </Card>
  );
};
