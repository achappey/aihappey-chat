import React from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

import {
  DEFAULT_VALUE,
  GLM_SYSTEM_VOICES,
  isGlmVoice,
  type NovitaGlmSpeechConfig,
  type NovitaSpeechConfig,
} from "./novitaSpeechTypes";

export const GlmSpeechCardForm: React.FC<{
  config: NovitaSpeechConfig;
  updateConfig: (val: NovitaSpeechConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const humanize = (s: string) => String(s ?? "").replaceAll("_", " ");

  const glm = config?.glm ?? {};

  const glmVoiceValue = isGlmVoice(glm?.voice) ? (glm.voice as string) : DEFAULT_VALUE;
  const glmVolumeValue = glm?.volume ?? 1.0;
  const glmSpeedValue = glm?.speed ?? 1.0;

  const glmVoiceOptions = [
    { value: DEFAULT_VALUE, label: t("providerDefault") },
    ...GLM_SYSTEM_VOICES.map((v) => ({ value: v, label: humanize(v) })),
  ];

  const updateGlm = (next: Partial<NovitaGlmSpeechConfig>) =>
    updateConfig({
      ...config,
      glm: {
        ...glm,
        ...next,
      },
    });

  return (
    <theme.Card size="small" title="GLM">
      <div>
        <theme.Select
          label={t("speechSettings.voice")}
          values={[glmVoiceValue]}
          valueTitle={glmVoiceOptions.find((o) => o.value === glmVoiceValue)?.label}
          options={glmVoiceOptions}
          onChange={(val: string) => {
            const raw = String(val ?? "");
            updateGlm({
              voice: raw === DEFAULT_VALUE ? undefined : raw,
            });
          }}
          style={{ minWidth: 220 }}
        >
          {glmVoiceOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </theme.Select>

        <theme.Slider
          label={
            t("speechSettings.volumeWithValue", {
              volume: glmVolumeValue.toFixed(1),
            })
          }
          min={0.0}
          max={10.0}
          step={0.1}
          value={glmVolumeValue}
          onChange={(value: number) =>
            updateGlm({
              volume: value,
            })
          }
        />

        <theme.Slider
          label={
            t("speechSettings.speedWithValue", {
              speed: glmSpeedValue.toFixed(1),
            })
          }
          min={0.5}
          max={2.0}
          step={0.1}
          value={glmSpeedValue}
          onChange={(value: number) =>
            updateGlm({
              speed: value,
            })
          }
        />
      </div>
    </theme.Card>
  );
};

