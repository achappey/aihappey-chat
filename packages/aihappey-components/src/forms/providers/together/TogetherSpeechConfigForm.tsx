import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import { CARTESIA_VOICES, KOKORO_VOICES, ORPHEUS_SAMPLE_VOICES } from "./togetherVoices";

export type TogetherSpeechProviderVoiceMetadata = {
    voice?: string;
};

/**
 * IMPORTANT: keys must match backend JSON property names.
 * Mirrors `TogetherSpeechProviderMetadata`.
 */
export type TogetherSpeechConfig = {
    response_format?: "mp3" | "wav" | "raw" | string;
    sample_rate?: number;
    response_encoding?: "pcm_f32le" | "pcm_s16le" | "pcm_mulaw" | "pcm_alaw" | string;
    language?: string;

    cartesia?: TogetherSpeechProviderVoiceMetadata;
    hexgrad?: TogetherSpeechProviderVoiceMetadata;
    canopylabs?: TogetherSpeechProviderVoiceMetadata;
};

const TOGETHER_LANGUAGES: Array<{ value: string; label: string }> = [
    { value: "en", label: "English" },
    { value: "de", label: "Deutsch" },
    { value: "fr", label: "Français" },
    { value: "es", label: "Español" },
    { value: "hi", label: "हिन्दी" },
    { value: "it", label: "Italiano" },
    { value: "ja", label: "日本語" },
    { value: "ko", label: "한국어" },
    { value: "nl", label: "Nederlands" },
    { value: "pl", label: "Polski" },
    { value: "pt", label: "Português" },
    { value: "ru", label: "Русский" },
    { value: "sv", label: "Svenska" },
    { value: "tr", label: "Türkçe" },
    { value: "zh", label: "中文" },
];

const DEFAULT_VALUE = "__default__";

const hasAnyOwnValue = (obj: Record<string, any> | undefined) =>
    !!obj && Object.values(obj).some((v) => v !== undefined);

