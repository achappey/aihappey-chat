import { useTheme } from "../theme/ThemeContext";

type OpenLinkButtonProps = {
  disabled?: boolean;
  size?: string
  variant?: string
  title?: string
  text?: string
  url: string
};

export const OpenLinkButton = ({ disabled,
  url,
  variant,
  title,
  text,
  size
}: OpenLinkButtonProps) => {
  const { Button } = useTheme();

  return <Button
    icon="openLink"
    variant={variant}
    disabled={disabled}
    title={title ?? url}
    size={size}
    onClick={() => window.open(url, "_blank")}
  >{text}</Button>;
};