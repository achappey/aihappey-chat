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

  return mimeType ? <Badge
    bg="informative"
    appearance={"outline"}
  >
    {t(mimeType)}
  </Badge> : undefined;
};
