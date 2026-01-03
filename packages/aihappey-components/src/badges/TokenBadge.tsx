import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";

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
      bg="subtle"
      appearance="ghost">
      {totalTokens}
    </Badge>
  ) : undefined;
};
