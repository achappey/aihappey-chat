import { useSyncExternalStore } from "react";

class AttachmentRuntime {
  private attachments = new Map<string, File>();
  private snapshot: File[] = [];
  private listeners = new Set<() => void>();

  private splitName(name: string) {
    const dot = name.lastIndexOf(".");
    if (dot <= 0) {
      return { base: name, ext: "" };
    }

    return {
      base: name.slice(0, dot),
      ext: name.slice(dot),
    };
  }

  private getUniqueName(originalName: string) {
    if (!this.attachments.has(originalName)) return originalName;

    const { base, ext } = this.splitName(originalName);
    let index = 1;
    let candidate = `${base}-${index}${ext}`;

    while (this.attachments.has(candidate)) {
      index += 1;
      candidate = `${base}-${index}${ext}`;
    }

    return candidate;
  }

  private renameFile(file: File, name: string) {
    if (file.name === name) return file;

    return new File([file], name, {
      type: file.type,
      lastModified: file.lastModified,
    });
  }

  subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.snapshot = [...this.attachments.values()];
    this.listeners.forEach(l => l());
  }

  add(file: File) {
    const uniqueName = this.getUniqueName(file.name);
    const fileWithUniqueName = this.renameFile(file, uniqueName);
    this.attachments.set(fileWithUniqueName.name, fileWithUniqueName);
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
