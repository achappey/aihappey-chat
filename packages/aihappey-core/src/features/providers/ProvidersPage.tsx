import { useMemo, useState } from "react";
import { ProviderCard, useTheme } from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { useDarkMode } from "usehooks-ts";
import { OverviewPageHeader } from "../../ui/layout/OverviewPageHeader";
import { PROVIDERS } from "../../runtime/providers/providerMetadata";
import type { Provider } from "aihappey-types";

type ProviderListItem = {
    key: string;
} & Provider;

export const ProvidersPage = () => {
    const { SearchBox, Paragraph } = useTheme();
    const { t } = useTranslation();
    const { isDarkMode } = useDarkMode();
    const [search, setSearch] = useState("");

    const collator = useMemo(
        () => new Intl.Collator(undefined, { sensitivity: "base", numeric: true }),
        []
    );

    const providers: ProviderListItem[] = useMemo(() => {
        const items = Object.entries(PROVIDERS).map(([key, meta]) => {
            const m = meta as any;
            return {
                key: m.id,
                name: m?.name ?? key,
                description: m?.description,
                experimental: m?.experimental,
                url: m?.url ?? "",
                icons: m?.icons,
            } satisfies ProviderListItem;
        });

        items.sort((a, b) => collator.compare(a.name, b.name));
        return items;
    }, [collator]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return providers;

        return providers.filter((p) => {
            const haystack = `${p.key} ${p.name} ${p.url}`.toLowerCase();
            return haystack.includes(q);
        });
    }, [providers, search]);

    return (
        <>
            <div style={{ background: "transparent" }}>
                <div
                    style={{
                        width: 700,
                        maxWidth: "100%",
                        margin: "0 auto",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                    }}
                >
                    <OverviewPageHeader title={t("ai.title")} />

                    <Paragraph style={{ textAlign: "center" }}>
                        {t("ai.providers", { total: providers.length })}
                    </Paragraph>

                    <div
                        style={{
                            width: "100%",
                            display: "flex",
                            justifyContent: "center",
                            marginBottom: 16,
                        }}
                    >
                        <div
                            style={{
                                width: 360,
                                maxWidth: "100%",
                            }}
                        >
                            <SearchBox
                                value={search}
                                onChange={setSearch}
                                placeholder={t("searchPlaceholder")}
                            />
                        </div>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                            gap: 16,
                            width: "100%",
                            maxWidth: 700,
                            marginBottom: 24,
                        }}
                    >
                        {filtered.map((p) => {
                            const image =
                                p.icons?.find((i) => i.theme === (isDarkMode ? "dark" : "light"))
                                    ?.src ?? p.icons?.[0]?.src;

                            return (
                                <div key={p.key} style={{ maxWidth: 320, width: "100%" }}>
                                    <ProviderCard
                                        name={p.name}
                                        experimental={p.experimental}
                                        url={p.url}
                                        image={image}
                                        description={p.description ?? p.key}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
};

