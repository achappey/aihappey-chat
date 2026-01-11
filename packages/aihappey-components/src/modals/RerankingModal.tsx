import React, { useEffect, useMemo, useState } from "react";
import type { RerankingResponse } from "aihappey-ai";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";

export type RerankingModalFile = {
    name: string;
};

export type RerankingModalProps = {
    open: boolean;
    onClose: () => void;

    query: string;
    files: RerankingModalFile[];
    reranking: RerankingResponse;

    size?: "small" | "medium" | "large";
};

export const RerankingModal: React.FC<RerankingModalProps> = ({
    open,
    onClose,
    query,
    files,
    reranking,
    size = "large",
}) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const defaultTab = "general";
    const [activeTab, setActiveTab] = useState<string>(defaultTab);

    useEffect(() => {
        if (!open) return;
        setActiveTab(defaultTab);
    }, [open]);

    const documentRows = useMemo(() => {
        const ranking = Array.isArray(reranking?.ranking) ? reranking.ranking : [];
        const byIndex = new Map(ranking.map((r) => [r.index, r.relevanceScore] as const));

        // Use score-desc ranking (matches card); ensure stable ordering via original index.
        const rankedIndices = ranking
            .slice()
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .map((r) => r.index);

        const order = new Map(rankedIndices.map((idx, i) => [idx, i] as const));

        return files
            .map((f, idx) => {
                const rankOrder = order.get(idx);
                const rank = typeof rankOrder === "number" ? rankOrder + 1 : undefined;
                const score = byIndex.get(idx);
                return {
                    index: idx,
                    name: f.name,
                    rank,
                    score,
                };
            })
            .sort((a, b) => {
                // ranked first by rank asc, then unranked by original index
                if (a.rank == null && b.rank == null) return a.index - b.index;
                if (a.rank == null) return 1;
                if (b.rank == null) return -1;
                return a.rank - b.rank;
            });
    }, [files, reranking]);

    return (
        <theme.Modal
            show={open}
            size={size}
            onHide={onClose}
            title={t("rerank")}
            actions={
                <div style={{ display: "flex", gap: 8 }}>
                    <theme.Button variant="secondary" onClick={onClose}>
                        {t("close")}
                    </theme.Button>
                </div>
            }
        >
            <theme.Tabs activeKey={activeTab} onSelect={setActiveTab}>
                <theme.Tab eventKey="general" title={t("input")}>
                    <div>
                        {query}
                    </div>
                </theme.Tab>

                <theme.Tab eventKey="documents" title={t("result")}>
                    <div style={{ paddingTop: 12 }}>
                        <div
                            style={{
                                border: "1px solid rgba(0,0,0,0.1)",
                                borderRadius: 8,
                                overflow: "hidden",
                            }}
                        >
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ background: "rgba(0,0,0,0.03)" }}>
                                        <th style={{ textAlign: "left", padding: 10, fontSize: 12, width: 70 }}>Rank</th>
                                        <th style={{ textAlign: "left", padding: 10, fontSize: 12 }}>Document</th>
                                        <th style={{ textAlign: "right", padding: 10, fontSize: 12, width: 140 }}>
                                            Score
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {documentRows.map((r) => {
                                        const scoreLabel = typeof r.score === "number" ? r.score.toFixed(4) : "";
                                        return (
                                            <tr key={`${r.name}-${r.index}`} style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
                                                <td style={{ padding: 10, fontSize: 12, opacity: r.rank ? 1 : 0.6 }}>
                                                    {r.rank ?? "—"}
                                                </td>
                                                <td style={{ padding: 10, fontSize: 12, wordBreak: "break-word" }}>{r.name}</td>
                                                <td style={{ padding: 10, fontSize: 12, textAlign: "right", opacity: scoreLabel ? 1 : 0.6 }}>
                                                    {scoreLabel || "—"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </theme.Tab>

                <theme.Tab eventKey="raw" title={t("output")}>
                    <theme.JsonViewer value={reranking} />
                </theme.Tab>
            </theme.Tabs>
        </theme.Modal>
    );
};

