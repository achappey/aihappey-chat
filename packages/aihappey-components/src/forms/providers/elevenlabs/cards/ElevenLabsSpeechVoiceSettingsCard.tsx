import React from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type {
  ElevenLabsSpeechConfig,
  ElevenLabsVoiceSettings,
} from "../ElevenLabsSpeechConfigForm";

export const ElevenLabsSpeechVoiceSettingsCard: React.FC<{
  config: ElevenLabsSpeechConfig;
  updateConfig: (val: ElevenLabsSpeechConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const voiceSettings = config?.voice_settings ?? {};

  const updateVoiceSettings = (next: Partial<ElevenLabsVoiceSettings>) =>
    updateConfig({
      ...config,
      voice_settings: {
        ...voiceSettings,
        ...next,
      },
    });

  return (
    <theme.Card size="small" title={t("providers:elevenlabs.voiceSettings")}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <theme.Slider
          label={t("providers:elevenlabs.stability", {
            value: (voiceSettings?.stability ?? 0.5).toFixed(2),
          })}
          min={0}
          max={1}
          step={0.01}
          value={voiceSettings?.stability ?? 0.5}
          onChange={(value: number) => updateVoiceSettings({ stability: value })}
        />

        <theme.Slider
          label={t("providers:elevenlabs.similarityBoost", {
            value: (voiceSettings?.similarity_boost ?? 0.75).toFixed(2),
          })}
          min={0}
          max={1}
          step={0.01}
          value={voiceSettings?.similarity_boost ?? 0.75}
          onChange={(value: number) =>
            updateVoiceSettings({ similarity_boost: value })
          }
        />

        <theme.Slider
          label={t("providers:elevenlabs.style", {
            value: (voiceSettings?.style ?? 0).toFixed(2),
          })}
          min={0}
          max={1}
          step={0.01}
          value={voiceSettings?.style ?? 0}
          onChange={(value: number) => updateVoiceSettings({ style: value })}
        />

        <theme.Switch
          id="elevenlabs-speech-use-speaker-boost"
          label={t("providers:elevenlabs.useSpeakerBoost")}
          checked={voiceSettings?.use_speaker_boost ?? false}
          onChange={(enabled) =>
            updateVoiceSettings({ use_speaker_boost: enabled })
          }
        />
      </div>
    </theme.Card>
  );
};

