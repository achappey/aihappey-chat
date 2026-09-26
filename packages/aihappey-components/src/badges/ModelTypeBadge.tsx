import { useTranslation } from "aihappey-i18n";
import { getModelTypeIcon, getModelTypeLabelKey } from "aihappey-types";
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
    size="small"
    icon={getModelTypeIcon(modelType)}
    appearance="neutral"
  >
    {t(getModelTypeLabelKey(modelType))}
  </Badge>
};
