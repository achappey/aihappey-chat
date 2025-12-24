import type { ReasoningUIPart } from "aihappey-ai";
import { useTheme } from "../theme/ThemeContext";

interface ReasoningCardProps {
  block: ReasoningUIPart;
  translations?: any
  renderText?: (text: string) => React.ReactNode;
}

export const ReasoningCard = ({ block, renderText, translations }: ReasoningCardProps) => {
  const { Card } = useTheme();
  return (
    <Card title={translations?.reasoning ?? "reasoning"} size="small">
      {renderText ? renderText(block.text) : block.text}
    </Card>
  );
};
