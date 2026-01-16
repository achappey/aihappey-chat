import React, { useMemo, useState } from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type { TagItem } from "aihappey-types";
import { GladiaCustomVocabularyCardForm } from "./cards/GladiaCustomVocabularyCardForm";
import { GladiaSubtitlesCardForm } from "./cards/GladiaSubtitlesCardForm";
import { GladiaDiarizationCardForm } from "./cards/GladiaDiarizationCardForm";
import { GladiaTranslationCardForm } from "./cards/GladiaTranslationCardForm";
import { GladiaSummarizationCardForm } from "./cards/GladiaSummarizationCardForm";
import { GladiaAnalysisCardForm } from "./cards/GladiaAnalysisCardForm";
import { GladiaCustomSpellingCardForm } from "./cards/GladiaCustomSpellingCardForm";
import { GladiaStructuredDataExtractionCardForm } from "./cards/GladiaStructuredDataExtractionCardForm";
import { GladiaAudioToLlmCardForm } from "./cards/GladiaAudioToLlmCardForm";
import { GladiaOutputCardForm } from "./cards/GladiaOutputCardForm";
import { GladiaLanguageConfigCardForm } from "./cards/GladiaLanguageConfigCardForm";
import { VocabularyListEditor } from "./fields/VocabularyListEditor";
import { StringListEditor } from "./fields/StringListEditor";
import { LanguageListEditor } from "./fields/LanguageListEditor";
import { CustomSpellingEditor } from "./fields/CustomSpellingEditor";
import { LANGUAGE_NATIVE_NAMES, GLADIA_LANGUAGE_CODES, GLADIA_TRANSLATION_TARGET_LANGUAGE_CODES } from "./constants";

/**
 * IMPORTANT: keys must match backend JSON property names.
 * Mirrors `GladiaTranscriptionProviderMetadata` (excluding deprecated fields and custom_metadata).
 */
export type GladiaTranscriptionConfig = {
    custom_vocabulary?: boolean | GladiaVocabularyItem[];
    custom_vocabulary_config?: GladiaCustomVocabularyConfig;

    callback?: boolean;
    callback_config?: GladiaCallbackConfig;

    subtitles?: boolean;
    subtitles_config?: GladiaSubtitlesConfig;

    diarization?: boolean;
    diarization_config?: GladiaDiarizationConfig;

    translation?: boolean;
    translation_config?: GladiaTranslationConfig;

    summarization?: boolean;
    summarization_config?: GladiaSummarizationConfig;

    moderation?: boolean;
    named_entity_recognition?: boolean;
    chapterization?: boolean;
    name_consistency?: boolean;

    custom_spelling?: boolean;
    custom_spelling_config?: GladiaCustomSpellingConfig;

    structured_data_extraction?: boolean;
    structured_data_extraction_config?: GladiaStructuredDataExtractionConfig;

    sentiment_analysis?: boolean;

    audio_to_llm?: boolean;
    audio_to_llm_config?: GladiaAudioToLlmConfig;

    sentences?: boolean;
    display_mode?: boolean;
    punctuation_enhanced?: boolean;

    language_config?: GladiaLanguageConfig;
};

export type GladiaVocabularyItem =
    | string
    | {
        value: string;
        intensity?: number;
        pronunciations?: string[];
        language?: string;
    };

export type GladiaCustomVocabularyConfig = {
    vocabulary: GladiaVocabularyItem[];
    default_intensity?: number;
};

export type GladiaCallbackConfig = {
    url?: string;
    method?: "POST" | "PUT";
};

export type GladiaSubtitlesConfig = {
    formats?: Array<"srt" | "vtt">;
    minimum_duration?: number;
    maximum_duration?: number;
    maximum_characters_per_row?: number;
    maximum_rows_per_caption?: number;
    style?: "default" | "compliance";
};

export type GladiaDiarizationConfig = {
    number_of_speakers?: number;
    min_speakers?: number;
    max_speakers?: number;
};

export type GladiaTranslationConfig = {
    target_languages: string[];
    model?: "base" | "enhanced";
    match_original_utterances?: boolean;
    lipsync?: boolean;
    context_adaptation?: boolean;
    context?: string;
    informal?: boolean;
};

export type GladiaSummarizationConfig = {
    type?: "general" | "bullet_points" | "concise";
};

export type GladiaCustomSpellingConfig = {
    spelling_dictionary: Record<string, string[]>;
};

export type GladiaStructuredDataExtractionConfig = {
    classes: string[];
};

export type GladiaAudioToLlmConfig = {
    prompts: string[];
};

export type GladiaLanguageConfig = {
    languages?: string[];
    code_switching?: boolean;
};

export type VocabularyRow = {
    kind: "string" | "object";
    value: string;
    intensity?: number;
    pronunciations?: string[];
    language?: string;
};

const normalizeListItem = (s: string): string =>
    (s ?? "").trim().replace(/\s+/g, " ");

const normalizeList = (val: unknown): string[] => {
    const raw = Array.isArray(val) ? val : [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const v of raw) {
        const n = normalizeListItem(String(v ?? ""));
        if (!n) continue;
        const key = n.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(n);
    }
    return out;
};

export const parseOptionalNumber = (rawInput: any): number | undefined => {
    const raw = String(rawInput ?? "").trim();
    if (!raw) return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
};

const parseOptionalInt = (rawInput: any): number | undefined => {
    const raw = String(rawInput ?? "").trim();
    if (!raw) return undefined;
    const n = Number(raw);
    if (!Number.isFinite(n)) return undefined;
    return Math.trunc(n);
};

