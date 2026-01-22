import React, { useMemo } from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type { AssemblyAIRealtimeConfig } from "../types";
import { parseOptionalInt, parseOptionalNumber, normalizeList } from "../fields/shared";
import { StringListEditor } from "../fields/StringListEditor";

export const AssemblyAIRealtimeCardForm: React.FC<{
    config: AssemblyAIRealtimeConfig;
    updateConfig: (val: AssemblyAIRealtimeConfig) => void;
}> = ({ config, updateConfig }) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const encodingOptions = [
        { value: "", label: t("providerDefault") },
        { value: "pcm_s16le", label: "pcm_s16le" },
        { value: "pcm_mulaw", label: "pcm_mulaw" },
    ];

    const speechModelOptions = [
        { value: "", label: t("providerDefault") },
        { value: "universal-streaming-english", label: "universal-streaming-english" },
        { value: "universal-streaming-multilingual", label: "universal-streaming-multilingual" },
    ];

    const keyterms = useMemo(() => normalizeList(config?.keyterms_prompt), [config?.keyterms_prompt]);

    return (
        <theme.Card size="small" title={t("providers:assemblyai.realtime")} description={t("providers:assemblyai.realtimeHint")}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <theme.Input
                    id="assemblyai-realtime-sample-rate"
                    type="number"
                    min={8000}
                    step={1000}
                    label={t("providers:assemblyai.realtimeSampleRate")}
                    value={config?.sample_rate ?? ""}
                    onChange={(e: any) =>
                        updateConfig({
                            ...config,
                            sample_rate: parseOptionalInt(e?.target?.value),
                        })
                    }
                />

                <theme.Select
                    label={t("providers:assemblyai.realtimeEncoding")}
                    values={[config?.encoding ?? ""]}
                    valueTitle={encodingOptions.find((o) => o.value === (config?.encoding ?? ""))?.label ?? t("providerDefault")}
                    options={encodingOptions}
                    onChange={(val: string) => {
                        const raw = String(val ?? "").trim();
                        updateConfig({
                            ...config,
                            encoding: raw.length ? raw as any : undefined,
                        });
                    }}
                    style={{ minWidth: 220 }}
                >
                    {encodingOptions.map((o) => (
                        <option key={o.value || "__default"} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </theme.Select>

                <theme.Input
                    id="assemblyai-realtime-vad-threshold"
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    label={t("providers:assemblyai.realtimeVadThreshold")}
                    value={config?.vad_threshold ?? ""}
                    onChange={(e: any) =>
                        updateConfig({
                            ...config,
                            vad_threshold: parseOptionalNumber(e?.target?.value),
                        })
                    }
                />

                <theme.Input
                    id="assemblyai-realtime-end-of-turn-confidence-threshold"
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    label={t("providers:assemblyai.realtimeEndOfTurnConfidenceThreshold")}
                    value={config?.end_of_turn_confidence_threshold ?? ""}
                    onChange={(e: any) =>
                        updateConfig({
                            ...config,
                            end_of_turn_confidence_threshold: parseOptionalNumber(e?.target?.value),
                        })
                    }
                />

                <theme.Input
                    id="assemblyai-realtime-min-end-of-turn-silence"
                    label={t("providers:assemblyai.realtimeMinEndOfTurnSilence")}
                    placeholder="400ms"
                    value={config?.min_end_of_turn_silence_when_confident ?? ""}
                    onChange={(e: any) => {
                        const raw = String(e?.target?.value ?? "");
                        updateConfig({
                            ...config,
                            min_end_of_turn_silence_when_confident: raw.length ? raw : undefined,
                        });
                    }}
                />

                <theme.Input
                    id="assemblyai-realtime-max-turn-silence"
                    label={t("providers:assemblyai.realtimeMaxTurnSilence")}
                    placeholder="1280ms"
                    value={config?.max_turn_silence ?? ""}
                    onChange={(e: any) => {
                        const raw = String(e?.target?.value ?? "");
                        updateConfig({
                            ...config,
                            max_turn_silence: raw.length ? raw : undefined,
                        });
                    }}
                />

                <theme.Switch
                    id="assemblyai-realtime-format-turns"
                    label={t("providers:assemblyai.realtimeFormatTurns")}
                    checked={config?.format_turns ?? false}
                    onChange={(enabled) => updateConfig({ ...config, format_turns: !!enabled })}
                />

                <theme.Input
                    id="assemblyai-realtime-inactivity-timeout"
                    type="number"
                    min={5}
                    max={3600}
                    step={1}
                    label={t("providers:assemblyai.realtimeInactivityTimeout")}
                    value={config?.inactivity_timeout ?? ""}
                    onChange={(e: any) =>
                        updateConfig({
                            ...config,
                            inactivity_timeout: parseOptionalInt(e?.target?.value),
                        })
                    }
                />

                <theme.Switch
                    id="assemblyai-realtime-language-detection"
                    label={t("providers:assemblyai.realtimeLanguageDetection")}
                    checked={config?.language_detection ?? false}
                    onChange={(enabled) => updateConfig({ ...config, language_detection: !!enabled })}
                />

                <StringListEditor
                    idPrefix="assemblyai-realtime-keyterms"
                    label={t("providers:assemblyai.realtimeKeytermsPrompt")}
                    placeholder={t("providers:assemblyai.keytermsPromptPlaceholder")}
                    items={keyterms}
                    onChange={(next) =>
                        updateConfig({
                            ...config,
                            keyterms_prompt: next.length ? next : undefined,
                        })
                    }
                />
            </div>
        </theme.Card>
    );
};

