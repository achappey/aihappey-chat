import React, { useMemo, useState } from "react";

import type { RerankingResponse } from "aihappey-ai";
import type { MenuItemProps } from "aihappey-types";
import { useTranslation } from "aihappey-i18n";

import { useTheme } from "../theme/ThemeContext";
import { LimitedTextField } from "../fields";
import { ViewButton } from "../buttons";
import { RerankingModal } from "../modals/RerankingModal";
import { format } from "timeago.js";

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
            <Card title={reranking.response?.modelId}
                description={<>{format(reranking?.response?.timestamp)}</>}
                size="small"
                headerActions={headerActions}
                actions={actions}>
                <LimitedTextField text={query} rows={4} />
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

