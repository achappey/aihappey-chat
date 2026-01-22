export const normalizeListItem = (s: string): string => (s ?? "").trim().replace(/\s+/g, " ");

export const normalizeList = (val: unknown): string[] => {
  const raw = Array.isArray(val) ? val : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of raw) {
    const n = normalizeListItem(String(v ?? ""));
    if (!n) continue;
    const key = n.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(n);
  }
  return out;
};

export const parseOptionalNumber = (raw: unknown): number | undefined => {
  const s = String(raw ?? "").trim();
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

export const parseOptionalInt = (raw: unknown): number | undefined => {
  const n = parseOptionalNumber(raw);
  if (n === undefined) return undefined;
  return Math.trunc(n);
};

