import { useCallback, useState } from "react";

export type ImageError = {
  id: string;
  message: string;
};

export function useImageErrors() {
  const [errors, setErrors] = useState<ImageError[]>([]);

  const addChatError = useCallback((message: string) => {
    setErrors((prev) => [
      ...prev,
      { id: crypto.randomUUID(), message }
    ]);
  }, []);

  const dismissError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { errors, addChatError, dismissError };
}
