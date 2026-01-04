import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

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

const NOVITA_VOICES = [
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

const GLM_SYSTEM_VOICES = [
  "tongtong",
  "chuichui",
  "xiaochen",
  "jam",
  "kazi",
  "douji",
  "luodo",
] as const;

const TXT2SPEECH_VOICES = ["Emily", "James", "Olivia", "Michael", "Sarah", "John"] as const;

export const NovitaSpeechConfigForm: React.FC<{
  config: NovitaSpeechConfig;
  updateConfig: (val: NovitaSpeechConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const DEFAULT_VALUE = "__default__";

  const humanize = (s: string) => String(s ?? "").replaceAll("_", " ");

  const minimax = config?.minimax ?? {};
  const glm = config?.glm ?? {};
  const txt2speech = config?.txt2speech ?? {};

  const isMinimaxSystemVoice = (v?: string) =>
    !!v && (NOVITA_VOICES as readonly string[]).includes(v);
  const isGlmVoice = (v?: string) => !!v && (GLM_SYSTEM_VOICES as readonly string[]).includes(v);
  const isTxt2SpeechVoice = (v?: string) =>
    !!v && (TXT2SPEECH_VOICES as readonly string[]).includes(v);

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

  const glmVoiceValue = isGlmVoice(glm?.voice) ? (glm.voice as string) : DEFAULT_VALUE;
  const glmVolumeValue = glm?.volume ?? 1.0;
  const glmSpeedValue = glm?.speed ?? 1.0;

  const txt2speechVoiceValue = isTxt2SpeechVoice(txt2speech?.voice_id)
    ? (txt2speech.voice_id as string)
    : DEFAULT_VALUE;
  const txt2speechVolumeValue = txt2speech?.volume ?? 1.0;
  const txt2speechSpeedValue = txt2speech?.speed ?? 1.0;

  const minimaxVoiceOptions = [
    { value: DEFAULT_VALUE, label: t("providerDefault") },
    ...NOVITA_VOICES.map((v) => ({ value: v, label: humanize(v) })),
  ];

  const glmVoiceOptions = [
    { value: DEFAULT_VALUE, label: t("providerDefault") },
    ...GLM_SYSTEM_VOICES.map((v) => ({ value: v, label: humanize(v) })),
  ];

  const txt2speechVoiceOptions = [
    { value: DEFAULT_VALUE, label: t("providerDefault") },
    ...TXT2SPEECH_VOICES.map((v) => ({ value: v, label: humanize(v) })),
  ];

  const updateMinimax = (next: Partial<NovitaMinimaxSpeechConfig>) =>
    updateConfig({
      ...config,
      minimax: {
        ...minimax,
        ...next,
      },
    });

  const updateGlm = (next: Partial<NovitaGlmSpeechConfig>) =>
    updateConfig({
      ...config,
      glm: {
        ...glm,
        ...next,
      },
    });

  const updateTxt2Speech = (next: Partial<NovitaTxt2SpeechSpeechConfig>) =>
    updateConfig({
      ...config,
      txt2speech: {
        ...txt2speech,
        ...next,
      },
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title="Minimax">
        <div>
          <theme.Select
            label={t("speechSettings.voice")}
            values={[minimaxSystemVoiceValue]}
            valueTitle={
              minimaxVoiceOptions.find((o) => o.value === minimaxSystemVoiceValue)?.label
            }
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
    </div>
  );
};