const buildLanguageOptions = (
    t: (key: string) => string,
    codes: string[],
    includeProviderDefault = false
) => {
    const base = codes.map((code) => ({
        value: code,
        label: LANGUAGE_NATIVE_NAMES[code] ?? code,
    }));

    const sorted = base.sort((a, b) => a.label.localeCompare(b.label));

    return includeProviderDefault
        ? [{ value: "", label: t("providerDefault") }, ...sorted]
        : sorted;
};

export const toTagItems = (items: string[]): TagItem[] =>
    items.map((x) => ({ key: x, label: x }));


export const GladiaTranscriptionConfigForm: React.FC<{
    config: GladiaTranscriptionConfig;
    updateConfig: (val: GladiaTranscriptionConfig) => void;
}> = ({ config, updateConfig }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const languageOptions = useMemo(
        () => buildLanguageOptions(t, GLADIA_LANGUAGE_CODES, true),
        [t]
    );
    const languageOptionsNoDefault = useMemo(
        () => buildLanguageOptions(t, GLADIA_LANGUAGE_CODES, false),
        [t]
    );
    const translationLanguageOptions = useMemo(
        () => buildLanguageOptions(t, GLADIA_TRANSLATION_TARGET_LANGUAGE_CODES, false),
        [t]
    );

    const customVocabularyEnabled = useMemo(() => {
        if (Array.isArray(config?.custom_vocabulary)) {
            return config.custom_vocabulary.length > 0;
        }
        return config?.custom_vocabulary === true;
    }, [config?.custom_vocabulary]);

    const customVocabularyMode: "config" | "inline" = Array.isArray(
        config?.custom_vocabulary
    )
        ? "inline"
        : "config";

    const setCustomVocabularyEnabled = (enabled: boolean) => {
        if (!enabled) {
            updateConfig({
                ...config,
                custom_vocabulary: undefined,
                custom_vocabulary_config: undefined,
            });
            return;
        }

        if (customVocabularyMode === "inline") {
            updateConfig({
                ...config,
                custom_vocabulary: Array.isArray(config?.custom_vocabulary)
                    ? config.custom_vocabulary
                    : [],
            });
            return;
        }

        updateConfig({
            ...config,
            custom_vocabulary: true,
            custom_vocabulary_config:
                config.custom_vocabulary_config ?? { vocabulary: [] },
        });
    };

    const setCustomVocabularyMode = (mode: "config" | "inline") => {
        if (mode === customVocabularyMode) return;
        if (mode === "inline") {
            const baseList = config?.custom_vocabulary_config?.vocabulary ?? [];
            updateConfig({
                ...config,
                custom_vocabulary: baseList,
                custom_vocabulary_config: undefined,
            });
            return;
        }

        const inlineList = Array.isArray(config?.custom_vocabulary)
            ? config.custom_vocabulary
            : [];
        updateConfig({
            ...config,
            custom_vocabulary: true,
            custom_vocabulary_config: {
                ...(config.custom_vocabulary_config ?? { vocabulary: [] }),
                vocabulary: inlineList,
            },
        });
    };

    const structuredClasses = config?.structured_data_extraction_config?.classes ?? [];
    const audioToLlmPrompts = config?.audio_to_llm_config?.prompts ?? [];
    const translationTargets = config?.translation_config?.target_languages ?? [];
    const languageConfigLanguages = config?.language_config?.languages ?? [];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <GladiaCustomVocabularyCardForm
                config={config}
                updateConfig={updateConfig}
                customVocabularyEnabled={customVocabularyEnabled}
                customVocabularyMode={customVocabularyMode}
                setCustomVocabularyEnabled={setCustomVocabularyEnabled}
                setCustomVocabularyMode={setCustomVocabularyMode}
                languageOptions={languageOptions}
                parseOptionalNumber={parseOptionalNumber}
                VocabularyListEditor={VocabularyListEditor}
            />

            <GladiaSubtitlesCardForm
                config={config}
                updateConfig={updateConfig}
                parseOptionalNumber={parseOptionalNumber}
                parseOptionalInt={parseOptionalInt}
                normalizeList={normalizeList}
            />

            <GladiaDiarizationCardForm
                config={config}
                updateConfig={updateConfig}
                parseOptionalInt={parseOptionalInt}
            />

            <GladiaTranslationCardForm
                config={config}
                updateConfig={updateConfig}
                LanguageListEditor={LanguageListEditor}
                translationTargets={translationTargets}
                translationLanguageOptions={translationLanguageOptions}
            />

            <GladiaSummarizationCardForm config={config} updateConfig={updateConfig} />

            <GladiaAnalysisCardForm config={config} updateConfig={updateConfig} />

            <GladiaCustomSpellingCardForm
                config={config}
                updateConfig={updateConfig}
                normalizeList={normalizeList}
                normalizeListItem={normalizeListItem}
                CustomSpellingEditor={CustomSpellingEditor}
                StringListEditor={StringListEditor}
            />

            <GladiaStructuredDataExtractionCardForm
                config={config}
                updateConfig={updateConfig}
                StringListEditor={StringListEditor}
                structuredClasses={structuredClasses}
            />

            <GladiaAudioToLlmCardForm
                config={config}
                updateConfig={updateConfig}
                audioToLlmPrompts={audioToLlmPrompts}
            />

            <GladiaOutputCardForm config={config} updateConfig={updateConfig} />

            <GladiaLanguageConfigCardForm
                config={config}
                updateConfig={updateConfig}
                LanguageListEditor={LanguageListEditor}
                languageConfigLanguages={languageConfigLanguages}
                languageOptionsNoDefault={languageOptionsNoDefault}
            />
        </div>
    );
};
