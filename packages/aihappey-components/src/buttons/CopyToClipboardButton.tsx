import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";

type CopyToClipboardButtonProps = {
  size?: string;
  onClick?: () => void
};

export const CopyToClipboardButton = ({ size,
  onClick
}: CopyToClipboardButtonProps) => {
  const { Button } = useTheme();
  const { t } = useTranslation();
  return <Button
    icon="copyClipboard"
    variant="subtle"
    title={t('copyClipboard')}
    size={size}
    onClick={onClick}
  ></Button>;
};