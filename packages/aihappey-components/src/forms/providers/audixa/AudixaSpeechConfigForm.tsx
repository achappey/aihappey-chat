import React, { useMemo } from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

/**
 * UI config bucket for speech provider metadata: `providerSpeechMetadata.audixa`.
 *
 * IMPORTANT: keys must match backend JSON property names.
 * Mirrors `AudixaSpeechProviderMetadata`.
 */
export type AudixaSpeechConfig = {
  /** Voice ID to use for synthesis. */
  voice?: string;
  /** Playback speed multiplier (0.5..2.0). */
  speed?: number;
  /** Emotional tone (advance model only). */
  emotion?: string;
  /** Creativity control (advance model only). 0.7..1.0 */
  temperature?: number;
  /** Plausibility filter (advance model only). 0.7..0.98 */
  top_p?: number;
};

type VoiceOption = {
  id: string;
  name: string;
  foundersChoice?: boolean;
};

const DEFAULT_VALUE = "__default__";
const CUSTOM_VALUE = "__custom__";

const BASE_VOICES: VoiceOption[] = [
  { name: "Aria", id: "af_aria" },
  { name: "Bella", id: "af_bella", foundersChoice: true },
  { name: "Jessica", id: "af_jessica" },
  { name: "Karen", id: "af_karen" },
  { name: "Lily", id: "af_lily", foundersChoice: true },
  { name: "Nicole", id: "af_nicole" },
  { name: "Nova", id: "af_nova" },
  { name: "River", id: "af_river" },
  { name: "Sarah", id: "af_sarah", foundersChoice: true },
  { name: "Skylar", id: "af_skylar" },
  { name: "Zoey", id: "af_zoey" },
  { name: "Eric", id: "am_eric" },
  { name: "Ethan", id: "am_ethan", foundersChoice: true },
  { name: "Jax", id: "am_jax" },
  { name: "Liam", id: "am_liam" },
  { name: "Mike", id: "am_mike", foundersChoice: true },
  { name: "Nick", id: "am_nick", foundersChoice: true },
  { name: "Onyx", id: "am_onyx" },
  { name: "Puck", id: "am_puck" },
  { name: "Ryder", id: "am_ryder" },
  { name: "Alice", id: "bf_alice" },
  { name: "Chloe", id: "bf_chloe" },
  { name: "Isla", id: "bf_isla" },
  { name: "Ruby", id: "bf_ruby" },
  { name: "George", id: "bm_george" },
  { name: "Harry", id: "bm_harry" },
  { name: "Lewis", id: "bm_lewis", foundersChoice: true },
  { name: "Oliver", id: "bm_oliver" },
  { name: "Dora", id: "ef_dora" },
  { name: "Carlos", id: "em_carlos" },
  { name: "Juan", id: "em_juan" },
  { name: "Camille", id: "ff_camille" },
  { name: "Anaya", id: "hf_anaya" },
  { name: "Kavya", id: "hf_kavya" },
  { name: "Arjun", id: "hm_arjun" },
  { name: "Rahul", id: "hm_rahul" },
  { name: "Sara", id: "if_sara" },
  { name: "Nicola", id: "im_nicola" },
  { name: "Misa", id: "jf_misa" },
  { name: "Rin", id: "jf_rin" },
  { name: "Saki", id: "jf_saki" },
  { name: "Yui", id: "jf_yui" },
  { name: "Kaito", id: "jm_kaito" },
  { name: "Lara", id: "pf_lara" },
  { name: "Bruno", id: "pm_bruno" },
  { name: "Tiago", id: "pm_tiago" },
  { name: "Ling", id: "zf_ling" },
  { name: "Mei", id: "zf_mei" },
  { name: "Xiao", id: "zf_xiao" },
  { name: "Yi", id: "zf_yi" },
  { name: "Jian", id: "zm_jian" },
  { name: "Xi", id: "zm_xi" },
  { name: "Xia", id: "zm_xia" },
  { name: "Yang", id: "zm_yang" },
];

const ADVANCE_VOICES: VoiceOption[] = [
  { name: "Adrian", id: "adrian", foundersChoice: true },
  { name: "Elon Musk", id: "elon", foundersChoice: true },
  { name: "Leo", id: "leo" },
  { name: "Noah", id: "noah" },
  { name: "Owen", id: "owen" },
  { name: "Selene", id: "selene", foundersChoice: true },
  { name: "Tessa", id: "tessa" },
  { name: "Zoe", id: "zoe" },
];

const EMOTIONS = ["neutral", "happy", "sad", "angry", "surprised"] as const;

const formatVoiceLabel = (voice: VoiceOption) =>
  voice.foundersChoice ? `${voice.name} • Founder's Choice` : voice.name;

