import { SharedWarnings, useTheme } from "aihappey-components";
import type { VideoWarning } from "./useVideoErrors";
import { SharedV4Warning } from "aihappey-ai";

type VideoWarningsProps = {
  warnings: VideoWarning[];
  dismissWarning: (id: string) => void;
};

export function VideoWarnings({ warnings, dismissWarning }: VideoWarningsProps) {
  if (!warnings.length) return null;

  return (
    <SharedWarnings
      warnings={warnings.map((z) => z.raw) as SharedV4Warning[]}
      dismiss={(incoming) => {
        const match = warnings.find(
          (w) => JSON.stringify(w.raw) === JSON.stringify(incoming)
        );

        if (match) {
          dismissWarning(match.id);
        }
      }}
    />
  );
}
