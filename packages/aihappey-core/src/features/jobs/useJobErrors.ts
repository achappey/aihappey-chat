import { useCallback, useState } from "react";

export type JobError = {
  id: string;
  message: string;
};

export type JobWarning = {
  id: string;
  message: string;
  raw: unknown;
};

export function useJobErrors() {
  const [errors, setErrors] = useState<JobError[]>([]);
  const [warnings, setWarnings] = useState<JobWarning[]>([]);

  const addError = useCallback((message: string) => {
    setErrors((prev) => [...prev, { id: crypto.randomUUID(), message }]);
  }, []);

  const dismissError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const addWarnings = useCallback((messages: unknown[] | undefined | null) => {
    if (!messages?.length) return;
    setWarnings((prev) => [
      ...prev,
      ...messages.map((raw) => ({
        id: crypto.randomUUID(),
        raw,
        message: typeof raw === "string" ? raw : JSON.stringify(raw),
      })),
    ]);
  }, []);

  const dismissWarning = useCallback((id: string) => {
    setWarnings((prev) => prev.filter((w) => w.id !== id));
  }, []);

  return { errors, warnings, addError, dismissError, addWarnings, dismissWarning };
}

