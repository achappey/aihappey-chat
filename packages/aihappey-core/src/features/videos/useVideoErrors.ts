import { useState } from "react";

export type VideoError = {
  id: string;
  message: string;
};

export type VideoWarning = {
  id: string;
  message: string;
  raw: unknown;
};

export function useVideoErrors() {
  const [errors, setErrors] = useState<VideoError[]>([]);
  const [warnings, setWarnings] = useState<VideoWarning[]>([]);

  const addVideoError = (message: string) => {
    setErrors((prev) => [
      ...prev,
      { id: crypto.randomUUID(), message },
    ]);
  };

  const addWarnings = (items: Array<{ message?: string }>) => {
    const mapped = (items ?? [])
      .map((w) => w?.message)
      .filter(Boolean)
      .map((message, index) => ({
        id: crypto.randomUUID(),
        message: message as string,
        raw: items[index],
      }));
    if (mapped.length) setWarnings((prev) => [...prev, ...mapped]);
  };

  const clearWarnings = () => setWarnings([]);

  const dismissError = (id: string) =>
    setErrors((prev) => prev.filter((e) => e.id !== id));

  const dismissWarning = (id: string) =>
    setWarnings((prev) => prev.filter((w) => w.id !== id));

  return {
    errors,
    warnings,
    addVideoError,
    addWarnings,
    clearWarnings,
    dismissError,
    dismissWarning,
  };
}
