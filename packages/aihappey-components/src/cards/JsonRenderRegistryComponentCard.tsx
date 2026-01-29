import { useMemo } from "react";
import type { MenuItemProps } from "aihappey-types";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";
import { formatTimestamp } from "./formatTimestamp";

export type JsonRenderRegistryComponentCardItem = {
  id: string;
  registryId: string;
  name: string;
  updatedAt?: string;
};

export type JsonRenderRegistryComponentCardProps = {
  item: JsonRenderRegistryComponentCardItem;
  onOpen?: () => void;
  onDelete?: () => void;
};

export const JsonRenderRegistryComponentCard = ({
  item,
  onOpen,
  onDelete,
}: JsonRenderRegistryComponentCardProps) => {
  const { Card, Button, Menu } = useTheme();
  const { t } = useTranslation();

  const menuItems: MenuItemProps[] = useMemo(
    () =>
      onDelete
        ? [
            {
              key: "delete",
              label: t("delete"),
              onClick: onDelete,
            },
          ]
        : [],
    [onDelete, t]
  );

  const headerActions = onDelete ? <Menu items={menuItems} /> : undefined;
  const actions = onOpen ? (
    <Button
      icon="eye"
      size="small"
      variant="transparent"
      onClick={onOpen}
      title={t("open")}
      aria-label={t("open")}
    />
  ) : undefined;

  const meta = (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ color: "#666", fontSize: 12 }}>{item.id}</div>
      <div style={{ color: "#666", fontSize: 12 }}>{item.registryId}</div>
      <div style={{ color: "#666", fontSize: 12 }}>
        {t("lastUpdated")}: {formatTimestamp(item.updatedAt)}
      </div>
    </div>
  );

  return (
    <Card
      title={item.name}
      size="small"
      headerActions={headerActions}
      actions={actions}
    />
  );
};

