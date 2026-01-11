import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";

interface MimeTypeBadgeProps {
  mimeType?: string;
}

export const MimeTypeBadge: React.FC<MimeTypeBadgeProps> = ({
  mimeType,
}) => {
  const { Badge } = useTheme();
  const { t } = useTranslation('mimeTypes');
  const visibleType = mimeType?.split(';')[0]
  const icon = mimeType?.startsWith("image/") ? "image" : undefined;

  return visibleType ? <Badge
    bg="informative"
    icon={icon}
    title={t('mimeType')}
    appearance={"outline"}
  >
    {t(visibleType)}
  </Badge> : undefined;
};
