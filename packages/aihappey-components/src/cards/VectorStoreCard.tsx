import { useTheme } from "../theme/ThemeContext";
import { LimitedTextField } from "../fields/LimitedTextField";
import { formatFileSize } from "./formatFileSize";

export type VectorStoreCardProps = {
  name: string;
  description?: string;
  model: string;
  size: number;
  onView: () => void;
  onDelete: () => void;
  labels?: { view?: string; delete?: string };
};

export const VectorStoreCard = ({
  name,
  description,
  model,
  size,
  onView,
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
        actions={<Button icon="eye" size="small" variant="transparent" title={labels?.view ?? "View"} onClick={onView} />}
        headerActions={<Menu items={[{ key: "delete", label: labels?.delete ?? "Delete", onClick: onDelete }]} />}
      >
        <LimitedTextField text={description || " "} />
      </Card>
  );
};
