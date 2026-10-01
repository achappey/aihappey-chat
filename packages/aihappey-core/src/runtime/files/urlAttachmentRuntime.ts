import { useSyncExternalStore } from "react";
import type { FileUIPart } from "aihappey-ai";

class UrlAttachmentRuntime {
  private items = new Map<string, FileUIPart>();
  private snapshot: FileUIPart[] = [];
  private listeners = new Set<() => void>();
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  getSnapshot = () => this.snapshot;
  add = (part: FileUIPart) => { this.items.set(part.url, part); this.notify(); };
  remove = (url: string) => { this.items.delete(url); this.notify(); };
  clear = () => { this.items.clear(); this.notify(); };
  private notify() {
    this.snapshot = [...this.items.values()];
    this.listeners.forEach(listener => listener());
  }
}

export const urlAttachmentRuntime = new UrlAttachmentRuntime();
export const useUrlAttachments = () => useSyncExternalStore(
  urlAttachmentRuntime.subscribe,
  urlAttachmentRuntime.getSnapshot,
  () => [],
);
