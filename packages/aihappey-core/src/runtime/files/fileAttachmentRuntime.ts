import { useSyncExternalStore } from "react";

class AttachmentRuntime {
  private attachments = new Map<string, File>();
  private snapshot: File[] = [];
  private listeners = new Set<() => void>();

  subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.snapshot = [...this.attachments.values()];
    this.listeners.forEach(l => l());
  }

  add(file: File) {
    this.attachments.set(file.name, file);
    this.notify();
  }

  remove(name: string) {
    this.attachments.delete(name);
    this.notify();
  }

  clear() {
    this.attachments.clear();
    this.notify();
  }

  getSnapshot() {
    return this.snapshot;
  }
}

export function useFileAttachments(runtime: AttachmentRuntime) {
  return useSyncExternalStore(
    cb => runtime.subscribe(cb),
    () => runtime.getSnapshot(),
    () => []
  );
}

export const fileAttachmentRuntime = new AttachmentRuntime();
