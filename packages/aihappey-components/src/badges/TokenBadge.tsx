import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";
import { useDarkMode } from "usehooks-ts";

interface TokenBadgeProps {
  totalTokens?: number;
}

export const TokenBadge: React.FC<TokenBadgeProps> = ({
  totalTokens,
}) => {
  const { Badge } = useTheme();
  const { t } = useTranslation();

  return totalTokens && totalTokens > 0 ? (
    <Badge title={t('totalTokens')}
      icon={"code"}
      size="large"
      appearance="ghost">
      {totalTokens}
    </Badge>
  ) : undefined;
};
