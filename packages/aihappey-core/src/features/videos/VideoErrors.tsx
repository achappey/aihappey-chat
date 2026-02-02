import { useTheme } from "aihappey-components";
import type { VideoError } from "./useVideoErrors";

type VideoErrorsProps = {
  errors: VideoError[];
  dismissError: (id: string) => void;
};

export function VideoErrors({ errors, dismissError }: VideoErrorsProps) {
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
