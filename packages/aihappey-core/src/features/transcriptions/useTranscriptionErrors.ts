import { useCallback, useState } from "react";
import type { SharedV3Warning } from "aihappey-ai";

export type TranscriptionError = {
  id: string;
  message: string;
};

export type TranscriptionWarning = {
  id: string;
  message: string;
};

export type TranscriptionSharedWarning = {
  id: string;
  raw: SharedV3Warning;
};

export function useTranscriptionErrors() {
  const [errors, setErrors] = useState<TranscriptionError[]>([]);
  const [warnings, setWarnings] = useState<TranscriptionWarning[]>([]);
  const [sharedWarnings, setSharedWarnings] = useState<TranscriptionSharedWarning[]>([]);

  const addError = useCallback((message: string) => {
    setErrors((prev) => [...prev, { id: crypto.randomUUID(), message }]);
  }, []);

  const dismissError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const addWarning = useCallback((message: string) => {
    setWarnings((prev) => [...prev, { id: crypto.randomUUID(), message }]);
  }, []);

  const dismissWarning = useCallback((id: string) => {
    setWarnings((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const clearSharedWarnings = useCallback(() => {
    setSharedWarnings([]);
  }, []);

  const addSharedWarnings = useCallback((ws: SharedV3Warning[] | undefined | null) => {
    if (!ws?.length) return;
    setSharedWarnings((prev) => [...prev, ...ws.map((w) => ({ id: crypto.randomUUID(), raw: w }))]);
  }, []);

  const dismissSharedWarning = useCallback((id: string) => {
    setSharedWarnings((prev) => prev.filter((w) => w.id !== id));
  }, []);

  return {
    errors,
    warnings,
    sharedWarnings,
    addError,
    dismissError,
    addWarning,
    dismissWarning,
    clearSharedWarnings,
    addSharedWarnings,
    dismissSharedWarning,
  };
}

