import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

export type AsyncVoice = {
    /** AsyncAI currently supports only `id` mode. */
    mode: "id";
    /** Voice id */
    id: string;
};

export type AsyncOutputFormat = {
    /** raw | mp3 | wav */
    container?: "raw" | "mp3" | "wav";
    /** pcm_f32le | pcm_s16le (ignored for mp3) */
    encoding?: "pcm_f32le" | "pcm_s16le";
    /** 8000..48000 */
    sample_rate?: number;
    /** 32000..320000 (mp3 only) */
    bit_rate?: number;
};

/**
 * IMPORTANT: keys must match backend JSON property names (snake_case).
 */
export type AsyncSpeechConfig = {
    voice?: AsyncVoice;
    output_format?: AsyncOutputFormat;
    language?: string;
    speed_control?: number;
    stability?: number;
};

const ASYNCAI_LANGUAGES: Array<{ value: string; label: string }> = [
    { value: "en", label: "English" },
    { value: "fr", label: "Français" },
    { value: "es", label: "Español" },
    { value: "de", label: "Deutsch" },
    { value: "it", label: "Italiano" },
    { value: "pt", label: "Português" },
    { value: "ar", label: "العربية" },
    { value: "ru", label: "Русский" },
    { value: "ro", label: "Română" },
    { value: "ja", label: "日本語" },
    { value: "he", label: "עברית" },
    { value: "hy", label: "Հայերեն" },
    { value: "tr", label: "Türkçe" },
    { value: "hi", label: "हिन्दी" },
    { value: "zh", label: "中文" },
];


