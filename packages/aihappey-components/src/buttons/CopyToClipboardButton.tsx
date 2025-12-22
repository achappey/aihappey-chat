import { useTheme } from "../theme/ThemeContext";

type CopyToClipboardButtonProps = {
  size?: string;
  onClick?: () => void
};

export const CopyToClipboardButton = ({ size,
  onClick
}: CopyToClipboardButtonProps) => {
  const { Button } = useTheme();

  return <Button
    icon="copyClipboard"
    variant="subtle"
    size={size}
    onClick={onClick}
  ></Button>;
};