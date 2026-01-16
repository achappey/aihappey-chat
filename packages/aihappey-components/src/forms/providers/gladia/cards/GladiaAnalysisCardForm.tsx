import React from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type { GladiaTranscriptionConfig } from "../GladiaTranscriptionConfigForm";

type AnalysisCardProps = {
    config: GladiaTranscriptionConfig;
    updateConfig: (val: GladiaTranscriptionConfig) => void;
};

export const GladiaAnalysisCardForm: React.FC<AnalysisCardProps> = ({
    config,
    updateConfig,
}) => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <theme.Card size="small" title={t("providers:gladia.analysis")}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <theme.Switch
                    id="gladia-moderation"
                    label={t("providers:gladia.moderation")}
                    checked={config?.moderation ?? false}
                    onChange={(enabled) => updateConfig({ ...config, moderation: enabled })}
                />
                <theme.Switch
                    id="gladia-ner"
                    label={t("providers:gladia.namedEntityRecognition")}
                    checked={config?.named_entity_recognition ?? false}
                    onChange={(enabled) =>
                        updateConfig({
                            ...config,
                            named_entity_recognition: enabled,
                        })
                    }
                />
                <theme.Switch
                    id="gladia-chapterization"
                    label={t("providers:gladia.chapterization")}
                    checked={config?.chapterization ?? false}
                    onChange={(enabled) => updateConfig({ ...config, chapterization: enabled })}
                />
                <theme.Switch
                    id="gladia-name-consistency"
                    label={t("providers:gladia.nameConsistency")}
                    checked={config?.name_consistency ?? false}
                    onChange={(enabled) =>
                        updateConfig({ ...config, name_consistency: enabled })
                    }
                />
                <theme.Switch
                    id="gladia-sentiment"
                    label={t("providers:gladia.sentimentAnalysis")}
                    checked={config?.sentiment_analysis ?? false}
                    onChange={(enabled) =>
                        updateConfig({ ...config, sentiment_analysis: enabled })
                    }
                />
            </div>
        </theme.Card>
    );
};
