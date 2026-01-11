import { ErrorAlert } from "./ErrorAlert";

type ErrorAlertsProps = {
  errors: { id: string, message: string }[];
  dismissError: (id: string) => void;
};

export function ErrorAlerts({ errors, dismissError }: ErrorAlertsProps) {
  if (!errors.length) return null;

  return (
    <>
      {errors.map((e) => (
        <ErrorAlert
          key={e.id}
          error={e}
          dismissError={() => dismissError(e.id)}
        />
      ))}
    </>
  );
}

