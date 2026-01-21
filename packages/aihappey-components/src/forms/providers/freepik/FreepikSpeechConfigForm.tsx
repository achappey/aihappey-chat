import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

/**
 * UI config bucket for speech provider metadata: `providerSpeechMetadata.freepik`.
 *
 * IMPORTANT: keys must match backend JSON property names.
 * Mirrors `FreepikSpeechProviderMetadata`.
 */
export type FreepikSpeechConfig = {
    sound_effects?: {
        /** Required by Freepik. Range: 0.5..22 */
        duration_seconds: number;
        /** Optional. Range: 0..1 */
        prompt_influence?: number;
        /** Optional. */
        loop?: boolean;
    };
};

const DEFAULT_VALUE = "__default__";

const hasAnyOwnValue = (obj: Record<string, any> | undefined) =>
    !!obj && Object.values(obj).some((v) => v !== undefined);

export const FreepikSpeechConfigForm: React.FC<{
    config: FreepikSpeechConfig;
    updateConfig: (val: FreepikSpeechConfig) => void;
}> = ({ config, updateConfig }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const sound = config?.sound_effects;

    const updateSoundEffects = (
        patch: Partial<NonNullable<FreepikSpeechConfig["sound_effects"]>>
    ) => {
        const merged = {
            ...(sound ?? { duration_seconds: 5 }),
            ...patch,
        } as NonNullable<FreepikSpeechConfig["sound_effects"]>;

        // Ensure required field is always present when sound_effects is present.
        if (typeof merged.duration_seconds !== "number" || Number.isNaN(merged.duration_seconds)) {
            merged.duration_seconds = 5;
        }

        updateConfig({
            ...config,
            sound_effects: hasAnyOwnValue(merged) ? merged : undefined,
        });
    };

    const loopMode: "default" | "on" | "off" =
        sound?.loop === undefined ? "default" : sound.loop ? "on" : "off";

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <theme.Card size="small" title={t("providers:freepik.speech.soundEffects.title")}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <theme.Input
                        id="freepik-speech-sound-effects-duration-seconds"
                        type="number"
                        step={0.1}
                        min={0.5}
                        max={22}
                        required
                        label={t("providers:freepik.speech.soundEffects.durationSeconds")}
                        hint={t("providers:freepik.speech.soundEffects.durationSecondsHint")}
                        placeholder="5"
                        value={typeof sound?.duration_seconds === "number" ? sound.duration_seconds : 5}
                        onChange={(e: any) => {
                            const raw = String(e?.target?.value ?? "").trim();
                            if (!raw.length) {
                                // Keep required field populated.
                                updateSoundEffects({ duration_seconds: 5 });
                                return;
                            }
                            const next = Number(raw);
                            if (Number.isNaN(next)) return;
                            // Client-side clamp for UX; backend will enforce too.
                            const clamped = Math.min(22, Math.max(0.5, next));
                            updateSoundEffects({ duration_seconds: clamped });
                        }}
                    />

                    <theme.Select
                        label={t("providers:freepik.speech.soundEffects.promptInfluence")}
                        hint={t("providers:freepik.speech.soundEffects.promptInfluenceHint")}
                        values={[
                            sound?.prompt_influence === undefined
                                ? DEFAULT_VALUE
                                : String(sound.prompt_influence),
                        ]}
                        valueTitle={
                            sound?.prompt_influence === undefined
                                ? t("providerDefault")
                                : String(sound.prompt_influence)
                        }
                        options={[]}
                        onChange={(val: string) => {
                            const raw = String(val ?? "");
                            if (raw === DEFAULT_VALUE) {
                                updateSoundEffects({ prompt_influence: undefined });
                                return;
                            }
                            const next = Number(raw);
                            if (Number.isNaN(next)) return;
                            const clamped = Math.min(1, Math.max(0, next));
                            updateSoundEffects({ prompt_influence: clamped });
                        }}
                        style={{ minWidth: 220 }}
                    >
                        <option value={DEFAULT_VALUE}>{t("providerDefault")}</option>
                        {/* Common values for convenience */}
                        {[0, 0.1, 0.2, 0.3, 0.5, 0.7, 1].map((v) => (
                            <option key={v} value={String(v)}>
                                {String(v)}
                            </option>
                        ))}
                    </theme.Select>

                    <theme.Select
                        label={t("providers:freepik.speech.soundEffects.loop")}
                        hint={t("providers:freepik.speech.soundEffects.loopHint")}
                        values={[loopMode === "default" ? DEFAULT_VALUE : loopMode]}
                        valueTitle={
                            loopMode === "default"
                                ? t("providerDefault")
                                : loopMode === "on"
                                    ? t("enabled")
                                    : t("disabled")
                        }
                        options={[]}
                        onChange={(val: string) => {
                            const raw = String(val ?? "");
                            if (raw === DEFAULT_VALUE) {
                                updateSoundEffects({ loop: undefined });
                                return;
                            }
                            updateSoundEffects({ loop: raw === "on" });
                        }}
                        style={{ minWidth: 220 }}
                    >
                        <option value={DEFAULT_VALUE}>{t("providerDefault")}</option>
                        <option value="off">{t("disabled")}</option>
                        <option value="on">{t("enabled")}</option>
                    </theme.Select>
                </div>
            </theme.Card>
        </div>
    );
};

