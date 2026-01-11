import React from "react";

import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

/**
 * IMPORTANT: keys must match backend JSON property names.
 * Mirrors `JinaRerankingProviderMetadata`.
 */
export type JinaRerankingConfig = {
    return_documents?: boolean;
    truncation?: boolean;
    max_doc_length?: number;
    return_embeddings?: boolean;
};

export const JinaRerankingConfigForm: React.FC<{
    config: JinaRerankingConfig;
    updateConfig: (val: JinaRerankingConfig) => void;
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
                    <theme.Switch
                        id="jina-reranking-return-documents"
                        label={
                            t("providers:jina.reranking.returnDocuments") ?? "return_documents"
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
                        id="jina-reranking-truncation"
                        label={t("providers:jina.reranking.truncation") ?? "truncation"}
                        checked={!!config?.truncation}
                        onChange={(val: boolean) =>
                            updateConfig({
                                ...config,
                                truncation: val,
                            })
                        }
                    />



                    <theme.Switch
                        id="jina-reranking-return-embeddings"
                        label={
                            t("providers:jina.reranking.returnEmbeddings") ?? "return_embeddings"
                        }
                        checked={!!config?.return_embeddings}
                        onChange={(val: boolean) =>
                            updateConfig({
                                ...config,
                                return_embeddings: val,
                            })
                        }
                    />

                    <theme.Input
                        id="jina-reranking-max-doc-length"
                        type="number"
                        step={1}
                        label={
                            t("providers:jina.reranking.maxDocLength") ?? "max_doc_length"
                        }
                        placeholder={t("optional") ?? "optional"}
                        value={config?.max_doc_length ?? ""}
                        onChange={(e: any) =>
                            updateConfig({
                                ...config,
                                max_doc_length: parseOptionalInt(e?.target?.value),
                            })
                        }
                    />
                </div>
            </theme.Card>
        </div>
    );
};

