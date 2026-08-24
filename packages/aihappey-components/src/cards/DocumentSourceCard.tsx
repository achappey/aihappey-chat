import { useTheme } from "../theme/ThemeContext";

export type DocumentSourceCardProps = {
  filename: string;
  chunks: number;
  characters: number;
  onDelete?: () => void;
  labels?: { chunks?: string; characters?: string; delete?: string };
};

export const DocumentSourceCard = ({ filename, chunks, characters, onDelete, labels }: DocumentSourceCardProps) => {
  const { Card, Button, Badge } = useTheme();
  const locale = typeof navigator !== "undefined" ? navigator.languages : undefined;
  const formatNumber = (value: number) => new Intl.NumberFormat(locale).format(value);
  const chunksLabel = labels?.chunks ?? "chunks";
  const charactersLabel = labels?.characters ?? "characters";
  return (
    <Card
      title={filename}
      size="small"
      description={(
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Badge size="small" bg="subtle" icon="chunks" title={`${formatNumber(chunks)} ${chunksLabel}`}>
            {formatNumber(chunks)}
          </Badge>
          <Badge size="small" bg="subtle" icon="characters" title={`${formatNumber(characters)} ${charactersLabel}`}>
            {formatNumber(characters)}
          </Badge>
        </div>
      )}
      actions={onDelete ? <Button icon="delete" size="small" variant="transparent" title={labels?.delete ?? "Delete"} onClick={onDelete} /> : undefined}
    />
  );
};
