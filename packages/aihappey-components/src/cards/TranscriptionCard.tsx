import { useTheme } from "../theme/ThemeContext";
import { TranscriptionResponse } from "aihappey-ai";
import { LimitedTextField } from "../fields";
import React, { useState } from "react";
import { ViewButton } from "../buttons";
import { TranscriptionDetailsModal } from "../modals";
import { useTranslation } from "aihappey-i18n";
import type { MenuItemProps, Provider } from "aihappey-types";
import { CostBadge } from "../badges";
import { useDarkMode } from "usehooks-ts";

interface TranscriptionCardProps {
    transcription: TranscriptionResponse
    filename: string
    file: Blob
    onDelete?: () => void
    providers?: Record<string, Provider>
}

const getGatewayCost = (providerMetadata?: Record<string, any>) => {
    const cost = providerMetadata?.gateway?.cost;
    return typeof cost === "number" && Number.isFinite(cost) ? cost : undefined;
};

type DurationFormatter = {
    format: (duration: Record<string, number>) => string;
};

type IntlWithDurationFormat = typeof Intl & {
    DurationFormat?: new (locale?: string | string[], options?: Record<string, unknown>) => DurationFormatter;
};

const formatDurationFallback = (durationInSeconds: number) => {
    if (durationInSeconds < 1) {
        return `${Math.max(1, Math.round(durationInSeconds * 1000))} ms`;
    }

    const roundedTotalSeconds = durationInSeconds < 60
        ? Math.round(durationInSeconds * 10) / 10
        : Math.round(durationInSeconds);
    const hours = Math.floor(roundedTotalSeconds / 3600);
    const minutes = Math.floor((roundedTotalSeconds % 3600) / 60);
    const seconds = roundedTotalSeconds % 60;
    const formatSeconds = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(1);

    if (hours > 0) {
        return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`;
    }

    if (minutes > 0) {
        return seconds > 0 ? `${minutes} min ${formatSeconds(seconds)} sec` : `${minutes} min`;
    }

    return `${formatSeconds(seconds)} sec`;
};

const toDurationRecord = (durationInSeconds: number) => {
    if (durationInSeconds < 1) {
        return { milliseconds: Math.max(1, Math.round(durationInSeconds * 1000)) };
    }

    const roundedTotalSeconds = durationInSeconds < 60
        ? Math.round(durationInSeconds * 10) / 10
        : Math.round(durationInSeconds);
    const hours = Math.floor(roundedTotalSeconds / 3600);
    const minutes = Math.floor((roundedTotalSeconds % 3600) / 60);
    const seconds = roundedTotalSeconds % 60;

    return {
        ...(hours > 0 ? { hours } : {}),
        ...(minutes > 0 ? { minutes } : {}),
        ...(seconds > 0 || (hours === 0 && minutes === 0) ? { seconds } : {}),
    };
};

const formatDuration = (durationInSeconds: number | undefined) => {
    if (typeof durationInSeconds !== "number" || !Number.isFinite(durationInSeconds) || durationInSeconds < 0) {
        return undefined;
    }

    const DurationFormat = (Intl as IntlWithDurationFormat).DurationFormat;

    if (DurationFormat) {
        try {
            const formatted = new DurationFormat(undefined, { style: "short" }).format(toDurationRecord(durationInSeconds));
            if (formatted.trim().length > 0) return formatted;
        } catch {
            // Fall back for runtimes or type implementations that do not support fractional seconds yet.
        }
    }

    return formatDurationFallback(durationInSeconds);
};

const getProvider = (
    providers: Record<string, Provider> | undefined,
    key: string | undefined
) => {
    if (!providers || !key) return undefined;

    return providers[key] ?? providers[key.toLocaleLowerCase()];
};

const getProviderKeyFromMetadata = (
    providerMetadata: Record<string, any> | undefined,
    providers: Record<string, Provider> | undefined
) => {
    if (!providerMetadata || !providers) return undefined;

    return Object.keys(providerMetadata).find((key) => {
        const normalizedKey = key.trim().toLocaleLowerCase();
        return normalizedKey !== "gateway" && !!getProvider(providers, normalizedKey);
    });
};

export const TranscriptionCard = ({ transcription, file, filename, onDelete, providers }: TranscriptionCardProps) => {
    const { Card, Menu, Badge, Image } = useTheme();
    const { t } = useTranslation();
    const { isDarkMode } = useDarkMode();
    const [detailsOpen, setDetailsOpen] = useState(false);
    const providerMetadata = transcription.providerMetadata;
    const gatewayCost = getGatewayCost(providerMetadata);
    const modelId = transcription.response?.modelId;
    const language = transcription.language?.trim();
    const duration = formatDuration(transcription.durationInSeconds);
    const providerKey = getProviderKeyFromMetadata(providerMetadata, providers);
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

    const menuItems: MenuItemProps[] = [
        {
            key: "delete",
            label: t("delete"),
            onClick: onDelete,
        },
    ];

    const headerActions = onDelete ? <Menu items={menuItems} /> : undefined;

    const actions = (
        <ViewButton
            title={t("viewTranscription")}
            variant="transparent"
            size="small"
            onClick={() => setDetailsOpen(true)}
        />
    );

    return (
        <>
            <Card title={filename}
                size="small"
                description={<div style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    {modelId ? (
                        <Badge
                            title={modelId}
                            icon="brain"
                            size="small"
                            bg="informative"
                            appearance="ghost"
                        >
                            {modelId}
                        </Badge>
                    ) : undefined}
                    {language ? (
                        <Badge
                            title={language}
                            icon="language"
                            size="small"
                            bg="informative"
                            appearance="ghost"
                        >
                            {language}
                        </Badge>
                    ) : undefined}
                    {duration ? (
                        <Badge
                            title={`${transcription.durationInSeconds} seconds`}
                            size="small"
                            bg="informative"
                            appearance="ghost"
                        >
                            {duration}
                        </Badge>
                    ) : undefined}
                    <span style={{ display: "inline-flex", alignItems: "center", transform: "translateY(2px)" }}>
                        <CostBadge cost={gatewayCost} size="small" />
                    </span>
                </div>}
                image={providerImage}
                actions={actions}
                headerActions={headerActions}>
                <LimitedTextField text={transcription.text} />
            </Card>

            <TranscriptionDetailsModal
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                transcription={transcription}
                audio={file}
                audioFilename={filename}
                providers={providers}
            />
        </>
    );
};