export const AsyncSpeechConfigForm: React.FC<{
    config: AsyncSpeechConfig;
    updateConfig: (val: AsyncSpeechConfig) => void;
}> = ({ config, updateConfig }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const DEFAULT_VALUE = "__default__";

    const outputFormat = config?.output_format ?? {};
    const container = outputFormat?.container;
    const isMp3 = container === "mp3";

    const containerOptions = [
        { value: DEFAULT_VALUE, label: t("providerDefault") },
        { value: "raw", label: "raw" },
        { value: "mp3", label: "mp3" },
        { value: "wav", label: "wav" },
    ];

    const encodingOptions = [
        { value: DEFAULT_VALUE, label: t("providerDefault") },
        { value: "pcm_f32le", label: "pcm_f32le" },
        { value: "pcm_s16le", label: "pcm_s16le" },
    ];

    const languageOptions = [
        { value: DEFAULT_VALUE, label: t("providerDefault") },
        ...ASYNCAI_LANGUAGES.map((l) => ({ value: l.value, label: `${l.label}` })),
    ];

    const updateOutputFormat = (next: Partial<AsyncOutputFormat>) => {
        const merged: AsyncOutputFormat = {
            ...(config?.output_format ?? {}),
            ...next,
        };

        // Avoid serializing an empty object; keep consistent with other forms.
        const hasAny = Object.values(merged).some((v) => v !== undefined);
        updateConfig({
            ...config,
            output_format: hasAny ? merged : undefined,
        });
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <theme.Card size="small" title={t("general")}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <theme.Input
                        id="asyncai-speech-voice-id"
                        label={t("speechSettings.voice")}
                        placeholder="ex. e0f39dc4-f691-4e78-bba5-5c636692cc04"
                        value={config?.voice?.id ?? ""}
                        onChange={(e: any) => {
                            const raw = String(e?.target?.value ?? "").trim();
                            updateConfig({
                                ...config,
                                voice: raw ? { mode: "id", id: raw } : undefined,
                            });
                        }}
                    />

                    <theme.Select
                        label={t("outputFormat")}
                        values={[outputFormat?.container ?? DEFAULT_VALUE]}
                        valueTitle={
                            containerOptions.find(
                                (o) => o.value === (outputFormat?.container ?? DEFAULT_VALUE)
                            )?.label
                        }
                        options={containerOptions}
                        onChange={(val: string) => {
                            const raw = String(val ?? "");
                            const nextContainer = raw === DEFAULT_VALUE ? undefined : (raw as any);

                            // Dependent-field cleanup per AsyncAI docs.
                            // - mp3 ignores encoding; raw/wav ignore bit_rate.
                            if (nextContainer === "mp3") {
                                updateOutputFormat({
                                    container: nextContainer,
                                    encoding: undefined,
                                });
                            } else {
                                updateOutputFormat({
                                    container: nextContainer,
                                    bit_rate: undefined,
                                });
                            }
                        }}
                        style={{ minWidth: 220 }}
                    >
                        {containerOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </theme.Select>

                    <theme.Select
                        label={t("providers:asyncai.speech.encoding")}
                        values={[isMp3 ? DEFAULT_VALUE : outputFormat?.encoding ?? DEFAULT_VALUE]}
                        valueTitle={
                            encodingOptions.find(
                                (o) => o.value === (isMp3 ? DEFAULT_VALUE : outputFormat?.encoding ?? DEFAULT_VALUE)
                            )?.label
                        }
                        options={encodingOptions}
                        disabled={isMp3}
                        onChange={(val: string) => {
                            const raw = String(val ?? "");
                            updateOutputFormat({
                                encoding: raw === DEFAULT_VALUE ? undefined : (raw as any),
                            });
                        }}
                        style={{ minWidth: 220 }}
                    >
                        {encodingOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </theme.Select>

                    <theme.Input
                        id="asyncai-speech-sample-rate"
                        type="number"
                        step={1}
                        min={8000}
                        max={48000}
                        label={t("speechSettings.sampleRate")}
                        placeholder="ex. 44100"
                        value={outputFormat?.sample_rate ?? ""}
                        onChange={(e: any) => {
                            const raw = String(e?.target?.value ?? "").trim();
                            updateOutputFormat({
                                sample_rate: raw.length ? Number(raw) : undefined,
                            });
                        }}
                    />

                    <theme.Input
                        id="asyncai-speech-bit-rate"
                        type="number"
                        step={1000}
                        min={32000}
                        max={320000}
                        label={t("providers:asyncai.speech.bitRateMp3Only")}
                        placeholder="ex. 192000"
                        disabled={!isMp3}
                        value={isMp3 ? outputFormat?.bit_rate ?? "" : ""}
                        onChange={(e: any) => {
                            const raw = String(e?.target?.value ?? "").trim();
                            updateOutputFormat({
                                bit_rate: raw.length ? Number(raw) : undefined,
                            });
                        }}
                    />

                    <theme.Select
                        label={t("language")}
                        values={[config?.language ?? DEFAULT_VALUE]}
                        valueTitle={
                            languageOptions.find((o) => o.value === (config?.language ?? DEFAULT_VALUE))
                                ?.label
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

            <theme.Card size="small" title={t("providers:asyncai.speech.experimental")}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <theme.Switch
                        id="asyncai-speech-speed-control-enabled"
                        label={t("providers:asyncai.speech.overrideSpeedControl")}
                        checked={config?.speed_control !== undefined}
                        onChange={(enabled) => {
                            updateConfig({
                                ...config,
                                speed_control: enabled ? (config?.speed_control ?? 1.0) : undefined,
                            });
                        }}
                    />

                    <theme.Slider
                        label={
                            config?.speed_control === undefined
                                ? `${t("providers:asyncai.speech.speedControl")} (${t("providerDefault")})`
                                : `${t("providers:asyncai.speech.speedControl")} (${config.speed_control.toFixed(2)})`
                        }
                        min={0.7}
                        max={2.0}
                        step={0.01}
                        value={config?.speed_control ?? 1.0}
                        onChange={(value: number) =>
                            updateConfig({
                                ...config,
                                speed_control: value,
                            })
                        }
                        disabled={config?.speed_control === undefined}
                    />

                    <theme.Switch
                        id="asyncai-speech-stability-enabled"
                        label={t("providers:asyncai.speech.overrideStability")}
                        checked={config?.stability !== undefined}
                        onChange={(enabled) => {
                            updateConfig({
                                ...config,
                                stability: enabled ? (config?.stability ?? 50) : undefined,
                            });
                        }}
                    />

                    <theme.Slider
                        label={
                            config?.stability === undefined
                                ? `${t("providers:asyncai.speech.stability")} (${t("providerDefault")})`
                                : `${t("providers:asyncai.speech.stability")} (${config.stability})`
                        }
                        min={0}
                        max={100}
                        step={1}
                        value={config?.stability ?? 50}
                        onChange={(value: number) =>
                            updateConfig({
                                ...config,
                                stability: value,
                            })
                        }
                        disabled={config?.stability === undefined}
                    />
                </div>
            </theme.Card>
        </div>
    );
};

