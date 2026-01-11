import React from "react";

import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

/**
 * IMPORTANT: keys must match backend JSON property names.
 * Mirrors `ContextualAIRerankingProviderMetadata`.
 */
export type ContextualAIRerankingConfig = {
    instruction?: string;
};

export const ContextualAIRerankingConfigForm: React.FC<{
    config: ContextualAIRerankingConfig;
    updateConfig: (val: ContextualAIRerankingConfig) => void;
}> = ({ config, updateConfig }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <theme.Card size="small" title={t("general") ?? "General"}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <theme.TextArea
                        label={
                            t("providers:contextualai.reranking.instruction") ?? "instruction"
                        }
                        placeholder={t("optional") ?? "optional"}
                        rows={4}
                        value={config?.instruction ?? ""}
                        onChange={(val: string) => {
                            const raw = String(val ?? "");
                            updateConfig({
                                ...config,
                                instruction: raw.length ? raw : undefined,
                            });
                        }}
                    />
                </div>
            </theme.Card>
        </div>
    );
};

