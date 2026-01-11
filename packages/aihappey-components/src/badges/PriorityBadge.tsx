import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";

interface PriorityBadgeProps {
  priority?: number;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
}) => {
  const { Badge } = useTheme();
  const { t } = useTranslation();
  return !!priority ? <Badge
    icon="priority"
    title={t('priority')}
    bg="informative"
    appearance={"outline"}>
    {priority}
  </Badge> : undefined;
};
