import type { ChatConfig } from "../chat/context/ChatContext";

export const isPlainRecord = (value: any): value is Record<string, any> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

export const compactUndefined = (value: any): any => {
  if (Array.isArray(value)) return value.map(compactUndefined);
  if (!isPlainRecord(value)) return value;
  const next: Record<string, any> = {};
  for (const [key, child] of Object.entries(value)) {
    if (child === undefined) continue;
    next[key] = compactUndefined(child);
  }
  return next;
};

export const deepMerge = (...values: any[]) => {
  const out: Record<string, any> = {};
  for (const value of values) {
    if (!isPlainRecord(value)) continue;
    for (const [key, child] of Object.entries(value)) {
      if (child === undefined) continue;
      if (isPlainRecord(child) && isPlainRecord(out[key])) {
        out[key] = deepMerge(out[key], child);
      } else {
        out[key] = child;
      }
    }
  }
  return out;
};

export const buildRealtimeBackendHeaders = async (config: ChatConfig, customHeaders?: Record<string, string>) => {
  const merged = { ...(config?.headers ?? {}), ...(customHeaders ?? {}) } as Record<string, string>;
  if (config?.getAccessToken) {
    merged.Authorization = `Bearer ${await config.getAccessToken()}`;
  }
  return merged;
};

