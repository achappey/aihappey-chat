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

  const displayCost =
    typeof cost === "number" && Number.isFinite(cost)
      ? roundedCost === 0 && cost > 0
        ? "0.00>"
        : String(roundedCost)
      : undefined;

  return typeof displayCost === "string" ? (
    <Badge
      title={`${t("messagePrice")}`}
      icon={"pricing"}
      size="large"
      bg="informative"
      appearance="ghost"
    >
      {displayCost}
    </Badge>
  ) : undefined;
};

