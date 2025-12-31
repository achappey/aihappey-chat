import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";

interface AiWarningBadgeProps {
  size?: string
}

export const AiWarningBadge: React.FC<AiWarningBadgeProps> = ({
  size
}) => {
  const { Badge } = useTheme();
  const { t } = useTranslation();
  return <Badge size={size} bg="warning" appearance="ghost">
    {t('generatedByAi')}
  </Badge>;
};
