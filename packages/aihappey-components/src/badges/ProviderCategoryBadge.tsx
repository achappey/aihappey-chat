import { useTranslation } from "aihappey-i18n";
import type { ProviderCategory } from "aihappey-types";
import { useTheme } from "../theme/ThemeContext";

interface ProviderCategoryBadgeProps {
  category: ProviderCategory;
  size?: string;
}

export const ProviderCategoryBadge: React.FC<ProviderCategoryBadgeProps> = ({
  category,
  size = "small",
}) => {
  const { Badge } = useTheme();
  const { t } = useTranslation();

  return (
    <Badge
      size={size}
      bg="subtle"
      icon={category}
      appearance="filled"
      title={t(`ai.providerCategories.${category}.description`)}
    >
      {t(`ai.providerCategories.${category}.label`)}
    </Badge>
  );
};
