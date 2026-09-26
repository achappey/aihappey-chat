import { SharedWarnings } from "aihappey-components";
import type { VideoWarning } from "./useVideoErrors";

type VideoWarningsProps = {
  warnings: VideoWarning[];
  dismissWarning: (id: string) => void;
};

export function VideoWarnings({ warnings, dismissWarning }: VideoWarningsProps) {
  if (!warnings.length) return null;

  return (
    <SharedWarnings
      warnings={warnings.map((z) => z.raw)}
      dismiss={(incoming) => {
        const match = warnings.find((w) => w.raw === incoming);

        if (match) {
          dismissWarning(match.id);
        }
      }}
    />
  );
}
