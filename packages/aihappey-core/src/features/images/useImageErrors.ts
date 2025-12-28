import { useCallback, useState } from "react";

export type ImageError = {
  id: string;
  message: string;
};

export type SharedV3Warning =
  | { type: "unsupported"; feature: string; details?: string }
  | { type: "compatibility"; feature: string; details?: string }
  | { type: "other"; message: string };

export type ImageWarning = {
  id: string;
  message: string;
  raw: SharedV3Warning;
};

const formatWarning = (w: SharedV3Warning) => {
  if (w.type === "other") return w.message;

  const prefix = w.type === "unsupported" ? "Unsupported" : "Compatibility";
  const details = w.details ? ` — ${w.details}` : "";
  return `${prefix}: ${w.feature}${details}`;
};

export function useImageErrors() {
  const [errors, setErrors] = useState<ImageError[]>([]);
  const [warnings, setWarnings] = useState<ImageWarning[]>([]);

  const addChatError = useCallback((message: string) => {
    setErrors((prev) => [...prev, { id: crypto.randomUUID(), message }]);
  }, []);

  const dismissError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clearWarnings = useCallback(() => {
    setWarnings([]);
  }, []);

  const addWarnings = useCallback((ws: SharedV3Warning[] | undefined | null) => {
    if (!ws?.length) return;

    setWarnings(
      ws.map((w) => ({
        id: crypto.randomUUID(),
        raw: w,
        message: formatWarning(w),
      }))
    );
  }, []);

  const dismissWarning = useCallback((id: string) => {
    setWarnings((prev) => prev.filter((w) => w.id !== id));
  }, []);

  return {
    errors,
    warnings,
    addChatError,
    dismissError,
    clearWarnings,
    addWarnings,
    dismissWarning,
  };
}
