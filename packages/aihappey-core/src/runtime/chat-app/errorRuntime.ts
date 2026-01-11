import { useSyncExternalStore } from "react";

export type RuntimeError = {
  id: string;
  ts: number;
  type: "js" | "promise" | "fetch" | "provider" | "tool";
  message: string;
  source?: string;
  severity?: "info" | "warn" | "error";
};

class ErrorRuntime {
  private errors: RuntimeError[] = [];
  private snapshot: RuntimeError[] = [];
  private listeners = new Set<() => void>();
  private max = 50; // ring buffer

  subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.snapshot = [...this.errors];
    this.listeners.forEach(l => l());
  }

  push(error: Omit<RuntimeError, "id" | "ts">) {
    this.errors.push({
      id: crypto.randomUUID(),
      ts: Date.now(),
      ...error,
    });
    
    if (this.errors.length > this.max) {
      this.errors.shift();
    }

    this.notify();
  }

  clear() {
    this.errors = [];
    this.notify();
  }

  getSnapshot() {
    return this.snapshot;
  }
}

export function useRuntimeErrors(runtime: ErrorRuntime) {
  return useSyncExternalStore(
    cb => runtime.subscribe(cb),
    () => runtime.getSnapshot(),
    () => []
  );
}

export const errorRuntime = new ErrorRuntime();
