import React from "react";
import { useTheme } from "../../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type {
    DeepInfraSesameSpeechConfig,
    DeepInfraSpeechConfig,
} from "../DeepInfraSpeechConfigForm";

const DEFAULT_VALUE = "__default__";

const RESPONSE_FORMATS = ["mp3", "opus", "flac", "wav", "pcm"] as const;
const PRESET_VOICES = [
    "conversational_a",
    "conversational_b",
    "read_speech_a",
    "read_speech_b",
    "read_speech_c",
    "read_speech_d",
    "none",
] as const;

const isKnownResponseFormat = (v?: string) =>
    !!v && (RESPONSE_FORMATS as readonly string[]).includes(v);

const isKnownPresetVoice = (v?: string) =>
    !!v && (PRESET_VOICES as readonly string[]).includes(v);

export const DeepInfraSesameSpeechCardForm: React.FC<{
    config: DeepInfraSpeechConfig;
    updateConfig: (val: DeepInfraSpeechConfig) => void;
}> = ({ config, updateConfig }) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const sesameConfig = config?.sesame ?? {};

    const updateSesameConfig = (patch: Partial<DeepInfraSesameSpeechConfig>) => {
        updateConfig({
            ...config,
            sesame: {
                ...sesameConfig,
                ...patch,
            },
        });
    };

    const responseFormatSelectValue = isKnownResponseFormat(sesameConfig?.response_format)
        ? (sesameConfig.response_format as string)
        : DEFAULT_VALUE;

    const responseFormatOptions = [
        { value: DEFAULT_VALUE, label: t("providerDefault") },
        ...RESPONSE_FORMATS.map((f) => ({ value: f, label: f })),
    ];

    const presetVoiceSelectValue = isKnownPresetVoice(sesameConfig?.preset_voice)
        ? (sesameConfig.preset_voice as string)
        : DEFAULT_VALUE;

    const presetVoiceOptions = [
        { value: DEFAULT_VALUE, label: t("providerDefault") },
        ...PRESET_VOICES.map((v) => ({ value: v, label: v })),
    ];

    return (
        <theme.Card size="small" title="Sesame">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <theme.Select
                    label={t("outputFormat")}
                    values={[responseFormatSelectValue]}
                    valueTitle={
                        responseFormatOptions.find((o) => o.value === responseFormatSelectValue)?.label
                    }
                    options={responseFormatOptions}
                    onChange={(val: string) => {
                        const raw = String(val ?? "");
                        updateSesameConfig({
                            response_format: raw === DEFAULT_VALUE ? undefined : raw,
                        });
                    }}
                    style={{ minWidth: 220 }}
                >
                    {responseFormatOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </theme.Select>

                <theme.Select
                    label={t("speechSettings.voice")}
                    values={[presetVoiceSelectValue]}
                    valueTitle={presetVoiceOptions.find((o) => o.value === presetVoiceSelectValue)?.label}
                    options={presetVoiceOptions}
                    onChange={(val: string) => {
                        const raw = String(val ?? "");
                        updateSesameConfig({
                            preset_voice: raw === DEFAULT_VALUE ? undefined : raw,
                        });
                    }}
                    style={{ minWidth: 220 }}
                >
                    {presetVoiceOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </theme.Select>

                <div style={{ display: "flex", gap: 12, width: "100%" }}>
                    <theme.Input
                        id="deepinfra-speech-sesame-temperature"
                        type="number"
                        step={0.01}
                        style={{ flex: 1 }}
                        min={0}
                        max={2}
                        label={t("temperature",
                            {
                                temperature: sesameConfig?.temperature
                                    ?? t('providerDefault').toLocaleLowerCase()
                            })}
                        value={sesameConfig?.temperature ?? ""}
                        onChange={(e: any) => {
                            const raw = String(e?.target?.value ?? "").trim();
                            updateSesameConfig({
                                temperature: raw.length ? Number(raw) : undefined,
                            });
                        }}
                    />

                    <theme.Input
                        id="deepinfra-speech-sesame-max-audio-length"
                        type="number"
                        step={1}
                        min={0}
                        style={{ flex: 1 }}
                        max={2147483647}
                        label={t("providers:deepinfra.speech.maxAudioLengthMs")}
                        value={sesameConfig?.max_audio_length_ms ?? ""}
                        onChange={(e: any) => {
                            const raw = String(e?.target?.value ?? "").trim();
                            updateSesameConfig({
                                max_audio_length_ms: raw.length ? Number(raw) : undefined,
                            });
                        }}
                    />

                </div>
                <theme.TextArea
                    label={t("providers:deepinfra.speech.speakerAudio")}
                    value={sesameConfig?.speaker_audio ?? ""}
                    rows={3}
                    onChange={(val: string) => {
                        const raw = String(val ?? "").trim();
                        updateSesameConfig({
                            speaker_audio: raw.length ? raw : undefined,
                        });
                    }}
                />

                <theme.TextArea
                    label={t("providers:deepinfra.speech.speakerTranscript")}
                    rows={3}
                    value={sesameConfig?.speaker_transcript ?? ""}
                    onChange={(val: string) => {
                        const raw = String(val ?? "").trim();
                        updateSesameConfig({
                            speaker_transcript: raw.length ? raw : undefined,
                        });
                    }}
                />


            </div>
        </theme.Card>
    );
};
