import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";

interface CostBadgeProps {
  cost?: number;
}

export const CostBadge: React.FC<CostBadgeProps> = ({
  cost,
}) => {
  const { Badge } = useTheme();
  const { t } = useTranslation();

  const formatCost = (value: number) => {
    const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
    return String(rounded);
  };

  return typeof cost === "number" && Number.isFinite(cost) ? (
    <Badge
      title={`${t("messagePrice")}`}
      icon={"pricing"}
      size="large"
      bg="informative"
      appearance="ghost"
    >
      {formatCost(cost)}
    </Badge>
  ) : undefined;
};

