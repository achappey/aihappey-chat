import { useTheme } from "../theme/ThemeContext";

export type DocumentSourceCardProps = {
  filename: string;
  chunks: number;
  characters: number;
  onDelete?: () => void;
  labels?: { chunks?: string; characters?: string; delete?: string };
};

export const DocumentSourceCard = ({ filename, chunks, characters, onDelete, labels }: DocumentSourceCardProps) => {
  const { Card, Button } = useTheme();
  return (
    <Card
      title={filename}
      size="small"
      description={`${chunks} ${labels?.chunks ?? "chunks"} · ${characters.toLocaleString()} ${labels?.characters ?? "characters"}`}
      actions={onDelete ? <Button icon="delete" size="small" variant="transparent" title={labels?.delete ?? "Delete"} onClick={onDelete} /> : undefined}
    />
  );
};
