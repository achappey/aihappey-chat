import React from "react";
import { SharedWarnings } from "aihappey-components";
import type { TranscriptionSharedWarning } from "./useTranscriptionErrors";

type TranscriptionWarningsProps = {
  warnings: TranscriptionSharedWarning[];
  dismissWarning: (id: string) => void;
};

export function TranscriptionWarnings({ warnings, dismissWarning }: TranscriptionWarningsProps) {
  if (!warnings.length) return null;

  return (
    <SharedWarnings
      warnings={warnings.map((w) => w.raw)}
      dismiss={(incoming) => {
        const match = warnings.find((w) => JSON.stringify(w.raw) === JSON.stringify(incoming));
        if (match) dismissWarning(match.id);
      }}
    />
  );
}

