/**
 * Shared helpers/constants for MiniMax speech card components.
 *
 * IMPORTANT: values/keys must remain aligned with backend JSON property names.
 */

export const DEFAULT_VALUE = "__default__";

export const hasAnyOwnValue = (obj: Record<string, any> | undefined) =>
  !!obj && Object.values(obj).some((v) => v !== undefined);

export const normalizeListItem = (s: string): string =>
  (s ?? "").trim().replace(/\s+/g, " ");

export const normalizeList = (val: unknown): string[] => {
  const raw = Array.isArray(val) ? val : [];
  const out: string[] = [];
  const seen = new Set<string>();
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

export const LANGUAGE_BOOST_OPTIONS = [
  "Chinese",
  "Chinese,Yue",
  "English",
  "Arabic",
  "Russian",
  "Spanish",
  "French",
  "Portuguese",
  "German",
  "Turkish",
  "Dutch",
  "Ukrainian",
  "Vietnamese",
  "Indonesian",
  "Japanese",
  "Italian",
  "Korean",
  "Thai",
  "Polish",
  "Romanian",
  "Greek",
  "Czech",
  "Finnish",
  "Hindi",
  "Bulgarian",
  "Danish",
  "Hebrew",
  "Malay",
  "Persian",
  "Slovak",
  "Swedish",
  "Croatian",
  "Filipino",
  "Hungarian",
  "Norwegian",
  "Slovenian",
  "Catalan",
  "Nynorsk",
  "Tamil",
  "Afrikaans",
  "auto",
] as const;

export const EMOTIONS = [
  "happy",
  "sad",
  "angry",
  "fearful",
  "disgusted",
  "surprised",
  "calm",
  "fluent",
  "whisper",
] as const;

export const AUDIO_FORMATS = ["mp3", "pcm", "flac", "wav"] as const;
export const SAMPLE_RATES = [8000, 16000, 22050, 24000, 32000, 44100] as const;
export const BITRATES = [32000, 64000, 128000, 256000] as const;
export const CHANNELS = [1, 2] as const;

export const SOUND_EFFECTS = [
  "spacious_echo",
  "auditorium_echo",
  "lofi_telephone",
  "robotic",
] as const;

