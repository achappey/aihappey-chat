import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";

type ResourceSelectButtonProps = {
  disabled?: boolean;
  onClick: () => void;
};

export const ResourceSelectButton = ({
  disabled,
  onClick,
}: ResourceSelectButtonProps) => {
  const { Button } = useTheme();
  const { t } = useTranslation();

  return (
    <Button
      type="button"
      icon="resources"
      size="large"
      variant="transparent"
      title={t("mcp.resources")}
      disabled={disabled}
      onClick={onClick}
    />
  );
};
