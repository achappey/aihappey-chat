import type { JSONValue } from "@ai-sdk/provider";

export interface PendingVideoOperation {
  id: string;
  operation: JSONValue;
  modelId: string;
  requestedVideos: number;
  createdAt: number;
}

const STORAGE_KEY = "aihappey_pending_video_operations_v1";

export function loadPendingVideoOperations(): PendingVideoOperation[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is PendingVideoOperation =>
      !!item
      && typeof item.id === "string"
      && typeof item.modelId === "string"
      && typeof item.requestedVideos === "number"
      && item.requestedVideos > 0
      && typeof item.createdAt === "number"
      && item.operation !== undefined,
    );
  } catch {
    return [];
  }
}

export function savePendingVideoOperations(operations: PendingVideoOperation[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(operations));
}

export function createPendingVideoOperation(
  operation: JSONValue,
  modelId: string,
  requestedVideos: number,
): PendingVideoOperation {
  return {
    id: crypto.randomUUID(),
    operation,
    modelId,
    requestedVideos,
    createdAt: Date.now(),
  };
}
