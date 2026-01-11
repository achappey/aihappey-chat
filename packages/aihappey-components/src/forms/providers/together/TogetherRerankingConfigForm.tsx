import React, { useMemo, useState } from "react";

import { useTheme } from "../../../theme/ThemeContext";
import { TagItem } from "aihappey-types";
import { useTranslation } from "aihappey-i18n";

/**
 * IMPORTANT: keys must match backend JSON property names.
 * Mirrors `TogetherRerankingProviderMetadata`.
 */
export type TogetherRerankingConfig = {
    return_documents?: boolean;
    rank_fields?: string[];
};

export const TogetherRerankingConfigForm: React.FC<{
    config: TogetherRerankingConfig;
    updateConfig: (val: TogetherRerankingConfig) => void;
}> = ({ config, updateConfig }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const [newRankField, setNewRankField] = useState<string>("");

    const rankFields: string[] = Array.isArray(config?.rank_fields)
        ? (config.rank_fields as string[])
        : [];

    const items: TagItem[] = useMemo(
        () => rankFields.map((f) => ({ key: f, label: f })),
        [rankFields]
    );

    const addRankField = (field: string) => {
        const normalized = String(field ?? "").trim();
        if (!normalized.length) return;

        const next = Array.from(new Set([...(rankFields ?? []), normalized]));
        updateConfig({
            ...config,
            rank_fields: next.length ? next : undefined,
        });
    };

    const removeRankField = (key: string) => {
        const next = rankFields.filter((f) => f !== key);
        updateConfig({
            ...config,
            rank_fields: next.length ? next : undefined,
        });
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <theme.Card size="small" title={t("general") ?? "General"}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <theme.Switch
                        id="together-reranking-return-documents"
                        label={
                            t("providers:together.reranking.returnDocuments") ?? "return_documents"
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

            <theme.Card
                size="small"
                title={t("providers:together.reranking.rankFields") ?? "rank_fields"}
            >
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div>
                        <theme.Input
                            value={newRankField}
                            label={t("providers:together.reranking.rankFields") ?? "rank_fields"}
                            placeholder={
                                t("providers:together.reranking.addRankField") ?? "Add rank field"
                            }
                            onChange={(e: any) => setNewRankField(e?.target?.value ?? "")}
                        />
                        <theme.Button
                            icon="add"
                            size="small"
                            title={t("add") ?? "Add"}
                            variant="informative"
                            disabled={!newRankField}
                            onClick={() => {
                                addRankField(newRankField);
                                setNewRankField("");
                            }}
                        />
                    </div>

                    {items.length > 0 && (
                        <theme.Tags size="small" items={items} onRemove={removeRankField} />
                    )}
                </div>
            </theme.Card>
        </div>
    );
};

