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

  onElicit(_server: string, request: ElicitRequest, signal?: AbortSignal): Promise<ElicitResult> {
    const id = crypto.randomUUID();

    return new Promise(resolve => {
      const abort = () => this.respond(id, { action: 'cancel' } as ElicitResult);
      this.pending.set(id, { createdAt: Date.now(), request, resolve: result => {
        signal?.removeEventListener('abort', abort); resolve(result);
      } });
      signal?.addEventListener('abort', abort, { once: true });
      if (signal?.aborted) abort();
      this.notify();
    });
  }

  respond(id: string, result: ElicitResult) {
    const entry = this.pending.get(id);
    if (!entry) return;

    this.pending.delete(id);
    this.notify();
    entry.resolve(result);
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
