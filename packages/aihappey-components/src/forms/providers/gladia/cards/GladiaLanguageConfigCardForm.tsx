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

type LanguageConfigCardProps = {
    config: GladiaTranscriptionConfig;
    updateConfig: (val: GladiaTranscriptionConfig) => void;
    LanguageListEditor: React.FC<LanguageListEditorProps>;
    languageConfigLanguages: string[];
    languageOptionsNoDefault: { value: string; label: string }[];
};

export const GladiaLanguageConfigCardForm: React.FC<LanguageConfigCardProps> = ({
    config,
    updateConfig,
    LanguageListEditor,
    languageConfigLanguages,
    languageOptionsNoDefault,
}) => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <theme.Card
            size="small"
            title={t("providers:gladia.languageConfig")}
            headerActions={
                <theme.Switch
                    id="gladia-language-config"
                    checked={config?.language_config != null}
                    onChange={(enabled) =>
                        updateConfig({
                            ...config,
                            language_config: enabled
                                ? config?.language_config ?? {
                                      languages: [],
                                      code_switching: false,
                                  }
                                : undefined,
                        })
                    }
                />
            }
        >
            {config?.language_config ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <LanguageListEditor
                        idPrefix="gladia-language-config-languages"
                        label={t("providers:gladia.languageConfigLanguages")}
                        items={languageConfigLanguages}
                        options={languageOptionsNoDefault}
                        onChange={(languages) =>
                            updateConfig({
                                ...config,
                                language_config: {
                                    ...(config?.language_config ?? {}),
                                    languages,
                                },
                            })
                        }
                    />
                    <theme.Switch
                        id="gladia-language-config-code-switching"
                        label={t("providers:gladia.languageConfigCodeSwitching")}
                        checked={config?.language_config?.code_switching ?? false}
                        onChange={(enabled) =>
                            updateConfig({
                                ...config,
                                language_config: {
                                    ...(config?.language_config ?? {}),
                                    code_switching: enabled,
                                },
                            })
                        }
                    />
                </div>
            ) : (
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {t("providers:gladia.languageConfigHint")}
                </div>
            )}
        </theme.Card>
    );
};
