import { useMemo } from "react";
import type { MenuItemProps } from "aihappey-types";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";
import { LimitedTextField } from "../fields/LimitedTextField";
import { formatTimestamp } from "./formatTimestamp";

export type JsonRenderCatalogActionCardItem = {
  /** Stable id for React keys (can be derived, e.g. `${catalogId}:${name}`) */
  id: string;
  name: string;
  updatedAt?: string;
  title?: string;
  description?: string;
  paramsSchema?: string;
};

export type JsonRenderCatalogActionCardProps = {
  item: JsonRenderCatalogActionCardItem;
  onOpen?: () => void;
  onDelete?: () => void;
};

export const JsonRenderCatalogActionCard = ({
  item,
  onOpen,
  onDelete,
}: JsonRenderCatalogActionCardProps) => {
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
        {t("lastUpdated")}: {formatTimestamp(item.updatedAt)}
      </div>
    </div>
  );

  return (
    <Card
      title={item.title ?? item.name}
      size="small"
      headerActions={headerActions}
      actions={actions}
      description={meta}
    >
      {item.description ? <LimitedTextField text={item.description} /> : null}
    </Card>
  );
};

