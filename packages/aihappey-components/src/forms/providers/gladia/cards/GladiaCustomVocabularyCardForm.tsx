import React from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type {
    GladiaTranscriptionConfig,
    GladiaVocabularyItem,
} from "../GladiaTranscriptionConfigForm";

type VocabularyListEditorProps = {
    items: GladiaVocabularyItem[];
    onChange: (next: GladiaVocabularyItem[]) => void;
    languageOptions: { value: string; label: string }[];
    idPrefix: string;
};

type CustomVocabularyCardProps = {
    config: GladiaTranscriptionConfig;
    updateConfig: (val: GladiaTranscriptionConfig) => void;
    customVocabularyEnabled: boolean;
    customVocabularyMode: "config" | "inline";
    setCustomVocabularyEnabled: (enabled: boolean) => void;
    setCustomVocabularyMode: (mode: "config" | "inline") => void;
    languageOptions: { value: string; label: string }[];
    parseOptionalNumber: (rawInput: any) => number | undefined;
    VocabularyListEditor: React.FC<VocabularyListEditorProps>;
};

export const GladiaCustomVocabularyCardForm: React.FC<CustomVocabularyCardProps> = ({
    config,
    updateConfig,
    customVocabularyEnabled,
    customVocabularyMode,
    setCustomVocabularyEnabled,
    setCustomVocabularyMode,
    languageOptions,
    parseOptionalNumber,
    VocabularyListEditor,
}) => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <theme.Card
            size="small"
            title={t("providers:gladia.customVocabulary")}
            headerActions={
                <theme.Switch
                    id="gladia-custom-vocabulary"
                    checked={customVocabularyEnabled}
                    onChange={setCustomVocabularyEnabled}
                />
            }
        >
            {customVocabularyEnabled ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <theme.Select
                        label={t("providers:gladia.customVocabularyMode")}
                        values={[customVocabularyMode]}
                        valueTitle={
                            customVocabularyMode === "inline"
                                ? t("providers:gladia.customVocabularyModeInline")
                                : t("providers:gladia.customVocabularyModeConfig")
                        }
                        options={[
                            {
                                value: "config",
                                label: t("providers:gladia.customVocabularyModeConfig"),
                            },
                            {
                                value: "inline",
                                label: t("providers:gladia.customVocabularyModeInline"),
                            },
                        ]}
                        onChange={(val: string) =>
                            setCustomVocabularyMode(val as "config" | "inline")
                        }
                    >
                        <option value="config">
                            {t("providers:gladia.customVocabularyModeConfig")}
                        </option>
                        <option value="inline">
                            {t("providers:gladia.customVocabularyModeInline")}
                        </option>
                    </theme.Select>

                    {customVocabularyMode === "config" && (
                        <>
                            <theme.Input
                                id="gladia-custom-vocabulary-default-intensity"
                                label={t("providers:gladia.customVocabularyDefaultIntensity")}
                                type="number"
                                min={0}
                                max={1}
                                step={0.1}
                                value={
                                    config?.custom_vocabulary_config?.default_intensity ?? ""
                                }
                                onChange={(e: any) =>
                                    updateConfig({
                                        ...config,
                                        custom_vocabulary_config: {
                                            ...(config.custom_vocabulary_config ?? {
                                                vocabulary: [],
                                            }),
                                            default_intensity: parseOptionalNumber(
                                                e?.target?.value
                                            ),
                                        },
                                    })
                                }
                            />

                            <VocabularyListEditor
                                idPrefix="gladia-custom-vocabulary-config"
                                items={config?.custom_vocabulary_config?.vocabulary ?? []}
                                onChange={(vocabulary) =>
                                    updateConfig({
                                        ...config,
                                        custom_vocabulary_config: {
                                            ...(config.custom_vocabulary_config ?? {
                                                vocabulary: [],
                                            }),
                                            vocabulary,
                                        },
                                    })
                                }
                                languageOptions={languageOptions}
                            />
                        </>
                    )}

                    {customVocabularyMode === "inline" && (
                        <VocabularyListEditor
                            idPrefix="gladia-custom-vocabulary-inline"
                            items={
                                Array.isArray(config?.custom_vocabulary)
                                    ? config.custom_vocabulary
                                    : []
                            }
                            onChange={(vocabulary) =>
                                updateConfig({
                                    ...config,
                                    custom_vocabulary: vocabulary,
                                })
                            }
                            languageOptions={languageOptions}
                        />
                    )}
                </div>
            ) : (
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {t("providers:gladia.customVocabularyHint")}
                </div>
            )}
        </theme.Card>
    );
};
