import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";

interface TextCardProps {
  block: { type: "text"; text: string };
  renderText?: (text: string) => React.ReactNode;
}

export const TextCard = ({ block, renderText }: TextCardProps) => {
  const { Card } = useTheme();
  const { t } = useTranslation();
  return (
    <Card title={t('text')} size="small">
      {renderText ? renderText(block.text) : block.text}
    </Card>
  );
};
