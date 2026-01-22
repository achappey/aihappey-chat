import type { AssemblyAICustomSpellingEntry } from "./fields/CustomSpellingEditor";

/**
 * IMPORTANT: keys must match backend JSON property names.
 * Mirrors `AssemblyAITranscriptionProviderMetadata`.
 */
export type AssemblyAITranscriptionConfig = {
  // ----- Media trimming -----
  audio_start_from?: number;
  audio_end_at?: number;

  // ----- Language -----
  language_code?: string;
  language_detection?: boolean;
  language_confidence_threshold?: number;

  // ----- Formatting / output -----
  punctuate?: boolean;
  format_text?: boolean;
  disfluencies?: boolean;

  // ----- Channels / diarization -----
  multichannel?: boolean;
  speaker_labels?: boolean;
  speakers_expected?: number;

  // ----- Enrichments -----
  auto_chapters?: boolean;
  auto_highlights?: boolean;
  entity_detection?: boolean;
  sentiment_analysis?: boolean;
  iab_categories?: boolean;

  // ----- Safety / profanity / PII -----
  filter_profanity?: boolean;
  content_safety?: boolean;
  content_safety_confidence?: number;

  redact_pii?: boolean;
  redact_pii_audio?: boolean;
  redact_pii_audio_quality?: "mp3" | "wav";
  redact_pii_policies?: string[];
  redact_pii_sub?: "entity_name" | "hash";

  // ----- Summarization -----
  summarization?: boolean;
  summary_model?: "informative" | "conversational" | "catchy";
  summary_type?: "bullets" | "bullets_verbose" | "gist" | "headline" | "paragraph";

  // ----- Other quality controls -----
  speech_threshold?: number;
  keyterms_prompt?: string[];
  custom_spelling?: AssemblyAICustomSpellingEntry[];
};

/**
 * IMPORTANT: keys must match backend JSON property names.
 * Mirrors `AssemblyAIRealtime`.
 */
export type AssemblyAIRealtimeConfig = {
  sample_rate?: number;
  encoding?: "pcm_s16le" | "pcm_mulaw";
  speech_model?: "universal-streaming-english" | "universal-streaming-multilingual";
  vad_threshold?: number;
  end_of_turn_confidence_threshold?: number;
  min_end_of_turn_silence_when_confident?: string;
  max_turn_silence?: string;
  format_turns?: boolean;
  inactivity_timeout?: number;
  keyterms_prompt?: string[];
  language_detection?: boolean;
};

