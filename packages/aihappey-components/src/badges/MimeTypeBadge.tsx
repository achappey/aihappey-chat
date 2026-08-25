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
    icon={icon}
    title={t('mimeType')}
    size="small"
    appearance="neutral"
  >
    {t(visibleType)}
  </Badge> : undefined;
};
