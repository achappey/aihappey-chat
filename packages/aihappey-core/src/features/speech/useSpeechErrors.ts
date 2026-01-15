import { useCallback, useState } from "react";
import type { SharedV3Warning } from "aihappey-ai";

export type SpeechError = {
  id: string;
  message: string;
};

export type SpeechWarning = {
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

export function useSpeechErrors() {
  const [errors, setErrors] = useState<SpeechError[]>([]);
  const [warnings, setWarnings] = useState<SpeechWarning[]>([]);

  const addError = useCallback((message: string) => {
    setErrors((prev) => [...prev, { id: crypto.randomUUID(), message }]);
  }, []);

  const dismissError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const addWarnings = useCallback((ws: SharedV3Warning[] | undefined | null) => {
    if (!ws?.length) return;

    setWarnings((prev) => [
      ...prev,
      ...ws.map((w) => ({ id: crypto.randomUUID(), raw: w, message: formatWarning(w) })),
    ]);
  }, []);

  const dismissWarning = useCallback((id: string) => {
    setWarnings((prev) => prev.filter((w) => w.id !== id));
  }, []);

  return {
    errors,
    warnings,
    addError,
    dismissError,
    addWarnings,
    dismissWarning,
  };
}
