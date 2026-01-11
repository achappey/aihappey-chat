import React from "react";
import { SharedWarnings } from "aihappey-components";
import type { RerankingWarning } from "./useRerankingErrors";

type RerankingWarningsProps = {
  warnings: RerankingWarning[];
  dismissWarning: (id: string) => void;
};

export function RerankingWarnings({ warnings, dismissWarning }: RerankingWarningsProps) {
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

