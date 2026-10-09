export const defaultProviderTranscriptionMetadata = {
  "openai": {
    response_format: "json",
  },
  "fireworks": {
  },
  "elevenlabs": {
  },
  "deepgram": {
  },
  "cohere": {
  },
  "resembleai": {
  },
  "assemblyai": {
  },
};

/** File transcription only. Realtime options have their own independent store. */
export function normalizeProviderTranscriptionMetadata(metadata: any) {
  const providers = metadata && typeof metadata === "object" && !Array.isArray(metadata) ? metadata : {};
  const source = providers.openai ?? {};
  const openai: Record<string, any> = { ...source, response_format: source.response_format || "json" };
  for (const key of ["temperature", "timestamp_granularities", "include", "known_speaker_names", "known_speaker_references", "chunking_strategy", "stream"]) delete openai[key];
  for (const key of ["keywords", "languages"]) {
    const values = Array.isArray(source[key]) ? source[key].filter((value: unknown) => typeof value === "string").map((value: string) => value.trim()).filter(Boolean) : [];
    if (values.length) openai[key] = values; else delete openai[key];
  }
  return { ...providers, openai };
}
