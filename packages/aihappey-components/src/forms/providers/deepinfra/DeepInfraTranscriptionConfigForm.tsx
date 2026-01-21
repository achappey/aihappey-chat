import React from "react";

import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

/**
 * UI config bucket for transcription provider metadata: `providerTranscriptionMetadata.deepinfra`.
 *
 * IMPORTANT: keys must match backend JSON property names.
 * Mirrors `DeepInfraTranscriptionProviderMetadata`.
 */
export type DeepInfraTranscriptionConfig = {
    /** Allowed: "transcribe" | "translate" (undefined => provider default). */
    task?: string;
    /** Optional prompt for the first window. */
    initial_prompt?: string;
    /** Temperature for sampling (undefined => provider default, docs default 0). */
    temperature?: number;
    /** ISO 639-1 language code (undefined => auto-detect/provider default). */
    language?: string;
    /** Allowed: "segment" | "word" (undefined => provider default, docs default segment). */
    chunk_level?: string;
    /** Range 1..30 (undefined => provider default, docs default 30). */
    chunk_length_s?: number;
};

const DEFAULT_VALUE = "__default__";

const DEEPINFRA_LANG_CODES = [
    "af",
    "am",
    "ar",
    "as",
    "az",
    "ba",
    "be",
    "bg",
    "bn",
    "bo",
    "br",
    "bs",
    "ca",
    "cs",
    "cy",
    "da",
    "de",
    "el",
    "en",
    "es",
    "et",
    "eu",
    "fa",
    "fi",
    "fo",
    "fr",
    "gl",
    "gu",
    "ha",
    "haw",
    "he",
    "hi",
    "hr",
    "ht",
    "hu",
    "hy",
    "id",
    "is",
    "it",
    "ja",
    "jw",
    "ka",
    "kk",
    "km",
    "kn",
    "ko",
    "la",
    "lb",
    "ln",
    "lo",
    "lt",
    "lv",
    "mg",
    "mi",
    "mk",
    "ml",
    "mn",
    "mr",
    "ms",
    "mt",
    "my",
    "ne",
    "nl",
    "nn",
    "no",
    "oc",
    "pa",
    "pl",
    "ps",
    "pt",
    "ro",
    "ru",
    "sa",
    "sd",
    "si",
    "sk",
    "sl",
    "sn",
    "so",
    "sq",
    "sr",
    "su",
    "sv",
    "sw",
    "ta",
    "te",
    "tg",
    "th",
    "tk",
    "tl",
    "tr",
    "tt",
    "uk",
    "ur",
    "uz",
    "vi",
    "yi",
    "yo",
    "yue",
    "zh",
] as const;

const languageLabel = (code: string) => {
    // Prefer built-in locale display names when available.
    try {
        const dn = new Intl.DisplayNames(undefined, { type: "language" });
        const name = dn.of(code);
        if (name) return `${name} (${code})`;
    } catch {
        // ignore
    }
    return code;
};

const parseOptionalNumber = (raw: unknown): number | undefined => {
    const s = String(raw ?? "").trim();
    if (!s) return undefined;
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
};

export const DeepInfraTranscriptionConfigForm: React.FC<{
    config: DeepInfraTranscriptionConfig;
    updateConfig: (val: DeepInfraTranscriptionConfig) => void;
}> = ({ config, updateConfig }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const taskOptions = [
        { value: DEFAULT_VALUE, label: t("providerDefault") },
        { value: "transcribe", label: t("providers:deepinfra.transcription.taskTranscribe") },
        { value: "translate", label: t("providers:deepinfra.transcription.taskTranslate") },
    ];

    const chunkLevelOptions = [
        { value: DEFAULT_VALUE, label: t("providerDefault") },
        { value: "segment", label: t("providers:deepinfra.transcription.chunkLevelSegment") },
        { value: "word", label: t("providers:deepinfra.transcription.chunkLevelWord") },
    ];

    const languageOptions = [
        { value: DEFAULT_VALUE, label: t("providerDefault") },
        ...DEEPINFRA_LANG_CODES.map((code) => ({ value: code, label: languageLabel(code) })),
    ];

    const taskValue = config?.task ?? DEFAULT_VALUE;
    const chunkLevelValue = config?.chunk_level ?? DEFAULT_VALUE;
    const languageValue = config?.language ?? DEFAULT_VALUE;

    const taskTitle = taskOptions.find((o) => o.value === taskValue)?.label ?? "";
    const chunkLevelTitle =
        chunkLevelOptions.find((o) => o.value === chunkLevelValue)?.label ?? "";
    const languageTitle =
        languageOptions.find((o) => o.value === languageValue)?.label ?? languageLabel(languageValue);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <theme.Card
                size="small"
                title={t("general")}
            >
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <theme.Select
                        label={t("providers:deepinfra.transcription.task")}
                        values={[taskValue]}
                        valueTitle={taskTitle}
                        options={taskOptions}
                        onChange={(val: string) => {
                            const raw = String(val ?? "");
                            updateConfig({
                                ...config,
                                task: raw === DEFAULT_VALUE ? undefined : raw,
                            });
                        }}
                        style={{ minWidth: 220 }}
                    >
                        {taskOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </theme.Select>

                    <theme.Select
                        label={t("language")}
                        values={[languageValue]}
                        valueTitle={languageTitle}
                        options={languageOptions}
                        onChange={(val: string) => {
                            const raw = String(val ?? "").trim();
                            updateConfig({
                                ...config,
                                language: raw === DEFAULT_VALUE || !raw ? undefined : raw,
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

                    <theme.TextArea
                        label={t("providers:deepinfra.transcription.initialPrompt")}
                        placeholder={t("optional")}
                        rows={4}
                        value={config?.initial_prompt ?? ""}
                        onChange={(val: string) => {
                            const raw = String(val ?? "");
                            updateConfig({
                                ...config,
                                initial_prompt: raw.length ? raw : undefined,
                            });
                        }}
                    />

                    <theme.Input
                        id="deepinfra-transcription-temperature"
                        label={t("temperature", { temperature: config?.temperature ?? t('providerDefault').toLocaleLowerCase() })}
                        type="number"
                        min={0}
                        value={config?.temperature ?? ""}
                        onChange={(e) => {
                            const next = parseOptionalNumber(e?.target?.value);
                            updateConfig({
                                ...config,
                                temperature: next,
                            });
                        }}
                    />
                </div>
            </theme.Card>

            <theme.Card size="small" title={t("providers:deepinfra.transcription.chunkingTitle")}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <theme.Select
                        label={t("providers:deepinfra.transcription.chunkLevel")}
                        values={[chunkLevelValue]}
                        valueTitle={chunkLevelTitle}
                        options={chunkLevelOptions}
                        onChange={(val: string) => {
                            const raw = String(val ?? "");
                            updateConfig({
                                ...config,
                                chunk_level: raw === DEFAULT_VALUE ? undefined : raw,
                            });
                        }}
                        style={{ minWidth: 220 }}
                    >
                        {chunkLevelOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </theme.Select>

                    <theme.Input
                        id="deepinfra-transcription-chunk-length-s"
                        label={t("providers:deepinfra.transcription.chunkLengthSeconds")}
                        type="number"
                        min={1}
                        max={30}
                        value={config?.chunk_length_s ?? ""}
                        onChange={(e) => {
                            const next = parseOptionalNumber(e?.target?.value);
                            updateConfig({
                                ...config,
                                chunk_length_s: next,
                            });
                        }}
                    />
                </div>
            </theme.Card>
        </div>
    );
};

