import { useSyncExternalStore } from "react";
import type { Resource, ReadResourceResult } from "@modelcontextprotocol/sdk/types";

class ResourceSelectionRuntime {
  private selected = new Map<string, [Resource, ReadResourceResult]>();
  private snapshot: [Resource, ReadResourceResult][] = [];
  private listeners = new Set<() => void>();

  subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.snapshot = [...this.selected.values()];
    this.listeners.forEach(l => l());
  }

  add(resource: Resource, result: ReadResourceResult) {
    this.selected.set(resource.uri, [resource, result]);
    this.notify();
  }

  remove(uri: string) {
    this.selected.delete(uri);
    this.notify();
  }

  clear() {
    this.selected.clear();
    this.notify();
  }

  has(uri: string) {
    return this.selected.has(uri);
  }

  getSnapshot() {
    return this.snapshot;
  }
}

export function useSelectedResources(runtime: ResourceSelectionRuntime) {
  return useSyncExternalStore(
    cb => runtime.subscribe(cb),
    () => runtime.getSnapshot(),
    () => []
  );
}

export const mcpResourceRuntime = new ResourceSelectionRuntime();
