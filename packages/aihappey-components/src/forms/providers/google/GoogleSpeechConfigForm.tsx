import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

export type GoogleSpeechSpeaker = {
    name?: string;
    voice?: string;
};

export type GoogleSpeechConfig = {
    voice?: string;
    seed?: number;
    speakers?: GoogleSpeechSpeaker[];
};
export const GOOGLE_TTS_VOICES = [
    "Zephyr",
    "Puck",
    "Charon",
    "Kore",
    "Fenrir",
    "Leda",
    "Orus",
    "Aoede",
    "Callirrhoe",
    "Autonoe",
    "Enceladus",
    "Iapetus",
    "Umbriel",
    "Algieba",
    "Despina",
    "Erinome",
    "Algenib",
    "Rasalgethi",
    "Laomedeia",
    "Achernar",
    "Alnilam",
    "Schedar",
    "Gacrux",
    "Pulcherrima",
    "Achird",
    "Zubenelgenubi",
    "Vindemiatrix",
    "Sadachbia",
    "Sadaltager",
    "Sulafat",
] as const;

export const GOOGLE_TTS_VOICE_OPTIONS = GOOGLE_TTS_VOICES.map(v => ({
    value: v,
    label: v,
}));


const GOOGLE_VOICE_VALUES = GOOGLE_TTS_VOICES.map((v) => v) as readonly string[];

export const GoogleSpeechConfigForm: React.FC<{
    config: GoogleSpeechConfig;
    updateConfig: (val: GoogleSpeechConfig) => void;
}> = ({ config, updateConfig }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const DEFAULT_VALUE = "__default__";

    const speakers = Array.isArray(config?.speakers) ? config.speakers : [];
    const multiSpeakerOn = speakers.length > 0;

    const isBuiltinVoice = (v?: string) =>
        !!v && (GOOGLE_VOICE_VALUES as readonly string[]).includes(v);

    // If an unknown value is present, show Provider default but don't clear it
    // until the user explicitly changes the dropdown.
    const voiceSelectValue = isBuiltinVoice(config?.voice)
        ? (config.voice as string)
        : DEFAULT_VALUE;

    const voiceOptions = [
        { value: DEFAULT_VALUE, label: t("providerDefault") },
        ...GOOGLE_TTS_VOICES.map((v) => ({ value: v, label: v })),
    ];

    const updateSpeaker = (idx: number, next: Partial<GoogleSpeechSpeaker>) => {
        const nextSpeakers = speakers.map((s, i) => (i === idx ? { ...s, ...next } : s));
        updateConfig({ ...config, speakers: nextSpeakers });
    };

    const removeSpeaker = (idx: number) => {
        const nextSpeakers = speakers.filter((_, i) => i !== idx);
        updateConfig({ ...config, speakers: nextSpeakers.length ? nextSpeakers : undefined });
    };

    const addSpeaker = () => {
        updateConfig({
            ...config,
            speakers: [...speakers, { name: "", voice: undefined }],
        });
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <theme.Card size="small" title={t("general")}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <theme.Select
                        label={t("speechSettings.voice")}
                        values={[voiceSelectValue]}
                        valueTitle={voiceOptions.find((o) => o.value === voiceSelectValue)?.label}
                        options={voiceOptions}
                        disabled={multiSpeakerOn}
                        onChange={(val: string) => {
                            const raw = String(val ?? "");

                            if (raw === DEFAULT_VALUE) {
                                updateConfig({ ...config, voice: undefined });
                                return;
                            }

                            updateConfig({ ...config, voice: raw });
                        }}
                        style={{ minWidth: 220 }}
                    >
                        {voiceOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </theme.Select>

                    <theme.Input
                        id="google-speech-seed"
                        type="number"
                        step={1}
                        label={t("providers:google.speech.seed")}
                        value={config?.seed ?? ""}
                        onChange={(e: any) => {
                            const raw = String(e?.target?.value ?? "").trim();
                            updateConfig({
                                ...config,
                                seed: raw.length ? Number(raw) : undefined,
                            });
                        }}
                    />


                </div>
            </theme.Card>

            <theme.Card size="small"
                headerActions={<theme.Switch
                    id="google-speech-multi-speaker"
                    label={t("providers:google.speech.multiSpeaker")}
                    checked={multiSpeakerOn}
                    onChange={(enabled) => {
                        if (!enabled) {
                            updateConfig({ ...config, speakers: undefined });
                            return;
                        }

                        // Turning ON: ensure list present and non-empty.
                        updateConfig({
                            ...config,
                            speakers: speakers.length ? speakers : [{ name: "", voice: undefined }],
                        });
                    }}
                />}
                title={t("providers:google.speech.speakers")}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {speakers.map((speaker, idx) => {
                        const speakerVoiceSelectValue = isBuiltinVoice(speaker?.voice)
                            ? (speaker.voice as string)
                            : DEFAULT_VALUE;

                        return (
                            <div
                                key={`speaker-${idx}`}
                                style={{
                                    display: "flex",
                                    gap: 12,
                                    alignItems: "flex-end",
                                    flexWrap: "wrap",
                                }}
                            >
                                <div style={{ flex: "1 1 240px", minWidth: 240 }}>
                                    <theme.Input
                                        label={t("name")}
                                        disabled={!multiSpeakerOn}
                                        placeholder={t("providers:google.speech.speakerNamePlaceholder")}
                                        value={speaker?.name ?? ""}
                                        onChange={(e: any) => {
                                            const raw = String(e?.target?.value ?? "");
                                            updateSpeaker(idx, { name: raw });
                                        }}
                                    />
                                </div>

                                <div style={{ flex: "0 0 260px" }}>
                                    <theme.Select
                                        label={t("speechSettings.voice")}
                                        disabled={!multiSpeakerOn}
                                        values={[speakerVoiceSelectValue]}
                                        valueTitle={
                                            voiceOptions.find((o) => o.value === speakerVoiceSelectValue)?.label
                                        }
                                        options={voiceOptions}
                                        onChange={(val: string) => {
                                            const raw = String(val ?? "");
                                            updateSpeaker(idx, {
                                                voice: raw === DEFAULT_VALUE ? undefined : raw,
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

                                <theme.Button
                                    type="button"
                                    icon="delete"
                                    disabled={!multiSpeakerOn}
                                    variant="danger"
                                    size="small"
                                    title={t("delete")}
                                    onClick={() => removeSpeaker(idx)}
                                />
                            </div>
                        );
                    })}

                    <div>
                        <theme.Button
                            type="button"
                            size="small"
                            disabled={!multiSpeakerOn}
                            variant="subtle"
                            icon="add"
                            onClick={addSpeaker}
                        >
                            {t("providers:google.speech.addSpeaker")}
                        </theme.Button>
                    </div>
                </div>
            </theme.Card>

        </div>
    );
};

