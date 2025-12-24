// useApiRef.ts
import { useEffect, useRef } from "react";

export function useApiRef(value: string) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}
