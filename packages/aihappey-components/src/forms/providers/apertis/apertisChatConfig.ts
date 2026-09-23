export type ApertisChatConfig = {
  reasoning?: {
    effort?: "low" | "medium" | "high";
    summary?: "auto" | "concise" | "detailed";
  };
  compression?: {
    enabled?: boolean;
    strategy?: "on" | "conservative" | "aggressive";
    threshold?: number;
    keep_turns?: number;
    model?: string;
  };
};

const omitUnset = <T extends object>(value: T): T =>
  Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;

// Undefined means cleared; null means invalid and must not replace the saved value.
export const parseApertisInteger = (value: string): number | undefined | null => {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
};

export const updateApertisReasoning = (
  config: ApertisChatConfig,
  patch: ApertisChatConfig["reasoning"],
): ApertisChatConfig => {
  const { reasoning: previous, ...rest } = config;
  const reasoning = patch === undefined ? {} : omitUnset({ ...previous, ...patch });
  return {
    ...rest,
    compression: { ...config.compression, enabled: config.compression?.enabled ?? false },
    ...(Object.keys(reasoning).length ? { reasoning } : {}),
  };
};

export const updateApertisCompression = (
  config: ApertisChatConfig,
  patch: NonNullable<ApertisChatConfig["compression"]>,
): ApertisChatConfig => ({
  ...config,
  compression: omitUnset({
    ...config.compression,
    ...patch,
    enabled: patch.enabled ?? config.compression?.enabled ?? false,
  }),
});
