import React, { useMemo } from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type { MiniMaxSpeechConfig } from "../MiniMaxSpeechConfigForm";
import { DEFAULT_VALUE, EMOTIONS, hasAnyOwnValue } from "./shared";
import { MINIMAX_SYSTEM_VOICES } from "./minimaxSystemVoices";

export const MiniMaxSpeechVoiceSettingCard: React.FC<{
  config: MiniMaxSpeechConfig;
  updateConfig: (val: MiniMaxSpeechConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const updateVoiceSetting = (next: Partial<MiniMaxSpeechConfig["voice_setting"]>) => {
    const merged = {
      ...(config?.voice_setting ?? {}),
      ...next,
    } as NonNullable<MiniMaxSpeechConfig["voice_setting"]>;

    updateConfig({
      ...config,
      voice_setting: hasAnyOwnValue(merged) ? merged : undefined,
    });
  };

  const emotionOptions = useMemo(
    () => [
      { value: DEFAULT_VALUE, label: t("providerDefault") },
      ...EMOTIONS.map((v) => ({ value: v, label: v })),
    ],
    [t]
  );

  const voiceById = useMemo(() => {
    const map = new Map<string, { language: string; voice_name: string }>();
    for (const v of MINIMAX_SYSTEM_VOICES) {
      map.set(v.voice_id, { language: v.language, voice_name: v.voice_name });
    }
    return map;
  }, []);

  const voiceGroups = useMemo(() => {
    const byLang = new Map<string, typeof MINIMAX_SYSTEM_VOICES>();
    for (const v of MINIMAX_SYSTEM_VOICES) {
      const existing = byLang.get(v.language);
      if (existing) {
        existing.push(v);
      } else {
        byLang.set(v.language, [v]);
      }
    }
    return Array.from(byLang.entries()).map(([language, voices]) => ({ language, voices }));
  }, []);

  const selectedVoiceId = config?.voice_setting?.voice_id;
  const selectedVoiceKey = selectedVoiceId ?? DEFAULT_VALUE;
  const selectedVoiceTitle = useMemo(() => {
    if (!selectedVoiceId) return t("providerDefault");
    const known = voiceById.get(selectedVoiceId);
    if (!known) return selectedVoiceId;
    return `${known.language} • ${known.voice_name}`;
  }, [selectedVoiceId, t, voiceById]);

  return (
    <theme.Card size="small" title={t("providers:minimax.voiceSetting")}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <theme.Select
          label={t("providers:minimax.voiceId")}
          values={[selectedVoiceKey]}
          valueTitle={selectedVoiceTitle}
          options={[]}
          onChange={(val: string) => {
            const raw = String(val ?? "");
            updateVoiceSetting({ voice_id: raw === DEFAULT_VALUE ? undefined : raw });
          }}
          style={{ minWidth: 280 }}
        >
          <option value={DEFAULT_VALUE}>{t("providerDefault")}</option>

          {/* Preserve pre-existing custom/unknown voice ids so users don't lose them by opening the dropdown */}
          {selectedVoiceId && !voiceById.has(selectedVoiceId) ? (
            <optgroup label={t("custom") ?? "Custom"}>
              <option value={selectedVoiceId}>{selectedVoiceId}</option>
            </optgroup>
          ) : null}

          {voiceGroups.map((g) => (
            <optgroup key={g.language} label={g.language}>
              {g.voices.map((v) => (
                <option key={v.voice_id} value={v.voice_id}>
                  {v.voice_name}
                </option>
              ))}
            </optgroup>
          ))}
        </theme.Select>

        <theme.Slider
          label={t("providers:minimax.speedWithValue", {
            value: (config?.voice_setting?.speed ?? 1).toFixed(2),
          })}
          min={0.5}
          max={2.0}
          step={0.05}
          value={config?.voice_setting?.speed ?? 1}
          onChange={(value: number) => updateVoiceSetting({ speed: value })}
        />

        <theme.Slider
          label={t("providers:minimax.volumeWithValue", {
            value: (config?.voice_setting?.vol ?? 1).toFixed(2),
          })}
          min={0.0}
          max={10.0}
          step={0.1}
          value={config?.voice_setting?.vol ?? 1}
          onChange={(value: number) => updateVoiceSetting({ vol: value })}
        />

        <theme.Slider
          label={t("providers:minimax.pitchWithValue", {
            value: config?.voice_setting?.pitch ?? 0,
          })}
          min={-12}
          max={12}
          step={1}
          value={config?.voice_setting?.pitch ?? 0}
          onChange={(value: number) => updateVoiceSetting({ pitch: value })}
        />

        <theme.Select
          label={t("providers:minimax.emotion")}
          values={[config?.voice_setting?.emotion ?? DEFAULT_VALUE]}
          valueTitle={
            emotionOptions.find(
              (o) => o.value === (config?.voice_setting?.emotion ?? DEFAULT_VALUE)
            )?.label
          }
          options={emotionOptions}
          onChange={(val: string) => {
            const raw = String(val ?? "");
            updateVoiceSetting({ emotion: raw === DEFAULT_VALUE ? undefined : raw });
          }}
          style={{ minWidth: 220 }}
        >
          {emotionOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </theme.Select>

        <theme.Switch
          id="minimax-speech-text-normalization"
          label={t("providers:minimax.textNormalization")}
          checked={config?.voice_setting?.text_normalization ?? false}
          onChange={(enabled) =>
            updateVoiceSetting({ text_normalization: enabled ? true : undefined })
          }
        />

        <theme.Switch
          id="minimax-speech-latex-read"
          label={t("providers:minimax.latexRead")}
          checked={config?.voice_setting?.latex_read ?? false}
          onChange={(enabled) =>
            updateVoiceSetting({ latex_read: enabled ? true : undefined })
          }
        />
      </div>
    </theme.Card>
  );
};

