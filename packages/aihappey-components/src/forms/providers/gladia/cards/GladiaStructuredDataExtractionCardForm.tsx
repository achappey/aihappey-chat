import React from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type { GladiaTranscriptionConfig } from "../GladiaTranscriptionConfigForm";

type StringListEditorProps = {
    label: string;
    placeholder?: string;
    items: string[];
    onChange: (next: string[]) => void;
    addLabel?: string;
    idPrefix: string;
};

type StructuredDataExtractionCardProps = {
    config: GladiaTranscriptionConfig;
    updateConfig: (val: GladiaTranscriptionConfig) => void;
    StringListEditor: React.FC<StringListEditorProps>;
    structuredClasses: string[];
};

export const GladiaStructuredDataExtractionCardForm: React.FC<
    StructuredDataExtractionCardProps
> = ({ config, updateConfig, StringListEditor, structuredClasses }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <theme.Card
            size="small"
            title={t("providers:gladia.structuredDataExtraction")}
            headerActions={
                <theme.Switch
                    id="gladia-structured-data"
                    checked={config?.structured_data_extraction ?? false}
                    onChange={(enabled) =>
                        updateConfig({
                            ...config,
                            structured_data_extraction: enabled,
                            structured_data_extraction_config: enabled
                                ? config?.structured_data_extraction_config ?? { classes: [] }
                                : undefined,
                        })
                    }
                />
            }
        >
            {config?.structured_data_extraction ? (
                <StringListEditor
                    idPrefix="gladia-structured-classes"
                    label={t("providers:gladia.structuredDataClasses")}
                    placeholder={t("providers:gladia.structuredDataClassesPlaceholder")}
                    items={structuredClasses}
                    onChange={(classes) =>
                        updateConfig({
                            ...config,
                            structured_data_extraction_config: {
                                ...(config?.structured_data_extraction_config ?? {
                                    classes: [],
                                }),
                                classes,
                            },
                        })
                    }
                />
            ) : (
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {t("providers:gladia.structuredDataHint")}
                </div>
            )}
        </theme.Card>
    );
};