export const AudixaSpeechConfigForm: React.FC<{
  config: AudixaSpeechConfig;
  updateConfig: (val: AudixaSpeechConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const voiceMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const v of BASE_VOICES) map.set(v.id, formatVoiceLabel(v));
    for (const v of ADVANCE_VOICES) map.set(v.id, formatVoiceLabel(v));
    return map;
  }, []);

  const isBuiltinVoice = (v?: string) => !!v && voiceMap.has(v);

  const voiceMode: "default" | "builtin" | "custom" = !config?.voice
    ? "default"
    : isBuiltinVoice(config.voice)
      ? "builtin"
      : "custom";

  const voiceSelectValue =
    voiceMode === "default"
      ? DEFAULT_VALUE
      : voiceMode === "custom"
        ? CUSTOM_VALUE
        : (config.voice as string);

  const selectedVoiceTitle = (() => {
    if (voiceSelectValue === DEFAULT_VALUE) return t("providerDefault");
    if (voiceSelectValue === CUSTOM_VALUE) return t("custom");
    return voiceMap.get(voiceSelectValue) ?? voiceSelectValue;
  })();

  const speedLabel =
    config?.speed === undefined
      ? `${t("speechSettings.speed")} (${t("providerDefault")})`
      : t("speechSettings.speedWithValue", {
          speed: config.speed.toFixed(2),
        });

  const temperatureLabel = t("temperature", {
    temperature:
      config?.temperature === undefined
        ? t("providerDefault").toLocaleLowerCase()
        : config.temperature.toFixed(2),
  });

  const topPLabel =
    config?.top_p === undefined
      ? `${t("providers:audixa.speech.topP")} (${t("providerDefault").toLowerCase()})`
      : `${t("providers:audixa.speech.topP")} (${config.top_p.toFixed(2)})`;

  const emotionOptions = [
    { value: DEFAULT_VALUE, label: t("providerDefault") },
    ...EMOTIONS.map((v) => ({ value: v, label: v })),
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={t("general")}> 
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Select
            label={t("speechSettings.voice")}
            values={[voiceSelectValue]}
            valueTitle={selectedVoiceTitle}
            options={[]}
            onChange={(val: string) => {
              const raw = String(val ?? "");
              if (raw === DEFAULT_VALUE) {
                updateConfig({ ...config, voice: undefined });
                return;
              }
              if (raw === CUSTOM_VALUE) {
                updateConfig({
                  ...config,
                  voice: isBuiltinVoice(config?.voice) ? undefined : config?.voice,
                });
                return;
              }
              updateConfig({ ...config, voice: raw });
            }}
            style={{ minWidth: 280 }}
          >
            <option value={DEFAULT_VALUE}>{t("providerDefault")}</option>
            <optgroup label={t("providers:audixa.speech.baseVoices")}>
              {BASE_VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {formatVoiceLabel(v)}
                </option>
              ))}
            </optgroup>
            <optgroup label={t("providers:audixa.speech.advanceVoices")}>
              {ADVANCE_VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {formatVoiceLabel(v)}
                </option>
              ))}
            </optgroup>
            <optgroup label={t("custom") ?? "Custom"}>
              <option value={CUSTOM_VALUE}>{t("custom")}</option>
            </optgroup>
          </theme.Select>

          <theme.Input
            id="audixa-speech-custom-voice"
            label={t("providers:audixa.speech.customVoiceId")}
            placeholder={t("providers:audixa.speech.customVoicePlaceholder")}
            disabled={voiceSelectValue !== CUSTOM_VALUE}
            value={isBuiltinVoice(config?.voice) ? "" : (config?.voice ?? "")}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              updateConfig({ ...config, voice: raw.length ? raw : undefined });
            }}
          />

          <theme.Slider
            label={speedLabel}
            min={0.5}
            max={2.0}
            step={0.01}
            value={config?.speed ?? 1.0}
            onChange={(value: number) =>
              updateConfig({
                ...config,
                speed: value,
              })
            }
          />

          <theme.Select
            label={t("providers:audixa.speech.emotion")}
            values={[config?.emotion ?? DEFAULT_VALUE]}
            valueTitle={
              emotionOptions.find((o) => o.value === (config?.emotion ?? DEFAULT_VALUE))?.label
            }
            options={emotionOptions}
            onChange={(val: string) => {
              const raw = String(val ?? "");
              updateConfig({
                ...config,
                emotion: raw === DEFAULT_VALUE ? undefined : raw,
              });
            }}
            style={{ minWidth: 220 }}
          >
            {emotionOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>

          <theme.Slider
            label={temperatureLabel}
            min={0.7}
            max={1.0}
            step={0.01}
            value={config?.temperature ?? 0.9}
            onChange={(value: number) =>
              updateConfig({
                ...config,
                temperature: value,
              })
            }
          />

          <theme.Slider
            label={topPLabel}
            min={0.7}
            max={0.98}
            step={0.01}
            value={config?.top_p ?? 0.9}
            onChange={(value: number) =>
              updateConfig({
                ...config,
                top_p: value,
              })
            }
          />
        </div>
      </theme.Card>
    </div>
  );
};
