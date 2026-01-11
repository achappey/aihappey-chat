import React from "react";

import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

/**
 * IMPORTANT: keys must match backend JSON property names.
 * Mirrors `FireworksRerankingProviderMetadata`.
 */
export type FireworksRerankingConfig = {
    task?: string;
    return_documents?: boolean;
};

const FIREWORKS_TASK_PLACEHOLDER =
    "Given a web search query, retrieve relevant passages that answer the query";

export const FireworksRerankingConfigForm: React.FC<{
    config: FireworksRerankingConfig;
    updateConfig: (val: FireworksRerankingConfig) => void;
}> = ({ config, updateConfig }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <theme.Card size="small" title={t("general") ?? "General"}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <theme.TextArea
                        label={t("providers:fireworks.reranking.task")}
                        hint={t("providers:fireworks.reranking.taskHint")}
                        placeholder={
                            t("providers:fireworks.reranking.taskPlaceholder") ??
                            FIREWORKS_TASK_PLACEHOLDER
                        }
                        value={config?.task ?? ""}
                        rows={3}
                        onChange={(e) => {
                            const trimmed = e.trim();
                            updateConfig({
                                ...config,
                                task: trimmed.length ? e : undefined,
                            });
                        }}
                    />

                    <theme.Switch
                        id="fireworks-reranking-return-documents"
                        label={
                            t("providers:fireworks.reranking.returnDocuments")
                        }
                        checked={!!config?.return_documents}
                        onChange={(val: boolean) =>
                            updateConfig({
                                ...config,
                                return_documents: val,
                            })
                        }
                    />
                </div>
            </theme.Card>
        </div>
    );
};

