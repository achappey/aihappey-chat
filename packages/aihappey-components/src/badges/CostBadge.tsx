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

  const roundCost = (value: number) =>
    Math.round((value + Number.EPSILON) * 100) / 100;

  const roundedCost =
    typeof cost === "number" && Number.isFinite(cost)
      ? roundCost(cost)
      : undefined;

  return typeof roundedCost === "number" && roundedCost >= 0.01 ? (
    <Badge
      title={`${t("messagePrice")}`}
      icon={"pricing"}
      size="large"
      bg="informative"
      appearance="ghost"
    >
      {String(roundedCost)}
    </Badge>
  ) : undefined;
};

