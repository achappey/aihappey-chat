import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";

interface TemperatureBadgeProps {
  temperature?: number;
}

export const TemperatureBadge: React.FC<TemperatureBadgeProps> = ({
  temperature,
}) => {
  const { Badge } = useTheme();
  const { t } = useTranslation();
  return <Badge
    title={t('temperature', { temperature })}
    icon="temperature"
    appearance="ghost"
    size="large"
    bg="informative">
    {temperature}
  </Badge>;
};
