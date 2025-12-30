import React from "react";
import { SharedWarnings, useTheme } from "aihappey-components";
import type { ImageWarning } from "./useImageErrors";
import { SharedV3Warning } from "aihappey-ai";

type ImageWarningsProps = {
  warnings: ImageWarning[];
  dismissWarning: (id: string) => void;
};

export function ImageWarnings({ warnings, dismissWarning }: ImageWarningsProps) {
  if (!warnings.length) return null;

  return <SharedWarnings warnings={warnings.map(z => z.raw)}
    dismiss={(incoming) => {
      const match = warnings.find(w =>
        JSON.stringify(w.raw) === JSON.stringify(incoming)
      );

      if (match) {
        dismissWarning(match.id);
      }
    }} />
}
