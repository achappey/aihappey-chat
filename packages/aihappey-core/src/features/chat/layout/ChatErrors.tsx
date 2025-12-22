import React from "react";
import { useChatErrors } from "./useChatErrors";
import { useTheme } from "aihappey-components";


export function ChatErrors() {
  const { errors, dismissError } = useChatErrors();
  const { Alert } = useTheme();

  if (!errors?.length) return null;

  return (
    <>
      {errors.map((e) => (
        <Alert
          key={e}
          variant={"error"}
          onDismiss={() => dismissError(e)}
          title={"Error"}
        >
          {e}
        </Alert>
      ))}
    </>
  );
}
