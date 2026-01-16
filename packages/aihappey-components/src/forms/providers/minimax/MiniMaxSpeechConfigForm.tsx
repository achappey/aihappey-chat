import React from "react";
import {
  MiniMaxSpeechAudioSettingCard,
  MiniMaxSpeechGeneralCard,
  MiniMaxSpeechMusicCard,
  MiniMaxSpeechPronunciationDictCard,
  MiniMaxSpeechVoiceModifyCard,
  MiniMaxSpeechVoiceSettingCard,
} from "./cards";

/**
 * IMPORTANT: keys must match backend JSON property names.
 * Mirrors `MiniMaxSpeechProviderMetadata` (providerOptions.minimax).
 */
export type MiniMaxSpeechConfig = {
  voice_setting?: {
    voice_id?: string;
    speed?: number;
    vol?: number;
    pitch?: number;
    emotion?: string;
    text_normalization?: boolean;
    latex_read?: boolean;
  };

  audio_setting?: {
    sample_rate?: number;
    bitrate?: number;
    format?: string;
    channel?: number;
    force_cbr?: boolean;
  };

  pronunciation_dict?: {
    tone?: string[];
  };

  language_boost?: string;

  voice_modify?: {
    pitch?: number;
    intensity?: number;
    timbre?: number;
    sound_effects?: string;
  };

  subtitle_enable?: boolean;

  /** Optional lyrics text (maps directly to backend JSON `lyrics`). */
  lyrics?: string;
};

export const MiniMaxSpeechConfigForm: React.FC<{
  config: MiniMaxSpeechConfig;
  updateConfig: (val: MiniMaxSpeechConfig) => void;
}> = ({ config, updateConfig }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <MiniMaxSpeechGeneralCard config={config} updateConfig={updateConfig} />
      <MiniMaxSpeechMusicCard config={config} updateConfig={updateConfig} />
      <MiniMaxSpeechVoiceSettingCard config={config} updateConfig={updateConfig} />
      <MiniMaxSpeechAudioSettingCard config={config} updateConfig={updateConfig} />
      <MiniMaxSpeechPronunciationDictCard config={config} updateConfig={updateConfig} />
      <MiniMaxSpeechVoiceModifyCard config={config} updateConfig={updateConfig} />
    </div>
  );
};


