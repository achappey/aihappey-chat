import { useTheme } from "../theme/ThemeContext";

interface AiWarningBadgeProps {
  label?: string;
  size?: string
}

export const AiWarningBadge: React.FC<AiWarningBadgeProps> = ({
  label,
  size
}) => {
  const { Badge } = useTheme();

  return <Badge size={size} bg="warning" appearance="ghost">
    {label}
  </Badge>;
};
