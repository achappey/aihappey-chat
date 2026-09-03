import type { ExportCategoryId } from "./export/exportEngine";

export type StorageCategoryUsage = {
  id: ExportCategoryId;
  bytes: number;
};

/**
 * Estimates the number of bytes occupied by a value's stored payload.
 * Binary values use their exact byte length; other values use their UTF-8
 * representation. Repeated/cyclic object references are counted once.
 */
export function estimateValueBytes(value: unknown, seen = new WeakSet<object>()): number {
  if (value == null) return value === null ? 4 : 0;
  if (typeof value === "string") return new TextEncoder().encode(value).byteLength;
  if (typeof value === "number") return new TextEncoder().encode(String(value)).byteLength;
  if (typeof value === "boolean") return value ? 4 : 5;
  if (typeof value === "bigint") return new TextEncoder().encode(String(value)).byteLength;
  if (typeof value === "function" || typeof value === "symbol") return 0;

  if (value instanceof Blob) return value.size;
  if (value instanceof ArrayBuffer) return value.byteLength;
  if (ArrayBuffer.isView(value)) return value.byteLength;
  if (value instanceof Date) return new TextEncoder().encode(value.toISOString()).byteLength;

  const object = value as object;
  if (seen.has(object)) return 0;
  seen.add(object);

  if (Array.isArray(value)) {
    return value.reduce((total, item) => total + estimateValueBytes(item, seen), 2)
      + Math.max(0, value.length - 1);
  }

  return Object.entries(value as Record<string, unknown>).reduce(
    (total, [key, item], index) => total
      + (index ? 1 : 0)
      + estimateValueBytes(key)
      + 3
      + estimateValueBytes(item, seen),
    2,
  );
}

export function buildStorageBreakdown(values: Partial<Record<ExportCategoryId, unknown>>) {
  return Object.entries(values).map(([id, value]) => ({
    id: id as ExportCategoryId,
    bytes: estimateValueBytes(value),
  }));
}

export function formatBytes(bytes: number, locale?: string) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  const safeBytes = Math.max(0, Number.isFinite(bytes) ? bytes : 0);
  if (safeBytes === 0) return `0 ${units[0]}`;
  const exponent = Math.min(Math.floor(Math.log(safeBytes) / Math.log(1024)), units.length - 1);
  const value = safeBytes / 1024 ** exponent;
  return `${new Intl.NumberFormat(locale, {
    maximumFractionDigits: exponent === 0 ? 0 : value < 10 ? 1 : 0,
  }).format(value)} ${units[exponent]}`;
}
