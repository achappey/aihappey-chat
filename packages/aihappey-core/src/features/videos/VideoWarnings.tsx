import { SharedWarnings, useTheme } from "aihappey-components";
import type { VideoWarning } from "./useVideoErrors";
import { SharedV3Warning } from "aihappey-ai";

type VideoWarningsProps = {
  warnings: VideoWarning[];
  dismissWarning: (id: string) => void;
};

export function VideoWarnings({ warnings, dismissWarning }: VideoWarningsProps) {
  if (!warnings.length) return null;

  return (
    <SharedWarnings
      warnings={warnings.map((z) => z.raw) as SharedV3Warning[]}
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
