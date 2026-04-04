import { useCallback } from "react";

export const parseOptionalNumber = (value: unknown) => {
  const normalized = String(value ?? "").trim();
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const parseOptionalInteger = (value: unknown) => {
  const parsed = parseOptionalNumber(value);
  return parsed === undefined ? undefined : Math.trunc(parsed);
};

export const parseLines = (value: string) =>
  value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

export const linesToText = (value?: string[]) => (value ?? []).join("\n");

export const useObjectUpdater = <T extends Record<string, any>>(
  value: T,
  onChange: (next: T) => void,
) => useCallback(
  <K extends keyof T>(key: K, nextValue: T[K]) => {
    onChange({
      ...value,
      [key]: nextValue,
    });
  },
  [onChange, value],
);