export const TogetherSpeechConfigForm: React.FC<{
    config: TogetherSpeechConfig;
    updateConfig: (val: TogetherSpeechConfig) => void;
}> = ({ config, updateConfig }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const responseFormatOptions = [
        { value: DEFAULT_VALUE, label: t("providerDefault") },
        { value: "mp3", label: "mp3" },
        { value: "wav", label: "wav" },
        { value: "raw", label: "raw" },
    ];

    const responseEncodingOptions = [
        { value: DEFAULT_VALUE, label: t("providerDefault") },
        { value: "pcm_f32le", label: "pcm_f32le" },
        { value: "pcm_s16le", label: "pcm_s16le" },
        { value: "pcm_mulaw", label: "pcm_mulaw" },
        { value: "pcm_alaw", label: "pcm_alaw" },
    ];

    const languageOptions = [
        { value: DEFAULT_VALUE, label: t("providerDefault") },
        ...TOGETHER_LANGUAGES.map((l) => ({ value: l.value, label: l.label })),
    ];

    const updateNestedVoice = (
        key: "cartesia" | "hexgrad" | "canopylabs",
        nextVoice: string | undefined
    ) => {
        const merged = {
            ...(config?.[key] ?? {}),
            voice: nextVoice,
        } as TogetherSpeechProviderVoiceMetadata;

        updateConfig({
            ...config,
            [key]: hasAnyOwnValue(merged) ? merged : undefined,
        });
    };

    const makeVoiceOptions = (voices: readonly string[]) => [
        ...voices.map((v) => ({ value: v, label: v })),
    ];

    const orpheusVoiceOptions = makeVoiceOptions(ORPHEUS_SAMPLE_VOICES);
    const kokoroVoiceOptions = makeVoiceOptions(KOKORO_VOICES);
    const cartesiaVoiceOptions = makeVoiceOptions(CARTESIA_VOICES);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <theme.Card size="small" title={t("general")}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <theme.Select
                        label={t("outputFormat")}
                        values={[config?.response_format ?? DEFAULT_VALUE]}
                        valueTitle={
                            responseFormatOptions.find(
                                (o) => o.value === (config?.response_format ?? DEFAULT_VALUE)
                            )?.label
                        }
                        options={responseFormatOptions}
                        onChange={(val: string) => {
                            const raw = String(val ?? "");
                            updateConfig({
                                ...config,
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

                    <theme.Input
                        id="together-speech-sample-rate"
                        type="number"
                        step={1}
                        min={8000}
                        max={48000}
                        label={t("speechSettings.sampleRate")}
                        placeholder="ex. 24000"
                        value={config?.sample_rate ?? ""}
                        onChange={(e: any) => {
                            const raw = String(e?.target?.value ?? "").trim();
                            updateConfig({
                                ...config,
                                sample_rate: raw.length ? Number(raw) : undefined,
                            });
                        }}
                    />

                    <theme.Select
                        label={t("providers:together.speech.encoding")}
                        values={[config?.response_encoding ?? DEFAULT_VALUE]}
                        valueTitle={
                            responseEncodingOptions.find(
                                (o) => o.value === (config?.response_encoding ?? DEFAULT_VALUE)
                            )?.label
                        }
                        options={responseEncodingOptions}
                        onChange={(val: string) => {
                            const raw = String(val ?? "");
                            updateConfig({
                                ...config,
                                response_encoding: raw === DEFAULT_VALUE ? undefined : raw,
                            });
                        }}
                        style={{ minWidth: 220 }}
                    >
                        {responseEncodingOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </theme.Select>

                    <theme.Select
                        label={t("language")}
                        values={[config?.language ?? DEFAULT_VALUE]}
                        valueTitle={
                            languageOptions.find((o) => o.value === (config?.language ?? DEFAULT_VALUE))?.label
                        }
                        options={languageOptions}
                        onChange={(val: string) => {
                            const raw = String(val ?? "");
                            updateConfig({
                                ...config,
                                language: raw === DEFAULT_VALUE ? undefined : raw,
                            });
                        }}
                        style={{ minWidth: 220 }}
                    >
                        {languageOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </theme.Select>
                </div>
            </theme.Card>

            <theme.Card size="small" title="Canopy Labs">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <theme.Select
                        label={t("speechSettings.voice")}
                        values={config?.canopylabs?.voice ? [config?.canopylabs?.voice] : []}
                        valueTitle={
                            orpheusVoiceOptions.find((o) => o.value === config?.canopylabs?.voice)?.label ?? ""
                        }
                        options={orpheusVoiceOptions}
                        onChange={(val: string) => {
                            const raw = String(val ?? "");
                            updateNestedVoice("canopylabs", raw);
                        }}
                        style={{ minWidth: 220 }}
                    >
                        {orpheusVoiceOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </theme.Select>
                </div>
            </theme.Card>

            <theme.Card size="small" title="Hexgrad">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <theme.Select
                        label={t("speechSettings.voice")}
                        values={config?.hexgrad?.voice ? [config?.hexgrad?.voice] : []}
                        valueTitle={kokoroVoiceOptions.find((o) => o.value === config?.hexgrad?.voice)?.label ?? ""}
                        options={kokoroVoiceOptions}
                        onChange={(val: string) => {
                            const raw = String(val ?? "");
                            updateNestedVoice("hexgrad", raw);
                        }}
                        style={{ minWidth: 220 }}
                    >
                        {kokoroVoiceOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </theme.Select>
                </div>
            </theme.Card>

            <theme.Card size="small" title="Cartesia">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <theme.Select
                        label={t("speechSettings.voice")}
                        values={config?.cartesia?.voice ? [config?.cartesia?.voice] : []}
                        valueTitle={
                            cartesiaVoiceOptions.find((o) => o.value === config?.cartesia?.voice)?.label ?? ""
                        }
                        options={cartesiaVoiceOptions}
                        onChange={(val: string) => {
                            const raw = String(val ?? "");
                            updateNestedVoice("cartesia", raw);
                        }}
                        style={{ minWidth: 220 }}
                    >
                        {cartesiaVoiceOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </theme.Select>
                </div>
            </theme.Card>
        </div>
    );
};

