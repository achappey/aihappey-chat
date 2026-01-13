import React, { useMemo } from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type { MiniMaxSpeechConfig } from "../MiniMaxSpeechConfigForm";
import { DEFAULT_VALUE, SOUND_EFFECTS, hasAnyOwnValue } from "./shared";

export const MiniMaxSpeechVoiceModifyCard: React.FC<{
  config: MiniMaxSpeechConfig;
  updateConfig: (val: MiniMaxSpeechConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const updateVoiceModify = (next: Partial<MiniMaxSpeechConfig["voice_modify"]>) => {
    const merged = {
      ...(config?.voice_modify ?? {}),
      ...next,
    } as NonNullable<MiniMaxSpeechConfig["voice_modify"]>;

    updateConfig({
      ...config,
      voice_modify: hasAnyOwnValue(merged) ? merged : undefined,
    });
  };

  const soundEffectOptions = useMemo(
    () => [
      { value: DEFAULT_VALUE, label: t("providerDefault") },
      ...SOUND_EFFECTS.map((v) => ({ value: v, label: v })),
    ],
    [t]
  );

  return (
    <theme.Card size="small" title={t("providers:minimax.voiceModify")}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <theme.Slider
          label={t("providers:minimax.voiceModifyPitchWithValue", {
            value: config?.voice_modify?.pitch ?? 0,
          })}
          min={-100}
          max={100}
          step={1}
          value={config?.voice_modify?.pitch ?? 0}
          onChange={(value: number) => updateVoiceModify({ pitch: value })}
        />

        <theme.Slider
          label={t("providers:minimax.voiceModifyIntensityWithValue", {
            value: config?.voice_modify?.intensity ?? 0,
          })}
          min={-100}
          max={100}
          step={1}
          value={config?.voice_modify?.intensity ?? 0}
          onChange={(value: number) => updateVoiceModify({ intensity: value })}
        />

        <theme.Slider
          label={t("providers:minimax.voiceModifyTimbreWithValue", {
            value: config?.voice_modify?.timbre ?? 0,
          })}
          min={-100}
          max={100}
          step={1}
          value={config?.voice_modify?.timbre ?? 0}
          onChange={(value: number) => updateVoiceModify({ timbre: value })}
        />

        <theme.Select
          label={t("providers:minimax.soundEffects")}
          values={[config?.voice_modify?.sound_effects ?? DEFAULT_VALUE]}
          valueTitle={
            soundEffectOptions.find(
              (o) => o.value === (config?.voice_modify?.sound_effects ?? DEFAULT_VALUE)
            )?.label
          }
          options={soundEffectOptions}
          onChange={(val: string) => {
            const raw = String(val ?? "");
            updateVoiceModify({ sound_effects: raw === DEFAULT_VALUE ? undefined : raw });
          }}
          style={{ minWidth: 220 }}
        >
          {soundEffectOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </theme.Select>
      </div>
    </theme.Card>
  );
};

