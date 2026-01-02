import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";

type OpenLinkButtonProps = {
  disabled?: boolean;
  size?: string
  variant?: string
  text?: string
  url: string
};

export const OpenLinkButton = ({ disabled,
  url,
  variant,
  text,
  size
}: OpenLinkButtonProps) => {
  const { Button } = useTheme();
  const { t } = useTranslation();

  return <Button
    icon="openLink"
    variant={variant}
    disabled={disabled}
    title={t('newWindow')}
    size={size}
    onClick={() => window.open(url, "_blank")}
  >{text}</Button>;
};