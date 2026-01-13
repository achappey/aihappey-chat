import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";

interface ExperimentalBadgeProps {
  size?: string
}

export const ExperimentalBadge: React.FC<ExperimentalBadgeProps> = ({
  size
}) => {
  const { Badge } = useTheme();
  const { t } = useTranslation();

  return <Badge size={size}
    bg="warning"
    icon="warning"
    appearance="filled">
    {t('experimental')}
  </Badge>;
};
