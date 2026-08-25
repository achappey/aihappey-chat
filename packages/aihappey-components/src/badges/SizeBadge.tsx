import { formatFileSize } from "../cards/formatFileSize";
import { useTheme } from "../theme/ThemeContext";

export interface SizeBadgeProps {
  bytes?: number;
}

export const SizeBadge = ({ bytes }: SizeBadgeProps) => {
  const { Badge } = useTheme();
  const label = formatFileSize(bytes);

  return label ? (
    <Badge size="small" appearance="neutral">
      {label}
    </Badge>
  ) : undefined;
};
