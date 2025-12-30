import { SharedV3Warning } from "aihappey-ai";
import { useTheme } from "../theme/ThemeContext";

type SharedWarningProps = {
  warning: SharedV3Warning;
  dismiss?: () => void;
};

export function SharedWarning({ warning, dismiss }: SharedWarningProps) {
  const { Alert } = useTheme();

  const message = warning.type == "other" ? warning.message
    : `${warning.type}: ${warning.feature}. ${warning.details ?? ""}`.trim();

  return (
    <Alert
      variant="warning"
      onDismiss={dismiss}
      title="Warning"
    >
      {message}
    </Alert>
  );
}
