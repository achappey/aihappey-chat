import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";

interface CostBadgeProps {
  cost?: number;
  size?: string;
}

export const CostBadge: React.FC<CostBadgeProps> = ({
  cost,
  size = "large",
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
        : roundedCost!.toFixed(2)
      : undefined;

  return typeof displayCost === "string" ? (
    <Badge
      title={`${t("messagePrice")}`}
      icon={"pricing"}
      size={size}
      appearance="neutral"
    >
      {displayCost}
    </Badge>
  ) : undefined;
};

