import React, { useMemo, useState } from "react";

import type { RerankingResponse } from "aihappey-ai";
import type { MenuItemProps, Provider } from "aihappey-types";
import { useTranslation } from "aihappey-i18n";

import { useTheme } from "../theme/ThemeContext";
import { LimitedTextField } from "../fields";
import { ViewButton } from "../buttons";
import { RerankingModal } from "../modals/RerankingModal";
import { format } from "timeago.js";
import { CostBadge } from "../badges";
import { useDarkMode } from "usehooks-ts";

export type RerankingCardFile = {
    name: string;
    text: string;
};

export type RerankingCardProps = {
    query: string;
    files: RerankingCardFile[];
    reranking: RerankingResponse;
    onDelete?: () => void;
    providers?: Record<string, Provider>;
};

const getGatewayCost = (providerMetadata?: Record<string, any>) => {
    const cost = providerMetadata?.gateway?.cost;
    return typeof cost === "number" && Number.isFinite(cost) ? cost : undefined;
};

const getProvider = (
    providers: Record<string, Provider> | undefined,
    key: string | undefined
) => {
    if (!providers || !key) return undefined;

    return providers[key] ?? providers[key.toLocaleLowerCase()];
};

const getProviderKeyFromModelId = (modelId: string | undefined) => {
    if (!modelId?.includes("/")) return undefined;

    return modelId.split("/")[0]?.trim().toLocaleLowerCase();
};

const getProviderKeyFromMetadata = (
    providerMetadata: Record<string, any> | undefined,
    providers: Record<string, Provider> | undefined,
    modelId: string | undefined,
) => {
    if (providerMetadata && providers) {
        const metadataProviderKey = Object.keys(providerMetadata).find((key) => {
            const normalizedKey = key.trim().toLocaleLowerCase();
            return normalizedKey !== "gateway" && !!getProvider(providers, normalizedKey);
        });

        if (metadataProviderKey) return metadataProviderKey;
    }

    const modelProviderKey = getProviderKeyFromModelId(modelId);
    return getProvider(providers, modelProviderKey) ? modelProviderKey : undefined;
};

export const RerankingCard = ({ query, files, reranking, onDelete, providers }: RerankingCardProps) => {
    const { Card, Menu, Image } = useTheme();
    const { t, i18n } = useTranslation();
    const { isDarkMode } = useDarkMode();
    const [detailsOpen, setDetailsOpen] = useState(false);
    const providerMetadata = reranking.providerMetadata;
    const gatewayCost = getGatewayCost(providerMetadata);
    const modelId = reranking.response?.modelId;
    const providerKey = getProviderKeyFromMetadata(providerMetadata, providers, modelId);
    const provider = getProvider(providers, providerKey);
    const providerIcon = provider?.icons?.find((icon: any) => icon.theme === (isDarkMode ? "dark" : "light"))
        ?? provider?.icons?.[0];
    const providerImage = providerIcon?.src ? (
        <Image
            height={40}
            shape="square"
            src={providerIcon.src}
            title={provider?.name ?? providerKey}
        />
    ) : undefined;

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
            <Card title={modelId}
                description={<div style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "center" }}>
                        {format(reranking?.response?.timestamp, i18n.language)}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", transform: "translateY(2px)" }}>
                        <CostBadge cost={gatewayCost} size="small" />
                    </span>
                </div>}
                size="small"
                image={providerImage}
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

