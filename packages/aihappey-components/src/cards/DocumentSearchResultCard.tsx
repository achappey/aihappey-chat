import { useTheme } from "../theme/ThemeContext";
import { LimitedTextField } from "../fields/LimitedTextField";

export type DocumentSearchResultCardProps = {
  filename: string;
  content: string;
  score: number;
};

export const DocumentSearchResultCard = ({ filename, content, score }: DocumentSearchResultCardProps) => {
  const { Card } = useTheme();
  return (
    <Card title={filename} description={`${Math.round(score * 100)}%`} size="small">
      <LimitedTextField text={content} />
    </Card>
  );
};
