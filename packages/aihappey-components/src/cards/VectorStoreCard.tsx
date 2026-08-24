import { useTheme } from "../theme/ThemeContext";
import { LimitedTextField } from "../fields/LimitedTextField";
import { formatFileSize } from "./formatFileSize";

export type VectorStoreCardProps = {
  name: string;
  description?: string;
  model: string;
  size: number;
  onView: () => void;
  onDownload?: () => void;
  onDelete: () => void;
  labels?: { view?: string; download?: string; delete?: string };
};

export const VectorStoreCard = ({
  name,
  description,
  model,
  size,
  onView,
  onDownload,
  onDelete,
  labels,
}: VectorStoreCardProps) => {
  const { Card, Button, Menu, Badge } = useTheme();
  return (
    <Card
        title={name}
        description={(
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <Badge title={model} icon="brain" size="small" appearance="tint">{model}</Badge>
            <Badge size="small" appearance="neutral">{formatFileSize(size)}</Badge>
          </div>
        )}
        size="small"
        actions={(
          <div style={{ display: "flex", alignItems: "center" }}>
            <Button icon="eye" size="small" variant="transparent" title={labels?.view ?? "View"} onClick={onView} />
            {onDownload && <Button icon="download" size="small" variant="transparent" title={labels?.download ?? "Download"} onClick={onDownload} />}
          </div>
        )}
        headerActions={<Menu items={[{ key: "delete", label: labels?.delete ?? "Delete", onClick: onDelete }]} />}
      >
        <LimitedTextField text={description || " "} />
      </Card>
  );
};
