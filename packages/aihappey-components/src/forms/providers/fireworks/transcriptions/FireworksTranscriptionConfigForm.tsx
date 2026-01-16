import React from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import { TimestampGranularitiesForm } from "../../../settings/transcriptions/TimestampGranularitiesForm";
import { FireworksTranscriptionGeneralCard, FireworksTranscriptionAudioProcessingCard, FireworksTranscriptionDiarizationCard } from "./cards";

export type FireworksTranscriptionConfig = {
    language?: string;
    prompt?: string;

    /**
     * Controls sampling randomness for transcription.
     * When undefined, provider default is used.
     */
    temperature?: number;

    /**
     * Timestamp granularities to populate.
     * Fireworks requires response_format=verbose_json for these to have effect.
     * When undefined, provider default is used.
     */
    timestamp_granularities?: Array<"word" | "segment">;

    /** Voice activity detection model. */
    vad_model?: "silero" | "whisperx-pyannet";

    /** Alignment model. */
    alignment_model?: "mms_fa" | "tdnn_ffn";

    /** Enable speaker diarization. */
    diarize?: boolean;
    min_speakers?: number;
    max_speakers?: number;

    /** Audio preprocessing mode. */
    preprocessing?: "none" | "dynamic" | "soft_dynamic" | "bass_dynamic";
};

export const FireworksTranscriptionConfigForm: React.FC<{
    config: FireworksTranscriptionConfig;
    updateConfig: (val: FireworksTranscriptionConfig) => void;
}> = ({ config, updateConfig }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const diarizeEnabled = config?.diarize === true;
    const timestampGranularitiesEnabled = config?.timestamp_granularities != null;

    const normalizeGranularities = (val: unknown): Array<"segment" | "word"> => {
        const raw = Array.isArray(val) ? val : [];
        const set = new Set<"segment" | "word">();
        for (const v of raw) {
            if (v === "segment" || v === "word") set.add(v);
        }
        // keep a stable order in UI + persisted config
        const ordered: Array<"segment" | "word"> = [];
        if (set.has("segment")) ordered.push("segment");
        if (set.has("word")) ordered.push("word");
        return ordered;
    };

    const ensureWordGranularity = (val: unknown): Array<"segment" | "word"> => {
        const normalized = normalizeGranularities(val);
        if (!normalized.includes("word")) normalized.push("word");
        return normalizeGranularities(normalized);
    };

    const effectiveGranularities: Array<"segment" | "word"> = (() => {
        if (!timestampGranularitiesEnabled && !diarizeEnabled) return [];

        const normalized = timestampGranularitiesEnabled
            ? normalizeGranularities(config?.timestamp_granularities)
            : [];

        const withDefault: Array<"segment" | "word"> = normalized.length
            ? normalized
            : (["segment"] as Array<"segment" | "word">);
        return diarizeEnabled ? ensureWordGranularity(withDefault) : withDefault;
    })();

    const toggleGranularity = (g: "segment" | "word", enabled: boolean) => {
        if (diarizeEnabled && g === "word" && !enabled) {
            // Fireworks diarization requires word-level timestamps.
            return;
        }

        const current = normalizeGranularities(config?.timestamp_granularities);
        const next = enabled
            ? normalizeGranularities([...current, g])
            : normalizeGranularities(current.filter((x) => x !== g));

        // enforce at least one selection when custom is enabled
        const nonEmpty = next.length ? next : ["segment"];
        const enforced = diarizeEnabled ? ensureWordGranularity(nonEmpty) : nonEmpty;

        updateConfig({
            ...config,
            timestamp_granularities: enforced as Array<"segment" | "word">,
        });
    };

    const setDiarize = (enabled: boolean) => {
        if (enabled) {
            const base = timestampGranularitiesEnabled
                ? normalizeGranularities(config?.timestamp_granularities)
                : (["segment"] as Array<"segment" | "word">);
            const ensured = ensureWordGranularity(base.length ? base : ["segment"]);

            updateConfig({
                ...config,
                diarize: true,
                timestamp_granularities: ensured as Array<"segment" | "word">,
            });
            return;
        }

        updateConfig({
            ...config,
            diarize: undefined,
            min_speakers: undefined,
            max_speakers: undefined,
        });
    };

    const vadModelOptions = [
        { value: "", label: t("providerDefault") },
        { value: "silero", label: "silero" },
        { value: "whisperx-pyannet", label: "whisperx-pyannet" },
    ];

    const alignmentModelOptions = [
        { value: "", label: t("providerDefault") },
        { value: "mms_fa", label: "mms_fa" },
        { value: "tdnn_ffn", label: "tdnn_ffn" },
    ];

    const preprocessingOptions = [
        { value: "", label: t("providerDefault") },
        { value: "none", label: "none" },
        { value: "dynamic", label: "dynamic" },
        { value: "soft_dynamic", label: "soft_dynamic" },
        { value: "bass_dynamic", label: "bass_dynamic" },
    ];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <FireworksTranscriptionGeneralCard config={config} updateConfig={updateConfig} />

            <TimestampGranularitiesForm
                idPrefix="fireworks-transcription-timestamp"
                // Fireworks keeps diarization/timestamp enforcement outside; this component is UI-only here.
                value={config?.timestamp_granularities}
                enabled={timestampGranularitiesEnabled || diarizeEnabled}
                selected={effectiveGranularities}
                disableEnableToggle={diarizeEnabled}
                disableSegmentToggle={!(timestampGranularitiesEnabled || diarizeEnabled)}
                disableWordToggle={!(timestampGranularitiesEnabled || diarizeEnabled) || diarizeEnabled}
                onChange={(timestamp_granularities) =>
                    updateConfig({
                        ...config,
                        timestamp_granularities,
                    })
                }
                onToggleEnabled={(enabled) => {
                    if (diarizeEnabled) return;
                    updateConfig({
                        ...config,
                        timestamp_granularities: enabled
                            ? ((normalizeGranularities(config?.timestamp_granularities).length
                                ? normalizeGranularities(config?.timestamp_granularities)
                                : ["segment"]) as Array<"segment" | "word">)
                            : undefined,
                    });
                }}
                onToggleGranularity={(g, enabled) => toggleGranularity(g, enabled)}
            />

            <FireworksTranscriptionAudioProcessingCard config={config} updateConfig={updateConfig} />

            <FireworksTranscriptionDiarizationCard
                config={config}
                updateConfig={updateConfig}
                diarizeEnabled={diarizeEnabled}
                setDiarize={setDiarize}
            />
        </div>
    );
};

