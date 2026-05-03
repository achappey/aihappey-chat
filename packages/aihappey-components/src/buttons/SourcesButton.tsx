import type { SourceDocumentUIPart, SourceUrlUIPart } from "aihappey-ai";
import { useMemo } from "react";
import { useTheme } from "../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

type SourcePart = SourceDocumentUIPart | SourceUrlUIPart;

interface SourcesButtonProps {
    sources: SourcePart[];
    size?: string;
    maxDomains?: number;
    onClick: (sources: SourcePart[]) => void;
}

const knownSecondLevelDomains = new Set([
    "co.uk",
    "org.uk",
    "ac.uk",
    "gov.uk",
    "com.au",
    "net.au",
    "org.au",
    "co.nz",
    "com.br",
    "com.cn",
    "com.tr",
]);

const getTopLevelHost = (hostname: string) => {
    const parts = hostname.toLowerCase().split(".").filter(Boolean);
    if (parts.length <= 2) return hostname.toLowerCase();

    const suffix = parts.slice(-2).join(".");
    const take = knownSecondLevelDomains.has(suffix) ? 3 : 2;

    return parts.slice(-take).join(".");
};

const getSourceDomain = (source: SourcePart) => {
    const url = (source as SourceUrlUIPart).url;
    if (!url) return undefined;

    try {
        const parsed = new URL(url);
        const host = getTopLevelHost(parsed.hostname);
        const origin = `${parsed.protocol}//${host}`;
        return {
            origin,
            label: host,
        };
    } catch {
        return undefined;
    }
};

const getFaviconUrl = (origin: string) =>
    `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(origin)}&size=64`;

export const SourcesButton = ({
    sources,
    size,
    maxDomains = 5,
    onClick,
}: SourcesButtonProps) => {
    const { AvatarGroup, Button } = useTheme();
    const { t } = useTranslation();

    const domains = useMemo(() => {
        const counts = new Map<string, { origin: string; label: string; count: number }>();

        sources.forEach((source) => {
            const domain = getSourceDomain(source);
            if (!domain) return;

            const current = counts.get(domain.origin);
            counts.set(domain.origin, {
                ...domain,
                count: (current?.count ?? 0) + 1,
            });
        });

        return Array.from(counts.values())
            .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    }, [sources]);

    const visibleDomains = domains.slice(0, maxDomains);
    const overflowDomains = domains.slice(maxDomains);
    const overflow = Math.max(0, domains.length - visibleDomains.length);

    return (
        <>
            {visibleDomains.length > 0 && (
                <AvatarGroup layout="stack" size={16} style={{ paddingLeft: 6 }}>
                    {visibleDomains.map(({ origin, label, count }) => (
                        <AvatarGroup.Item
                            key={origin}
                            style={{ cursor: "pointer" }}
                            name={`${label} (${count})`}
                            overflowLabel={`${label} (${count})`}
                            title={label}
                            onClick={() => window.open(origin, "_blank")}
                            image={{ src: getFaviconUrl(origin), alt: origin }}
                        />
                    ))}
                    {overflow > 0 && <AvatarGroup.Popover
                        tooltip={{ content: t('showMore'), relationship: "label" }}
                        count={overflow}>
                        {overflowDomains.map(({ origin, label, count }) => (
                            <AvatarGroup.Item
                                key={origin}
                                style={{ cursor: "pointer" }}
                                name={`${label} (${count})`}
                                overflowLabel={`${label} (${count})`}
                                title={label}
                                onClick={() => window.open(origin, "_blank")}
                                image={{ src: getFaviconUrl(origin), alt: origin }}
                            />
                        ))}
                    </AvatarGroup.Popover>}
                </AvatarGroup>
            )}

            <Button
                variant="subtle"
                size={size}
                style={{
                    minWidth: 10,
                    display: "flex",
                    paddingLeft: 6,
                    paddingRight: 6,
                    alignItems: "center",
                    gap: 4,
                }}
                onClick={() => onClick(sources)}
            >
                <span>{t('sourceCount', { count: sources.length })}</span>
            </Button>
        </>
    );
};
