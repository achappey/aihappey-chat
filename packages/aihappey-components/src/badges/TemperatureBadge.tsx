import { useTheme } from "../theme/ThemeContext";

interface TemperatureBadgeProps {
  temperature?: number;
}

export const TemperatureBadge: React.FC<TemperatureBadgeProps> = ({
  temperature,
}) => {
  const { Badge } = useTheme();
  return <Badge
    icon="temperature"
    appearance="ghost"
    size="large"
    bg="subtle">
    {temperature}
  </Badge>;
};
