import { useTheme } from "../theme/ThemeContext";

interface PriorityBadgeProps {
  priority?: number;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
}) => {
  const { Badge } = useTheme();
  return !!priority ? <Badge
    icon="priority"
    bg="informative"
    appearance={"outline"}>
    {priority}
  </Badge> : undefined;
};
