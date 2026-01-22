import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

export const RUNWAY_PRESET_VOICES = [
  "Maya",
  "Arjun",
  "Serene",
  "Bernard",
  "Billy",
  "Mark",
  "Clint",
  "Mabel",
  "Chad",
  "Leslie",
  "Eleanor",
  "Elias",
  "Elliot",
  "Grungle",
  "Brodie",
  "Sandra",
  "Kirk",
  "Kylie",
  "Lara",
  "Lisa",
  "Malachi",
  "Marlene",
  "Martin",
  "Miriam",
  "Monster",
  "Paula",
  "Pip",
  "Rusty",
  "Ragnar",
  "Xylar",
  "Maggie",
  "Jack",
  "Katie",
  "Noah",
  "James",
  "Rina",
  "Ella",
  "Mariah",
  "Frank",
  "Claudia",
  "Niki",
  "Vincent",
  "Kendrick",
  "Myrna",
  "Tom",
  "Wanda",
  "Benjamin",
  "Kiana",
  "Rachel",
] as const;

export type RunwayPresetVoiceId = (typeof RUNWAY_PRESET_VOICES)[number];

export type RunwayPresetVoice = {
  type: "runway-preset";
  presetId: RunwayPresetVoiceId;
};

export type RunwaySpeechConfig = {
  voice?: RunwayPresetVoice;
  /** Runway provider options for POST /v1/sound_effect. */
  soundEffects?: {
    /** Optional. Range: 0.5..30 */
    duration?: number;
    /** Optional. Defaults to false when omitted. */
    loop?: boolean;
  };
};

const isRunwayPresetId = (v: unknown): v is RunwayPresetVoiceId =>
  typeof v === "string" && (RUNWAY_PRESET_VOICES as readonly string[]).includes(v);

export const RunwaySpeechConfigForm: React.FC<{
  config: RunwaySpeechConfig;
  updateConfig: (val: RunwaySpeechConfig) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const sound = config?.soundEffects;

  const hasAnyOwnValue = (obj: Record<string, any> | undefined) =>
    !!obj && Object.values(obj).some((v) => v !== undefined);

  const updateSoundEffects = (patch: Partial<NonNullable<RunwaySpeechConfig["soundEffects"]>>) => {
    const merged = {
      ...(sound ?? {}),
      ...patch,
    } as NonNullable<RunwaySpeechConfig["soundEffects"]>;

    updateConfig({
      ...config,
      soundEffects: hasAnyOwnValue(merged) ? merged : undefined,
    });
  };

  // Required dropdown: always keep a valid presetId.
  // If unknown or missing, fall back to a sensible default.
  const presetId: RunwayPresetVoiceId = isRunwayPresetId(config?.voice?.presetId)
    ? config.voice!.presetId
    : "Maya";

  const voiceOptions = RUNWAY_PRESET_VOICES.map((v) => ({ value: v, label: v }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={t("general")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Select
            required
            label={t("speechSettings.voice")}
            values={[presetId]}
            valueTitle={voiceOptions.find((o) => o.value === presetId)?.label}
            options={voiceOptions}
            onChange={(val: string) => {
              const nextPresetId = val as RunwayPresetVoiceId;
              updateConfig({
                ...config,
                voice: {
                  type: "runway-preset",
                  presetId: nextPresetId,
                },
              });
            }}
            style={{ minWidth: 220 }}
          >
            {voiceOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>
        </div>
      </theme.Card>

      <theme.Card size="small" title={t("providers:runway.speech.soundEffects.title")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Input
            id="runway-speech-sound-effects-duration"
            type="number"
            step={0.1}
            min={0.5}
            max={30}
            label={t("providers:runway.speech.soundEffects.duration")}
            hint={t("providers:runway.speech.soundEffects.durationHint")}
            placeholder="5"
            value={typeof sound?.duration === "number" ? sound.duration : ""}
            onChange={(e: any) => {
              const raw = String(e?.target?.value ?? "").trim();
              if (!raw.length) {
                updateSoundEffects({ duration: undefined });
                return;
              }
              const next = Number(raw);
              if (Number.isNaN(next)) return;
              const clamped = Math.min(30, Math.max(0.5, next));
              updateSoundEffects({ duration: clamped });
            }}
          />

          <theme.Switch
            id="runway-speech-sound-effects-loop"
            label={t("providers:runway.speech.soundEffects.loop")}
            checked={!!sound?.loop}
            onChange={(val: boolean) => updateSoundEffects({ loop: val })}
          />
        </div>
      </theme.Card>
    </div>
  );
};

