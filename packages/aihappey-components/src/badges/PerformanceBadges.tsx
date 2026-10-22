import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";

interface PerformanceBadgeProps {
  value?: number;
  size?: string;
}

const isValidMetric = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

export const TimeToFirstTokenBadge = ({ value, size = "large" }: PerformanceBadgeProps) => {
  const { Badge } = useTheme();
  const { t } = useTranslation();

  if (!isValidMetric(value)) return null;

  return (
    <Badge
      title={t("timeToFirstToken")}
      icon="timeToFirstToken"
      size={size}
      appearance="neutral"
    >
      {new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value)} s
    </Badge>
  );
};

export const TokensPerSecondBadge = ({ value, size = "large" }: PerformanceBadgeProps) => {
  const { Badge } = useTheme();
  const { t } = useTranslation();

  if (!isValidMetric(value)) return null;

  return (
    <Badge
      title={t("tokensPerSecond")}
      icon="tokensPerSecond"
      size={size}
      appearance="neutral"
    >
      {new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value)} tok/s
    </Badge>
  );
};
