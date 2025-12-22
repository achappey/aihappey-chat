import { useTheme } from "../theme/ThemeContext";

interface MimeTypeBadgeProps {
  mimeType?: string;
  translations?: any
}

export const MimeTypeBadge: React.FC<MimeTypeBadgeProps> = ({
  mimeType,
  translations
}) => {
  const { Badge } = useTheme();
  return mimeType ? <Badge
    bg="informative"
    appearance={"outline"}
  >
    {translations && translations[mimeType] ? translations[mimeType] : mimeType}
  </Badge> : undefined;
};
