import { useTheme } from "../theme/ThemeContext";
import { LimitedTextField } from "../fields/LimitedTextField";

export type VectorStoreCardProps = {
  name: string;
  description?: string;
  model: string;
  chunks: number;
  onView: () => void;
  onDelete: () => void;
  labels?: { chunks?: string; view?: string; delete?: string };
};

export const VectorStoreCard = ({
  name,
  description,
  model,
  chunks,
  onView,
  onDelete,
  labels,
}: VectorStoreCardProps) => {
  const { Card, Button, Menu } = useTheme();
  return (
    <Card
        title={name}
        description={`${model} · ${chunks} ${labels?.chunks ?? "chunks"}`}
        size="small"
        actions={<Button icon="eye" size="small" variant="transparent" title={labels?.view ?? "View"} onClick={onView} />}
        headerActions={<Menu items={[{ key: "delete", label: labels?.delete ?? "Delete", danger: true, onClick: onDelete }]} />}
      >
        <LimitedTextField text={description || " "} />
      </Card>
  );
};
