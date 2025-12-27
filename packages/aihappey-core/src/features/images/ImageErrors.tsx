import React from "react";
import { useTheme } from "aihappey-components";
import type { ImageError } from "./useImageErrors";

type ImageErrorsProps = {
  errors: ImageError[];
  dismissError: (id: string) => void;
};

export function ImageErrors({ errors, dismissError }: ImageErrorsProps) {
  const { Alert } = useTheme();

  if (!errors.length) return null;

  return (
    <>
      {errors.map((e) => (
        <Alert
          key={e.id}
          variant="error"
          onDismiss={() => dismissError(e.id)}
          title="Error"
        >
          {e.message}
        </Alert>
      ))}
    </>
  );
}
