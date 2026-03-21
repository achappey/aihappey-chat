import { SharedV4Warning } from "aihappey-ai";
import { SharedWarning } from "./SharedWarning";

type SharedWarningsProps = {
  warnings: SharedV4Warning[];
  dismiss?: (warning: SharedV4Warning) => void;
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
