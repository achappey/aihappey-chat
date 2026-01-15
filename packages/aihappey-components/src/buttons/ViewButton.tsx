import { useTheme } from "../theme/ThemeContext";

type ViewButtonProps = {
  disabled?: boolean;
  size?: string;
  variant?: string;
  title?: string;
  text?: string
  onClick?: () => void
};

export const ViewButton = ({ disabled,
  onClick,
  size,
  variant,
  text,
  title
}: ViewButtonProps) => {
  const { Button } = useTheme();

  return <Button
    icon="eye"
    disabled={disabled}
    size={size}
    title={title}
    variant={variant}
    onClick={onClick}
  >{text}</Button>;
};