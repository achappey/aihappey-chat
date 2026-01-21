export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const isPresent = (v: unknown) => v !== undefined;

/**
 * Returns undefined when an object has no own keys with a non-undefined value.
 * Useful to avoid sending `{}` buckets in provider metadata.
 */
export const pruneEmptyObject = <T extends Record<string, any> | undefined>(
  obj: T
): T | undefined => {
  if (!obj) return undefined;
  const hasAny = Object.values(obj).some(isPresent);
  return hasAny ? obj : undefined;
};

