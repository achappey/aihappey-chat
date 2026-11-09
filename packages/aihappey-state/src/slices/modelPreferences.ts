/** Only these model types have multi-model runtime pickers. */
export const MODEL_PREFERENCE_FIELDS = {
  language: "userPreferredModel",
  image: "userPreferredImageModel",
  video: "userPreferredVideoModel",
  speech: "userPreferredSpeechModel",
} as const;

export type DefaultModelsByType = Partial<Record<keyof typeof MODEL_PREFERENCE_FIELDS, string[]>>;

/** Also accepts legacy scalar preferences during migration. Order is significant. */
export function normalizeModelIds(value: unknown): string[] {
  const values = typeof value === "string" ? [value] : Array.isArray(value) ? value : [];
  return Array.from(new Set(values.filter((id): id is string => typeof id === "string")
    .map(id => id.trim()).filter(Boolean)));
}
