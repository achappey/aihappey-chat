import React from "react";

import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

/**
 * IMPORTANT: keys must match backend JSON property names.
 * Mirrors `CohereRerankingProviderMetadata`.
 */
export type CohereRerankingConfig = {
    max_tokens_per_doc?: number;
    priority?: number;
};

export const CohereRerankingConfigForm: React.FC<{
    config: CohereRerankingConfig;
    updateConfig: (val: CohereRerankingConfig) => void;
}> = ({ config, updateConfig }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const parseOptionalInt = (rawInput: any): number | undefined => {
        const raw = String(rawInput ?? "").trim();
        if (!raw.length) return undefined;
        const parsed = parseInt(raw, 10);
        return Number.isFinite(parsed) ? parsed : undefined;
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <theme.Card size="small" title={t("general") ?? "General"}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <theme.Input
                        type="number"
                        step={1}
                        label={t("providers:cohere.reranking.maxTokensPerDoc")}
                        placeholder={t("optional")}
                        value={config?.max_tokens_per_doc ?? ""}
                        onChange={(e: any) => {
                            updateConfig({
                                ...config,
                                max_tokens_per_doc: parseOptionalInt(e?.target?.value),
                            });
                        }}
                    />

                    <theme.Input
                        type="number"
                        step={1}
                        label={t("providers:cohere.reranking.priority")}
                        placeholder={t("optional")}
                        value={config?.priority ?? ""}
                        onChange={(e: any) => {
                            updateConfig({
                                ...config,
                                priority: parseOptionalInt(e?.target?.value),
                            });
                        }}
                    />
                </div>
            </theme.Card>
        </div>
    );
};

