import { useTheme } from "../theme/ThemeContext";

type ViewOutputButtonProps = {
  disabled?: boolean;
  onClick?: () => void
};

export const ViewOutputButton = ({ disabled,
  onClick
}: ViewOutputButtonProps) => {
  const { Button } = useTheme();

  return <Button
    icon="eye"
    disabled={disabled}
    size="small"
    onClick={onClick}
  ></Button>;
};