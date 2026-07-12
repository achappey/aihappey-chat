import React from "react";
import type { Provider } from "aihappey-types";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../theme/ThemeContext";

type ProviderResultCardsProps = {
    providerMetadata?: Record<string, any>;
    providers?: Record<string, Provider>;
    providerKey?: string;
    headers?: Record<string, string>;
    body?: unknown;
};

export type ProviderResultVisibility = {
    providerMetadata?: Record<string, unknown>;
    headers?: Record<string, unknown>;
    hasBody: boolean;
    hasAny: boolean;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return false;

    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
};

const getNonEmptyPlainObject = (value: unknown) => {
    if (!isPlainObject(value)) return undefined;

    return Object.keys(value).length > 0 ? value : undefined;
};

const getProvider = (
    providers: Record<string, Provider> | undefined,
    key: string | undefined,
) => {
    if (!providers || !key) return undefined;

    return providers[key] ?? providers[key.toLocaleLowerCase()];
};

const findProviderMetadataKey = (
    providerMetadata: Record<string, any> | undefined,
    providers: Record<string, Provider> | undefined,
    providerKey: string | undefined,
) => {
    if (!providerMetadata) return undefined;

    if (providerKey) {
        const normalizedProviderKey = providerKey.trim().toLocaleLowerCase();
        const matchingKey = Object.keys(providerMetadata).find(
            (key) => key.trim().toLocaleLowerCase() === normalizedProviderKey,
        );

        if (matchingKey && matchingKey.trim().toLocaleLowerCase() !== "gateway") return matchingKey;
    }

    if (!providers) return undefined;

    return Object.keys(providerMetadata).find((key) => {
        const normalizedKey = key.trim().toLocaleLowerCase();
        return normalizedKey !== "gateway" && !!getProvider(providers, normalizedKey);
    });
};

export const getProviderResultVisibility = ({
    providerMetadata,
    providers,
    providerKey,
    headers,
    body,
}: ProviderResultCardsProps): ProviderResultVisibility => {
    const metadataKey = findProviderMetadataKey(providerMetadata, providers, providerKey);
    const visibleProviderMetadata = getNonEmptyPlainObject(metadataKey ? providerMetadata?.[metadataKey] : undefined);
    const visibleHeaders = getNonEmptyPlainObject(headers);
    const hasBody = body !== undefined && body !== null;

    return {
        providerMetadata: visibleProviderMetadata,
        headers: visibleHeaders,
        hasBody,
        hasAny: !!visibleProviderMetadata || !!visibleHeaders || hasBody,
    };
};

export const ProviderResultCards = ({
    providerMetadata,
    providers,
    providerKey,
    headers,
    body,
}: ProviderResultCardsProps) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const visibility = getProviderResultVisibility({
        providerMetadata,
        providers,
        providerKey,
        headers,
        body,
    });

    if (!visibility.hasAny) return null;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {visibility.providerMetadata ? (
                <theme.Card size="small" title={t("providerMetadata", "Provider metadata")}>
                    <theme.JsonViewer value={visibility.providerMetadata} />
                </theme.Card>
            ) : null}

            {visibility.headers ? (
                <theme.Card size="small" title={t("headers", "Headers")}>
                    <theme.JsonViewer value={visibility.headers} />
                </theme.Card>
            ) : null}

            {visibility.hasBody ? (
                <theme.Card size="small" title={t("body", "Body")}>
                    <theme.JsonViewer value={body} />
                </theme.Card>
            ) : null}
        </div>
    );
};

