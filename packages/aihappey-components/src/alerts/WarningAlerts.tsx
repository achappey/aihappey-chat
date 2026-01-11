import { WarningAlert } from "./WarningAlert";

type WarningAlertsProps = {
  warnings: { id: string, message: string }[];
  dismissWarning: (id: string) => void;
};

export function WarningAlerts({ warnings, dismissWarning }: WarningAlertsProps) {
  if (!warnings.length) return null;

  return (
    <>
      {warnings.map((e) => (
        <WarningAlert
          key={e.id}
          warning={e}
          dismissWarning={() => dismissWarning(e.id)}
        />
      ))}
    </>
  );
}

