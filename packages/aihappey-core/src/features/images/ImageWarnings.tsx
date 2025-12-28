import React from "react";
import { useTheme } from "aihappey-components";
import type { ImageWarning } from "./useImageErrors";

type ImageWarningsProps = {
  warnings: ImageWarning[];
  dismissWarning: (id: string) => void;
};

export function ImageWarnings({ warnings, dismissWarning }: ImageWarningsProps) {
  const { Alert } = useTheme();

  if (!warnings.length) return null;

  return (
    <>
      {warnings.map((w) => (
        <Alert
          key={w.id}
          // if your Alert supports "warning", use it.
          // if not, change this to whatever your theme supports (e.g. "info").
          variant="warning"
          onDismiss={() => dismissWarning(w.id)}
          title="Warning"
        >
          {w.message}
        </Alert>
      ))}
    </>
  );
}
