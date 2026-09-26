import { useState } from "react";
import type { SharedV4Warning } from "aihappey-ai";

export type VideoError = {
  id: string;
  message: string;
};

export type VideoWarning = {
  id: string;
  raw: SharedV4Warning;
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

  const addWarnings = (items: SharedV4Warning[] | undefined | null) => {
    if (!items?.length) return;
    setWarnings((prev) => [
      ...prev,
      ...items.map((raw) => ({ id: crypto.randomUUID(), raw })),
    ]);
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
