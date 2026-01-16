import React from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type { GladiaTranscriptionConfig } from "../GladiaTranscriptionConfigForm";

type AudioToLlmCardProps = {
    config: GladiaTranscriptionConfig;
    updateConfig: (val: GladiaTranscriptionConfig) => void;
    audioToLlmPrompts: string[];
};

export const GladiaAudioToLlmCardForm: React.FC<AudioToLlmCardProps> = ({
    config,
    updateConfig,
    audioToLlmPrompts,
}) => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <theme.Card
            size="small"
            title={t("providers:gladia.audioToLlm")}
            headerActions={
                <theme.Switch
                    id="gladia-audio-to-llm"
                    checked={config?.audio_to_llm ?? false}
                    onChange={(enabled) =>
                        updateConfig({
                            ...config,
                            audio_to_llm: enabled,
                            audio_to_llm_config: enabled
                                ? config?.audio_to_llm_config ?? { prompts: [] }
                                : undefined,
                        })
                    }
                />
            }
        >
            {config?.audio_to_llm ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <strong>{t("providers:gladia.audioToLlmPrompts")}</strong>
                        <theme.Button
                            icon="add"
                            size="small"
                            title={t("providers:gladia.audioToLlmAddPrompt")}
                            variant="informative"
                            onClick={() =>
                                updateConfig({
                                    ...config,
                                    audio_to_llm_config: {
                                        ...(config?.audio_to_llm_config ?? { prompts: [] }),
                                        prompts: [...audioToLlmPrompts, ""],
                                    },
                                })
                            }
                        />
                    </div>
                    {audioToLlmPrompts.length === 0 && (
                        <div style={{ fontSize: 12, opacity: 0.7 }}>
                            {t("providers:gladia.audioToLlmEmpty")}
                        </div>
                    )}
                    {audioToLlmPrompts.map((prompt, index) => (
                        <div
                            key={`${prompt}-${index}`}
                            style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
                        >
                            <theme.TextArea
                                label={t("providers:gladia.audioToLlmPromptLabel", {
                                    index: index + 1,
                                })}
                                rows={3}
                                value={prompt}
                                onChange={(value) => {
                                    const next = audioToLlmPrompts.map((p, i) =>
                                        i === index ? String(value ?? "") : p
                                    );
                                    updateConfig({
                                        ...config,
                                        audio_to_llm_config: {
                                            ...(config?.audio_to_llm_config ?? { prompts: [] }),
                                            prompts: next,
                                        },
                                    });
                                }}
                            />
                            <theme.Button
                                icon="delete"
                                size="small"
                                title={t("delete")}
                                variant="danger"
                                onClick={() => {
                                    const next = audioToLlmPrompts.filter((_, i) => i !== index);
                                    updateConfig({
                                        ...config,
                                        audio_to_llm_config: {
                                            ...(config?.audio_to_llm_config ?? { prompts: [] }),
                                            prompts: next,
                                        },
                                    });
                                }}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {t("providers:gladia.audioToLlmHint")}
                </div>
            )}
        </theme.Card>
    );
};
