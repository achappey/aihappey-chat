import { useMemo } from "react";
import { useTheme } from "../theme/ThemeContext";
import type { MenuItemProps } from "aihappey-types";
import { useTranslation } from "aihappey-i18n";
import { MimeTypeBadge } from "../badges";

export type FileCardItem = {
  id: string;
  name: string;
  createdAt: number;
  data: Blob;
};

export type FileCardProps = {
  file: FileCardItem;
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

function formatCreatedAt(ts: number): string {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

export const FileCard = ({ file, onDelete, onDownload }: FileCardProps) => {
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

