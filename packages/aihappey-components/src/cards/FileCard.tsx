import { useMemo } from "react";
import { useTheme } from "../theme/ThemeContext";
import type { MenuItemProps } from "aihappey-types";
import { useTranslation } from "aihappey-i18n";
import { MimeTypeBadge } from "../badges";
import { ViewButton } from "../buttons";

export type FileCardItem = {
  id: string;
  name: string;
  createdAt: number;
  data: Blob;
};

export type FileCardProps = {
  file: FileCardItem;
  onView?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
};

function formatBytes(bytes?: number): string {
  if (bytes == null || !Number.isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
}

export const FileCard = ({ file, onView, onDelete, onDownload }: FileCardProps) => {
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
  const actions = (
    <>
      {onView && (
        <ViewButton
          size="small"
          variant="transparent"
          onClick={onView}
          title={t("view")}
        />
      )}
      {onDownload && (
        <Button
          icon="download"
          size="small"
          variant="transparent"
          onClick={onDownload}
          title={t("download")}
          aria-label={t("download")}
        />
      )}
    </>
  );

  const sizeLabel = formatBytes(file.data?.size);
  const mimeLabel = file.data?.type?.split(";")[0] || "";

  const description = (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      {mimeLabel ? <MimeTypeBadge mimeType={mimeLabel} /> : undefined}
      <span style={{ color: "#666" }}>{sizeLabel}</span>
    </div>
  );

  return (
    <Card
      title={file.name}
      size="small"
      description={description}
      actions={actions}
      headerActions={headerActions}
    />
  );
};

