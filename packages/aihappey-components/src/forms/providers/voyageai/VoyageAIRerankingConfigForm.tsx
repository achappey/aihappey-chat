import React from "react";

import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

/**
 * IMPORTANT: keys must match backend JSON property names.
 * Mirrors `VoyageAIRerankingProviderMetadata`.
 */
export type VoyageAIRerankingConfig = {
    return_documents?: boolean;
    truncation?: boolean;
};

export const VoyageAIRerankingConfigForm: React.FC<{
    config: VoyageAIRerankingConfig;
    updateConfig: (val: VoyageAIRerankingConfig) => void;
}> = ({ config, updateConfig }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <theme.Card size="small" title={t("general") ?? "General"}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <theme.Switch
                        id="voyageai-reranking-return-documents"
                        label={
                            t("providers:voyageai.reranking.returnDocuments") ?? "return_documents"
                        }
                        checked={!!config?.return_documents}
                        onChange={(val: boolean) =>
                            updateConfig({
                                ...config,
                                return_documents: val,
                            })
                        }
                    />

                    <theme.Switch
                        id="voyageai-reranking-truncation"
                        label={t("providers:voyageai.reranking.truncation") ?? "truncation"}
                        checked={!!config?.truncation}
                        onChange={(val: boolean) =>
                            updateConfig({
                                ...config,
                                truncation: val,
                            })
                        }
                    />
                </div>
            </theme.Card>
        </div>
    );
};

