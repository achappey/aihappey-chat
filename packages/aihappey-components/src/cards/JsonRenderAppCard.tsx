import { useMemo } from "react";
import type { MenuItemProps } from "aihappey-types";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";
import { format } from "timeago.js";

export type JsonRenderAppCardItem = {
  id: string;
  name: string;
  updatedAt?: string;
};

export type JsonRenderAppCardProps = {
  item: JsonRenderAppCardItem;
  onOpen?: () => void;
  onDelete?: () => void;
};

export const JsonRenderAppCard = ({ item, onOpen, onDelete }: JsonRenderAppCardProps) => {
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
      <div style={{ color: "#666", fontSize: 12 }}>
        {t("lastUpdated")}: {format(new Date(item.updatedAt ?? new Date()))}
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

