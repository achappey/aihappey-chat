import { useTranslation } from "aihappey-i18n";
import { ToolCallResult } from "aihappey-types";
import { useTheme } from "../theme/ThemeContext";

interface StructuredContentCardProps {
  result: ToolCallResult;
  title?: string
}

export const StructuredContentCard = ({ result, title }: StructuredContentCardProps) => {
  const { Card, JsonViewer } = useTheme();
  const { t } = useTranslation();

  return (
    <Card
      title={title}
      size="small"
      children={<JsonViewer value={result.structuredContent} />}
    />
  );
};
