// useAbortRun.ts
import { useCallback, useRef } from "react";

export function useAbortRun(stop: () => Promise<void>) {
  const abortRef = useRef<AbortController | null>(null);

  const startRun = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
  }, []);

  const cancelRun = useCallback(async () => {
    abortRef.current?.abort();
    await stop();
  }, [stop]);

  return {
    abortRef,
    startRun,
    cancelRun,
    signal: abortRef.current?.signal, // convenience
  };
}
