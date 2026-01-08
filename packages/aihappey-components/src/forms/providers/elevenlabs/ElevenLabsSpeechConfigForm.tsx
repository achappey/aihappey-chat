import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import { ElevenLabsSpeechContinuityCard } from "./cards/ElevenLabsSpeechContinuityCard";
import { ElevenLabsSpeechGeneralCard } from "./cards/ElevenLabsSpeechGeneralCard";
import { ElevenLabsSpeechMusicCard } from "./cards/ElevenLabsSpeechMusicCard";
import { ElevenLabsSpeechTextNormalizationCard } from "./cards/ElevenLabsSpeechTextNormalizationCard";
import { ElevenLabsSpeechVoiceSettingsCard } from "./cards/ElevenLabsSpeechVoiceSettingsCard";

export type ElevenLabsVoiceSettings = {
  stability?: number;
  similarity_boost?: number;
  style?: number;
  use_speaker_boost?: boolean;
};

export type ElevenLabsSpeechConfig = {
  /** Voice ID (path param in ElevenLabs API). */
  voice?: string;

  /** Query-string `output_format` e.g. `mp3_44100_128`. */
  output_format?: string;

  enable_logging?: boolean;
  seed?: number;
  voice_settings?: ElevenLabsVoiceSettings;
  previous_text?: string;
  next_text?: string;

  /** auto | on | off */
  apply_text_normalization?: "auto" | "on" | "off";
  apply_language_text_normalization?: boolean;

  // ---- ElevenLabs Music (POST /v1/music) ----

  /** Optional length of generated music in milliseconds. Valid range per ElevenLabs: 3000..600000. */
  music_length_ms?: number;

  /** If true, guarantees instrumental output. Only applicable when using prompt. */
  force_instrumental?: boolean;

  /** Controls how strictly composition plan section durations are respected. */
  respect_sections_durations?: boolean;

  /** Whether to store the generated song for inpainting (enterprise-only). */
  store_for_inpainting?: boolean;

  /** Whether to sign output with C2PA (applicable only for mp3). */
  sign_with_c2pa?: boolean;
};

export const ElevenLabsSpeechConfigForm: React.FC<{
  config: ElevenLabsSpeechConfig;
  updateConfig: (val: ElevenLabsSpeechConfig) => void;
}> = ({ config, updateConfig }) => {
  // Keep hooks for parity with other config forms; cards have their own hook usage.
  useTheme();
  useTranslation();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <ElevenLabsSpeechGeneralCard config={config} updateConfig={updateConfig} />
      <ElevenLabsSpeechMusicCard config={config} updateConfig={updateConfig} />
      <ElevenLabsSpeechVoiceSettingsCard config={config} updateConfig={updateConfig} />
      <ElevenLabsSpeechContinuityCard config={config} updateConfig={updateConfig} />
      <ElevenLabsSpeechTextNormalizationCard
        config={config}
        updateConfig={updateConfig}
      />
    </div>
  );
};

