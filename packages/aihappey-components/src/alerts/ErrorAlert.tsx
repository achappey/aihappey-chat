import { useTheme } from "../theme/ThemeContext";

type ErrorAlertProps = {
  error: { id: string, message: string };
  dismissError: () => void;
};

export function ErrorAlert({ error, dismissError }: ErrorAlertProps) {
  const { Alert } = useTheme();

  return (
    <Alert
      variant="error"
      onDismiss={() => dismissError()}
      title="Error"
    >
      {error.message}
    </Alert>
  );
}

