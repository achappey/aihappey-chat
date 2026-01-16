export const DEFAULT_VALUE = "__default__";

export type NovitaMinimaxSpeechConfig = {
  /**
   * Effective voice used by the provider. In the UI this is derived from
   * `clonedVoiceId || systemVoice`.
   */
  voice_id?: string;
  /** Minimax system voice ID */
  systemVoice?: string;
  /** Minimax cloned voice ID */
  clonedVoiceId?: string;
  vol?: number;
  speed?: number;
  pitch?: number;
};

export type NovitaGlmSpeechConfig = {
  voice?: string;
  volume?: number;
  speed?: number;
};

export type NovitaTxt2SpeechSpeechConfig = {
  voice_id?: string;
  volume?: number;
  speed?: number;
};

export type NovitaSpeechConfig = {
  minimax?: NovitaMinimaxSpeechConfig;
  glm?: NovitaGlmSpeechConfig;
  txt2speech?: NovitaTxt2SpeechSpeechConfig;
};

export const NOVITA_VOICES = [
  "Wise_Woman",
  "Friendly_Person",
  "Inspirational_girl",
  "Deep_Voice_Man",
  "Calm_Woman",
  "Casual_Guy",
  "Lively_Girl",
  "Patient_Man",
  "Young_Knight",
  "Determined_Man",
  "Lovely_Girl",
  "Decent_Boy",
  "Imposing_Manner",
  "Elegant_Man",
  "Abbess",
  "Sweet_Girl_2",
  "Exuberant_Girl",
] as const;

export const GLM_SYSTEM_VOICES = [
  "tongtong",
  "chuichui",
  "xiaochen",
  "jam",
  "kazi",
  "douji",
  "luodo",
] as const;

export const TXT2SPEECH_VOICES = ["Emily", "James", "Olivia", "Michael", "Sarah", "John"] as const;

export const isMinimaxSystemVoice = (v?: string) =>
  !!v && (NOVITA_VOICES as readonly string[]).includes(v);

export const isGlmVoice = (v?: string) =>
  !!v && (GLM_SYSTEM_VOICES as readonly string[]).includes(v);

export const isTxt2SpeechVoice = (v?: string) =>
  !!v && (TXT2SPEECH_VOICES as readonly string[]).includes(v);

