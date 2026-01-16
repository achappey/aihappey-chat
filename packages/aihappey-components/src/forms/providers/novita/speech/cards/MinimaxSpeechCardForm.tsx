import React from "react";
import { useTranslation } from "aihappey-i18n";

import {
  DEFAULT_VALUE,
  isMinimaxSystemVoice,
  NOVITA_VOICES,
  type NovitaMinimaxSpeechConfig,
  type NovitaSpeechConfig,
} from "./novitaSpeechTypes";
import { useTheme } from "../../../../../theme/ThemeContext";

export const MinimaxSpeechCardForm: React.FC<{
  config: NovitaSpeechConfig;
  updateConfig: (val: NovitaSpeechConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const humanize = (s: string) => String(s ?? "").replaceAll("_", " ");

  const minimax = config?.minimax ?? {};

  const minimaxSystemVoiceValue = isMinimaxSystemVoice(minimax?.systemVoice)
    ? (minimax.systemVoice as string)
    : isMinimaxSystemVoice(minimax?.voice_id)
      ? (minimax.voice_id as string)
      : DEFAULT_VALUE;

  // If voice is not a known system voice, assume it's a cloned voice ID.
  const minimaxClonedVoiceIdValue =
    minimax?.clonedVoiceId ??
    (!isMinimaxSystemVoice(minimax?.voice_id) ? (minimax?.voice_id ?? "") : "");

  const minimaxVolumeValue = minimax?.vol ?? 1.0;
  const minimaxSpeedValue = minimax?.speed ?? 1.0;
  const minimaxPitchValue = minimax?.pitch ?? 1.0;

  const minimaxVoiceOptions = [
    { value: DEFAULT_VALUE, label: t("providerDefault") },
    ...NOVITA_VOICES.map((v) => ({ value: v, label: humanize(v) })),
  ];

  const updateMinimax = (next: Partial<NovitaMinimaxSpeechConfig>) =>
    updateConfig({
      ...config,
      minimax: {
        ...minimax,
        ...next,
      },
    });

  return (
    <theme.Card size="small" title="Minimax">
      <div>
        <theme.Select
          label={t("speechSettings.voice")}
          values={[minimaxSystemVoiceValue]}
          valueTitle={minimaxVoiceOptions.find((o) => o.value === minimaxSystemVoiceValue)?.label}
          options={minimaxVoiceOptions}
          onChange={(val: string) => {
            const raw = String(val ?? "");

            const nextSystemVoice = raw === DEFAULT_VALUE ? undefined : raw;
            const cloned = String(minimaxClonedVoiceIdValue ?? "").trim();
            updateMinimax({
              systemVoice: nextSystemVoice,
              voice_id: cloned ? cloned : nextSystemVoice,
            });
          }}
          style={{ minWidth: 220 }}
        >
          {minimaxVoiceOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </theme.Select>

        <theme.Input
          label="Cloned voice ID"
          value={minimaxClonedVoiceIdValue}
          placeholder="ex. cloned_voice_1234"
          onChange={(e: any) => {
            const raw = String(e.target.value ?? "").trim();

            const nextCloned = raw ? raw : undefined;
            const nextVoice = nextCloned
              ? nextCloned
              : minimaxSystemVoiceValue === DEFAULT_VALUE
                ? undefined
                : minimaxSystemVoiceValue;

            updateMinimax({
              clonedVoiceId: nextCloned,
              voice_id: nextVoice,
            });
          }}
        />

        <theme.Slider
          label={
            t("speechSettings.volumeWithValue", {
              volume: minimaxVolumeValue.toFixed(1),
            })
          }
          min={0.0}
          max={10.0}
          step={0.1}
          value={minimaxVolumeValue}
          onChange={(value: number) =>
            updateMinimax({
              vol: value,
            })
          }
        />

        <theme.Slider
          label={
            t("speechSettings.speedWithValue", {
              speed: minimaxSpeedValue.toFixed(1),
            })
          }
          min={0.5}
          max={2.0}
          step={0.1}
          value={minimaxSpeedValue}
          onChange={(value: number) =>
            updateMinimax({
              speed: value,
            })
          }
        />

        <theme.Slider
          label={
            t("providers:novita.pitch", {
              pitch: minimaxPitchValue.toFixed(1),
            })
          }
          min={-12}
          max={12}
          step={1}
          value={minimaxPitchValue}
          onChange={(value: number) =>
            updateMinimax({
              pitch: value,
            })
          }
        />
      </div>
    </theme.Card>
  );
};

