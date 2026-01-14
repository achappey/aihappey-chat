import { useTheme } from "../theme/ThemeContext";

interface BrrrBadgeProps {
  reason?: string | undefined
  size?: string | undefined
}

export const BrrrBadge: React.FC<BrrrBadgeProps> = ({
  reason,
  size
}) => {
  const { Badge } = useTheme();

  return <Badge icon="warning"
    size={size}
    appearance={"filled"}
    bg="warning">{reason ?? "BRRR"}
  </Badge>;
};
