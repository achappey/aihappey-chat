import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";

interface ContextWindowBadgeProps {
  context_window: number;
}

export const ContextWindowBadge: React.FC<ContextWindowBadgeProps> = ({
  context_window,
}) => {
  const { Badge } = useTheme();
  const { t, i18n } = useTranslation();

  const fmt = new Intl.NumberFormat(i18n.language, {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1
  });

  return <Badge
    icon="contextWindow"
    title={t('contextWindow')}
    bg="subtle"
    size="small"
    appearance={"tint"}>
    {fmt.format(context_window)}
  </Badge>;
};
