import { useCallback, useState } from "react";
import type { SharedV3Warning } from "aihappey-ai";

export type RerankingError = {
  id: string;
  message: string;
};

export type RerankingWarning = {
  id: string;
  raw: SharedV3Warning;
};

export type RerankingConversionWarning = {
  id: string;
  message: string;
};

export function useRerankingErrors() {
  const [errors, setErrors] = useState<RerankingError[]>([]);
  const [warnings, setWarnings] = useState<RerankingWarning[]>([]);
  const [conversionWarnings, setConversionWarnings] = useState<RerankingConversionWarning[]>([]);

  const addError = useCallback((message: string) => {
    setErrors((prev) => [...prev, { id: crypto.randomUUID(), message }]);
  }, []);

  const dismissError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clearWarnings = useCallback(() => {
    setWarnings([]);
  }, []);

  const addConversionWarning = useCallback((message: string) => {
    setConversionWarnings((prev) => [...prev, { id: crypto.randomUUID(), message }]);
  }, []);

  const addWarnings = useCallback((ws: SharedV3Warning[] | undefined | null) => {
    if (!ws?.length) return;

    setWarnings(ws.map((w) => ({ id: crypto.randomUUID(), raw: w })));
  }, []);

  const dismissWarning = useCallback((id: string) => {
    setWarnings((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const dismissConversionWarning = useCallback((id: string) => {
    setConversionWarnings((prev) => prev.filter((w) => w.id !== id));
  }, []);

  return {
    errors,
    warnings,
    conversionWarnings,
    addError,
    dismissError,
    clearWarnings,
    addWarnings,
    dismissWarning,
    addConversionWarning,
    dismissConversionWarning,
  };
}

