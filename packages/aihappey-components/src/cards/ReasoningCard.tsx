import type { ReasoningUIPart } from "aihappey-ai";
import { useTheme } from "../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

interface ReasoningCardProps {
  block: ReasoningUIPart;
  renderText?: (text: string) => React.ReactNode;
}

export const ReasoningCard = ({ block, renderText }: ReasoningCardProps) => {
  const { Card } = useTheme();
  const { t } = useTranslation();

  return (
    <Card title={t("reasoning")} size="small">
      {renderText ? renderText(block.text) : block.text}
    </Card>
  );
};
