import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";
import { IconToken } from "aihappey-types";

type OpenLinkButtonProps = {
  disabled?: boolean;
  size?: string
  variant?: string
  text?: string
  tooltip?: string
  icon?: IconToken
  url: string
};

export const OpenLinkButton = ({ disabled,
  url,
  variant,
  icon,
  tooltip,
  text,
  size
}: OpenLinkButtonProps) => {
  const { Button } = useTheme();
  const { t } = useTranslation();

  return <Button
    icon={icon ?? "openLink"}
    variant={variant}
    disabled={disabled}
    title={tooltip ?? t('newWindow')}
    size={size}
    onClick={() => window.open(url, "_blank")}
  >{text}</Button>;
};