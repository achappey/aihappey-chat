import { useEffect } from "react";
import { errorRuntime } from "../../runtime/chat-app/errorRuntime";

export function ErrorLog() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      errorRuntime.push({
        type: "js",
        message: e.message,
        source: e.filename,
        severity: "error",
      });
    };

    const onRejection = (e: PromiseRejectionEvent) => {
      errorRuntime.push({
        type: "promise",
        message: String(e.reason),
        severity: "error",
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
