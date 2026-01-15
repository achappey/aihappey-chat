import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";

interface MaxOutputTokensBadgeProps {
  mex_output_tokens: number;
}

export const MaxOutputTokensBadge: React.FC<MaxOutputTokensBadgeProps> = ({
  mex_output_tokens,
}) => {
  const { Badge } = useTheme();
  const { t, i18n } = useTranslation();

  const fmt = new Intl.NumberFormat(i18n.language, {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1
  });

  return <Badge
    icon="maxOutputTokens"
    title={t('maxOutputTokens')}
    bg="subtle"
    size="small"
    appearance={"tint"}>
    {fmt.format(mex_output_tokens)}
  </Badge>;
};
