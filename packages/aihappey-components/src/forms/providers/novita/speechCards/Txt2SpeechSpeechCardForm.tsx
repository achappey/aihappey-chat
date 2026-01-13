import React from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

import {
  DEFAULT_VALUE,
  isTxt2SpeechVoice,
  TXT2SPEECH_VOICES,
  type NovitaSpeechConfig,
  type NovitaTxt2SpeechSpeechConfig,
} from "./novitaSpeechTypes";

export const Txt2SpeechSpeechCardForm: React.FC<{
  config: NovitaSpeechConfig;
  updateConfig: (val: NovitaSpeechConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const humanize = (s: string) => String(s ?? "").replaceAll("_", " ");

  const txt2speech = config?.txt2speech ?? {};

  const txt2speechVoiceValue = isTxt2SpeechVoice(txt2speech?.voice_id)
    ? (txt2speech.voice_id as string)
    : DEFAULT_VALUE;
  const txt2speechVolumeValue = txt2speech?.volume ?? 1.0;
  const txt2speechSpeedValue = txt2speech?.speed ?? 1.0;

  const txt2speechVoiceOptions = [
    { value: DEFAULT_VALUE, label: t("providerDefault") },
    ...TXT2SPEECH_VOICES.map((v) => ({ value: v, label: humanize(v) })),
  ];

  const updateTxt2Speech = (next: Partial<NovitaTxt2SpeechSpeechConfig>) =>
    updateConfig({
      ...config,
      txt2speech: {
        ...txt2speech,
        ...next,
      },
    });

  return (
    <theme.Card size="small" title="Text2Speech">
      <div>
        <theme.Select
          label={t("speechSettings.voice")}
          values={[txt2speechVoiceValue]}
          valueTitle={
            txt2speechVoiceOptions.find((o) => o.value === txt2speechVoiceValue)?.label
          }
          options={txt2speechVoiceOptions}
          onChange={(val: string) => {
            const raw = String(val ?? "");
            updateTxt2Speech({
              voice_id: raw === DEFAULT_VALUE ? undefined : raw,
            });
          }}
          style={{ minWidth: 220 }}
        >
          {txt2speechVoiceOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </theme.Select>

        <theme.Slider
          label={
            t("speechSettings.volumeWithValue", {
              volume: txt2speechVolumeValue.toFixed(1),
            })
          }
          min={1.0}
          max={2.0}
          step={0.1}
          value={txt2speechVolumeValue}
          onChange={(value: number) =>
            updateTxt2Speech({
              volume: value,
            })
          }
        />

        <theme.Slider
          label={
            t("speechSettings.speedWithValue", {
              speed: txt2speechSpeedValue.toFixed(1),
            })
          }
          min={0.8}
          max={3.0}
          step={0.1}
          value={txt2speechSpeedValue}
          onChange={(value: number) =>
            updateTxt2Speech({
              speed: value,
            })
          }
        />
      </div>
    </theme.Card>
  );
};

