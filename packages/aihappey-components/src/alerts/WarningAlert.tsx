import { useTheme } from "../theme/ThemeContext";

type WarningAlertProps = {
  warning: { id: string, message: string };
  dismissWarning: () => void;
};

export function WarningAlert({ warning, dismissWarning }: WarningAlertProps) {
  const { Alert } = useTheme();

  return (
    <Alert
      variant="warning"
      onDismiss={() => dismissWarning()}
      title="Warning"
    >
      {warning.message}
    </Alert>
  );
}

