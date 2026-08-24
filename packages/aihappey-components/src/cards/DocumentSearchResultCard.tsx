import { useTheme } from "../theme/ThemeContext";
import { LimitedTextField } from "../fields/LimitedTextField";

export type DocumentSearchResultCardProps = {
  filename: string;
  content: string;
  score: number;
  hubName?: string;
  scoreFormat?: "percentage" | "raw";
};

export const DocumentSearchResultCard = ({
  filename,
  content,
  score,
  hubName,
  scoreFormat = "percentage",
}: DocumentSearchResultCardProps) => {
  const { Card, Badge } = useTheme();
  const formattedScore = scoreFormat === "raw"
    ? score.toLocaleString(undefined, { maximumFractionDigits: 3 })
    : `${Math.round(score * 100)}%`;
  const description = hubName ? (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      <Badge title={hubName} icon="vectorStore" size="small" appearance="tint">{hubName}</Badge>
      <Badge size="small" appearance="neutral">{formattedScore}</Badge>
    </div>
  ) : formattedScore;

  return (
    <Card title={filename} description={description} size="small">
      <LimitedTextField text={content} />
    </Card>
  );
};
