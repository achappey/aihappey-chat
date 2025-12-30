import { SharedV3Warning } from "aihappey-ai";
import { SharedWarning } from "./SharedWarning";

type SharedWarningsProps = {
  warnings: SharedV3Warning[];
  dismiss?: (warning: SharedV3Warning) => void;
};

export function SharedWarnings({ warnings, dismiss }: SharedWarningsProps) {
  if (!warnings.length) return null;
  return (
    <>
      {warnings.map((w, i) => (
        <SharedWarning warning={w}
          key={i}
          dismiss={dismiss ? () => dismiss(w) : undefined}
        />
      ))}
    </>
  );
}
