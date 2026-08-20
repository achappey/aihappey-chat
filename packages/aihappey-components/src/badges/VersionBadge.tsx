import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";

export type VersionBadgeProps = {
  version: string;
};

export const VersionBadge = ({ version }: VersionBadgeProps) => {
  const { Badge } = useTheme();
  const { t } = useTranslation();

  return (
    <Badge size="small" bg="subtle" icon="version" title={t("version")}>
      {version}
    </Badge>
  );
};
