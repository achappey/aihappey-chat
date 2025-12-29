import { ProgressNotificationParams } from "@modelcontextprotocol/sdk/types";
import { useSyncExternalStore } from "react";

export type McpProgressItem = ProgressNotificationParams & {
  timestamp: number;
};

const EMPTY: readonly McpProgressItem[] = Object.freeze([]);

class McpProgressRuntime {
  private items = new Map<string | number, McpProgressItem>();
  private listeners = new Set<() => void>();

  // ✅ cached snapshot: must be referentially stable if no changes
  private snapshot: readonly McpProgressItem[] = EMPTY;

  subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private rebuildSnapshot() {
    // stable ordering optional, but nice for UI
    this.snapshot = this.items.size ? Array.from(this.items.values()) : EMPTY;
  }

  private notify() {
    // sync is fine *now* because snapshot is stable.
    // if you spam progress at high frequency you can still microtask this later.
    this.listeners.forEach(l => l());
  }

  update(p: ProgressNotificationParams) {
    const prev = this.items.get(p.progressToken);

    if (
      prev &&
      prev.progress === p.progress &&
      prev.total === p.total &&
      prev.message === p.message
    ) return;

    this.items.set(p.progressToken, {
      ...p,
      timestamp: Date.now(),
    });

    this.rebuildSnapshot();
    this.notify();
  }

  remove(token: string | number) {
    if (!this.items.delete(token)) return;
    this.rebuildSnapshot();
    this.notify();
  }

  clear() {
    if (!this.items.size) return;
    this.items.clear();
    this.rebuildSnapshot();
    this.notify();
  }

  // ✅ stable reference unless rebuildSnapshot() ran
  getSnapshot() {
    return this.snapshot;
  }
}

export function useMcpProgress(runtime: McpProgressRuntime) {
  return useSyncExternalStore(
    cb => runtime.subscribe(cb),
    () => runtime.getSnapshot(),
    () => EMPTY
  );
}

export const progressRuntime = new McpProgressRuntime();
