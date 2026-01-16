import React from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type { GladiaTranscriptionConfig } from "../GladiaTranscriptionConfigForm";

type LanguageListEditorProps = {
    label: string;
    items: string[];
    onChange: (next: string[]) => void;
    idPrefix: string;
    options: { value: string; label: string }[];
};

type TranslationCardProps = {
    config: GladiaTranscriptionConfig;
    updateConfig: (val: GladiaTranscriptionConfig) => void;
    LanguageListEditor: React.FC<LanguageListEditorProps>;
    translationTargets: string[];
    translationLanguageOptions: { value: string; label: string }[];
};

export const GladiaTranslationCardForm: React.FC<TranslationCardProps> = ({
    config,
    updateConfig,
    LanguageListEditor,
    translationTargets,
    translationLanguageOptions,
}) => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <theme.Card
            size="small"
            title={t("providers:gladia.translation")}
            headerActions={
                <theme.Switch
                    id="gladia-translation"
                    checked={config?.translation ?? false}
                    onChange={(enabled) =>
                        updateConfig({
                            ...config,
                            translation: enabled,
                            translation_config: enabled
                                ? config?.translation_config ?? { target_languages: [] }
                                : undefined,
                        })
                    }
                />
            }
        >
            {config?.translation ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <LanguageListEditor
                        idPrefix="gladia-translation-targets"
                        label={t("providers:gladia.translationTargetLanguages")}
                        items={translationTargets}
                        options={translationLanguageOptions}
                        onChange={(target_languages) =>
                            updateConfig({
                                ...config,
                                translation_config: {
                                    ...(config?.translation_config ?? {
                                        target_languages: [],
                                    }),
                                    target_languages,
                                },
                            })
                        }
                    />

                    <theme.Select
                        label={t("providers:gladia.translationModel")}
                        values={[config?.translation_config?.model ?? "base"]}
                        valueTitle={t(
                            `providers:gladia.translationModel.${
                                config?.translation_config?.model ?? "base"
                            }`
                        )}
                        options={[
                            {
                                value: "base",
                                label: t("providers:gladia.translationModel.base"),
                            },
                            {
                                value: "enhanced",
                                label: t("providers:gladia.translationModel.enhanced"),
                            },
                        ]}
                        onChange={(val: string) =>
                            updateConfig({
                                ...config,
                                translation_config: {
                                    ...(config?.translation_config ?? {
                                        target_languages: [],
                                    }),
                                    model: val as "base" | "enhanced",
                                },
                            })
                        }
                    >
                        <option value="base">
                            {t("providers:gladia.translationModel.base")}
                        </option>
                        <option value="enhanced">
                            {t("providers:gladia.translationModel.enhanced")}
                        </option>
                    </theme.Select>

                    <theme.Switch
                        id="gladia-translation-match-original"
                        label={t("providers:gladia.translationMatchOriginalUtterances")}
                        checked={
                            config?.translation_config?.match_original_utterances ?? true
                        }
                        onChange={(enabled) =>
                            updateConfig({
                                ...config,
                                translation_config: {
                                    ...(config?.translation_config ?? {
                                        target_languages: [],
                                    }),
                                    match_original_utterances: enabled,
                                },
                            })
                        }
                    />

                    <theme.Switch
                        id="gladia-translation-lipsync"
                        label={t("providers:gladia.translationLipsync")}
                        checked={config?.translation_config?.lipsync ?? true}
                        onChange={(enabled) =>
                            updateConfig({
                                ...config,
                                translation_config: {
                                    ...(config?.translation_config ?? {
                                        target_languages: [],
                                    }),
                                    lipsync: enabled,
                                },
                            })
                        }
                    />

                    <theme.Switch
                        id="gladia-translation-context-adaptation"
                        label={t("providers:gladia.translationContextAdaptation")}
                        checked={config?.translation_config?.context_adaptation ?? true}
                        onChange={(enabled) =>
                            updateConfig({
                                ...config,
                                translation_config: {
                                    ...(config?.translation_config ?? {
                                        target_languages: [],
                                    }),
                                    context_adaptation: enabled,
                                },
                            })
                        }
                    />

                    <theme.TextArea
                        label={t("providers:gladia.translationContext")}
                        placeholder={t("providers:gladia.translationContextPlaceholder")}
                        rows={3}
                        value={config?.translation_config?.context ?? ""}
                        onChange={(value) =>
                            updateConfig({
                                ...config,
                                translation_config: {
                                    ...(config?.translation_config ?? {
                                        target_languages: [],
                                    }),
                                    context: String(value ?? ""),
                                },
                            })
                        }
                    />

                    <theme.Switch
                        id="gladia-translation-informal"
                        label={t("providers:gladia.translationInformal")}
                        checked={config?.translation_config?.informal ?? false}
                        onChange={(enabled) =>
                            updateConfig({
                                ...config,
                                translation_config: {
                                    ...(config?.translation_config ?? {
                                        target_languages: [],
                                    }),
                                    informal: enabled,
                                },
                            })
                        }
                    />
                </div>
            ) : (
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {t("providers:gladia.translationHint")}
                </div>
            )}
        </theme.Card>
    );
};
