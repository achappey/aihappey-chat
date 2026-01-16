import React from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import type { GladiaTranscriptionConfig } from "../GladiaTranscriptionConfigForm";

type OutputCardProps = {
    config: GladiaTranscriptionConfig;
    updateConfig: (val: GladiaTranscriptionConfig) => void;
};

export const GladiaOutputCardForm: React.FC<OutputCardProps> = ({
    config,
    updateConfig,
}) => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <theme.Card size="small" title={t("providers:gladia.output")}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <theme.Switch
                    id="gladia-sentences"
                    label={t("providers:gladia.sentences")}
                    checked={config?.sentences ?? false}
                    onChange={(enabled) => updateConfig({ ...config, sentences: enabled })}
                />
                <theme.Switch
                    id="gladia-display-mode"
                    label={t("providers:gladia.displayMode")}
                    checked={config?.display_mode ?? false}
                    onChange={(enabled) => updateConfig({ ...config, display_mode: enabled })}
                />
                <theme.Switch
                    id="gladia-punctuation-enhanced"
                    label={t("providers:gladia.punctuationEnhanced")}
                    checked={config?.punctuation_enhanced ?? false}
                    onChange={(enabled) =>
                        updateConfig({ ...config, punctuation_enhanced: enabled })
                    }
                />
            </div>
        </theme.Card>
    );
};
