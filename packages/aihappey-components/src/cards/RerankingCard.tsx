 import React, { useMemo, useState } from "react";

import type { RerankingResponse } from "aihappey-ai";
import type { MenuItemProps } from "aihappey-types";
import { useTranslation } from "aihappey-i18n";

 import { useTheme } from "../theme/ThemeContext";
 import { LimitedTextField } from "../fields";
 import { ViewButton } from "../buttons";
 import { RerankingModal } from "../modals/RerankingModal";

export type RerankingCardFile = {
    name: string;
    text: string;
};

export type RerankingCardProps = {
    query: string;
    files: RerankingCardFile[];
    reranking: RerankingResponse;
    onDelete?: () => void;
};

export const RerankingCard = ({ query, files, reranking, onDelete }: RerankingCardProps) => {
    const { Card, Menu } = useTheme();
    const { t } = useTranslation();
    const [detailsOpen, setDetailsOpen] = useState(false);

    const headerActions = useMemo(() => {
        if (!onDelete) return undefined;
        const menuItems: MenuItemProps[] = [
            {
                key: "delete",
                label: t("delete"),
                onClick: onDelete,
            },
        ];
        return <Menu items={menuItems} />;
    }, [Menu, onDelete, t]);

    const description = useMemo(() => {
        const model = reranking?.response?.modelId;
        const ts = reranking?.response?.timestamp;
        const tsLabel = ts ? new Date(ts as any).toLocaleString() : "";
        return [model, tsLabel].filter(Boolean).join(" · ");
    }, [reranking]);

    const ranked = useMemo(() => {
        const ranking = Array.isArray(reranking?.ranking) ? reranking.ranking : [];
        const scoreByIndex = new Map(ranking.map((r) => [r.index, r.relevanceScore] as const));
        // backend ranking is already in order, but ensure stable sort by score desc
        const rankedIndices = ranking
            .slice()
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .map((r) => r.index);

        const base = files.map((f, idx) => ({
            index: idx,
            file: f,
            score: scoreByIndex.get(idx),
        }));

        // put ranked items first, then unranked
        const order = new Map(rankedIndices.map((idx, i) => [idx, i] as const));
        return base.sort((a, b) => {
            const oa = order.get(a.index);
            const ob = order.get(b.index);
            if (oa == null && ob == null) return a.index - b.index;
            if (oa == null) return 1;
            if (ob == null) return -1;
            return oa - ob;
        });
    }, [files, reranking]);

    const actions = (
        <ViewButton
            size="small"
            variant="transparent"
            title={t("view")}
            onClick={() => setDetailsOpen(true)}
        />
    );

    return (
        <>
            <Card title={query}
                description={description}
                size="small"
                headerActions={headerActions}
                actions={actions}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {ranked.map(({ index, file, score }, i) => {
                        const scoreLabel = typeof score === "number" ? score.toFixed(4) : "";
                        const rankLabel = i + 1;

                        return (
                            <div key={`${file.name}-${index}`} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                                    <strong style={{ fontSize: 12 }}>{file.name}</strong>
                                    <span style={{ fontSize: 12, color: "#888" }}>
                                        {`Rank: ${rankLabel}`}
                                        {scoreLabel ? ` · Score: ${scoreLabel}` : ""}
                                    </span>
                                </div>
                                <LimitedTextField text={file.text} rows={4} />
                            </div>
                        );
                    })}
                </div>
            </Card>

            <RerankingModal
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                query={query}
                files={files}
                reranking={reranking}
            />
        </>
    );
};

