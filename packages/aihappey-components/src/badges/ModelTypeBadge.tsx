import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";

interface ModelTypeBadgeProps {
  modelType: string;
}

export const ModelTypeBadge: React.FC<ModelTypeBadgeProps> = ({
  modelType,
}) => {
  const { Badge } = useTheme();
  const { t } = useTranslation();

  return <Badge
    bg="informative"
    size="small"
    icon={modelType as any}
    appearance={"outline"}
  >
    {t(modelType)}
  </Badge>
};
