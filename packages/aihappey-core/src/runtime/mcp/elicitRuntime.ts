import { ElicitRequest, ElicitResult } from "aihappey-mcp";
import { useSyncExternalStore } from "react";

type OpenElicit = {
  id: string;
  createdAt: number;
  request: ElicitRequest;
};

class ElicitRuntime {
  private pending = new Map<
    string,
    { createdAt: number, request: ElicitRequest; resolve: (r: ElicitResult) => void }
  >();

  private snapshot: OpenElicit[] = [];
  private listeners = new Set<() => void>();

  subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.snapshot = Array.from(this.pending.entries()).map(
      ([id, entry]) => ({ id, createdAt: entry.createdAt, request: entry.request })
    );
    this.listeners.forEach(l => l());
  }

  onElicit(_server: string, request: ElicitRequest): Promise<ElicitResult> {
    const id = crypto.randomUUID();
    console.log("ELICIT", { id, request });
    return new Promise(resolve => {
      this.pending.set(id, { createdAt: Date.now(), request, resolve });
      this.notify();
    });
  }

  respond(id: string, result: ElicitResult) {
    const entry = this.pending.get(id);
    if (!entry) return;

    entry.resolve(result);
    this.pending.delete(id);
    this.notify();
  }

  getSnapshot() {
    return this.snapshot;
  }
}

export function useOpenElicits(runtime: ElicitRuntime) {
  return useSyncExternalStore(
    cb => runtime.subscribe(cb),
    () => runtime.getSnapshot(),
    () => []
  );
}

export const elicitRuntime = new ElicitRuntime();
