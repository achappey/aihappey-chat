import { useTheme } from "../theme/ThemeContext";
import { LimitedTextField } from "../fields/LimitedTextField";

export type VectorStoreCardProps = {
  name: string;
  description?: string;
  model: string;
  chunks: number;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  labels?: { chunks?: string; edit?: string; delete?: string };
};

export const VectorStoreCard = ({
  name,
  description,
  model,
  chunks,
  onOpen,
  onEdit,
  onDelete,
  labels,
}: VectorStoreCardProps) => {
  const { Card, Button, Menu } = useTheme();
  return (
    <div onClick={onOpen} role="button" tabIndex={0} onKeyDown={(event) => event.key === "Enter" && onOpen()}>
      <Card
        title={name}
        description={`${model} · ${chunks} ${labels?.chunks ?? "chunks"}`}
        size="small"
        actions={<Button icon="edit" size="small" variant="transparent" title={labels?.edit ?? "Edit"} onClick={(event: any) => { event.stopPropagation(); onEdit(); }} />}
        headerActions={<div onClick={(event) => event.stopPropagation()}><Menu items={[{ key: "delete", label: labels?.delete ?? "Delete", danger: true, onClick: onDelete }]} /></div>}
      >
        <LimitedTextField text={description || " "} />
      </Card>
    </div>
  );
};
