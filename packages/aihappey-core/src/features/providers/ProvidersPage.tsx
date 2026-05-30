import { useEffect, useMemo, useState } from "react";
import {
    ProviderCard,
    ProviderDetailModal,
    PROVIDER_LOCATION_ALL_FILTER_VALUE,
    useTheme,
} from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { useDarkMode } from "usehooks-ts";
import { OverviewPageHeader } from "../../ui/layout/OverviewPageHeader";
import { PROVIDERS } from "../../runtime/providers/providerMetadata";
import type { Provider } from "aihappey-types";
import { useAppStore } from "aihappey-state";
import { useIsDesktop } from "../../shell/responsive/useIsDesktop";
import { MeshFiltersRow } from "./mesh/MeshFiltersRow";

type ProviderListItem = {
    key: string;
} & Provider;

export const ProvidersPage = () => {
    const PAGE_SIZE = 50;
    const { Button, Text } = useTheme();
    const CONTENT_MAX_WIDTH = 980;
    const { t } = useTranslation();
    const { isDarkMode } = useDarkMode();
    const isDesktop = useIsDesktop();
    const [search, setSearch] = useState("");
    const [selectedCountries, setSelectedCountries] = useState<string[]>([
        PROVIDER_LOCATION_ALL_FILTER_VALUE,
    ]);
    const [selectedRegions, setSelectedRegions] = useState<string[]>([
        PROVIDER_LOCATION_ALL_FILTER_VALUE,
    ]);
    const [selectedProviderKey, setSelectedProviderKey] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const models = useAppStore((s) => s.models);
    const collator = useMemo(
        () => new Intl.Collator(undefined, { sensitivity: "base", numeric: true }),
        []
    );

    const orderedModels = useMemo(() => {
        if (!models) return [];

        return [...models].sort((a, b) =>
            t(a.type).localeCompare(t(b.type))
        );
    }, [models]);

    const modelTypesByProvider = useMemo(() => {
        const byProvider: Record<string, string[]> = {};

        orderedModels.forEach((model) => {
            if (!model.type) return;

            const providerKey = model.id.split("/")[0];
            if (!providerKey) return;

            const existing = byProvider[providerKey] ?? [];
            if (!existing.includes(model.type)) {
                byProvider[providerKey] = [...existing, model.type];
            }
        });

        return byProvider;
    }, [orderedModels]);

    const providers: ProviderListItem[] = useMemo(() => {
        const items = Object.entries(PROVIDERS).map(([key, meta]) => {
            const m = meta as any;
            return {
                key: key,
                name: m?.name ?? key,
                description: m?.description,
                experimental: m?.experimental,
                providerCountry: m?.providerCountry,
                inferenceRegions: m?.inferenceRegions,
                category: m?.category,
                urls: m?.urls,
                icons: m?.icons,
            } satisfies ProviderListItem;
        });

        items.sort((a, b) => collator.compare(a.name, b.name));
        return items;
    }, [collator]);

    const providerCountryOptions = useMemo(() => {
        const values = new Set<string>();
        providers.forEach((p) => {
            if (p.providerCountry) {
                values.add(p.providerCountry);
            }
        });

        return Array.from(values).sort((a, b) => collator.compare(a, b));
    }, [providers, collator]);

    const inferenceRegionOptions = useMemo(() => {
        const values = new Set<string>();
        providers.forEach((p) => {
            (p.inferenceRegions ?? []).forEach((region) => {
                if (region) {
                    values.add(region);
                }
            });
        });

        return Array.from(values).sort((a, b) => collator.compare(a, b));
    }, [providers, collator]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return providers.filter((p) => {
            const haystack = `${p.key} ${p.name} ${p.urls?.homepage} ${p.description ?? ""}`.toLowerCase();
            const matchesSearch = !q || haystack.includes(q);

            const allowAllCountries = selectedCountries.includes(PROVIDER_LOCATION_ALL_FILTER_VALUE);
            const matchesCountry =
                allowAllCountries ||
                (!!p.providerCountry && selectedCountries.includes(p.providerCountry));

            const allowAllRegions = selectedRegions.includes(PROVIDER_LOCATION_ALL_FILTER_VALUE);
            const matchesRegion =
                allowAllRegions ||
                (p.inferenceRegions ?? []).some((region) => selectedRegions.includes(region));

            return matchesSearch && matchesCountry && matchesRegion;
        });
    }, [providers, search, selectedCountries, selectedRegions]);

    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [search, selectedCountries, selectedRegions]);

    const selectedProvider = useMemo(
        () => providers.find((p) => p.key === selectedProviderKey) ?? null,
        [providers, selectedProviderKey]
    );

    const selectedProviderImage = useMemo(() => {
        if (!selectedProvider) return undefined;
        return (
            selectedProvider.icons?.find((i) => i.theme === (isDarkMode ? "dark" : "light"))?.src ??
            selectedProvider.icons?.[0]?.src
        );
    }, [selectedProvider, isDarkMode]);

    const selectedProviderModelTypes = useMemo(() => {
        if (!selectedProvider) return [];
        return modelTypesByProvider[selectedProvider.key] ?? [];
    }, [modelTypesByProvider, selectedProvider]);

    return (
        <>
            <div style={{ background: "transparent" }}>
                <div
                    style={{
                        width: CONTENT_MAX_WIDTH,
                        maxWidth: "100%",
                        margin: "0 auto",
                        display: "flex",
                        flexDirection: "column",
                        paddingLeft: 8,
                        paddingRight: 8,
                        boxSizing: "border-box",
                        alignItems: "center",
                    }}
                >
                    <OverviewPageHeader title={t("ai.title")} />

                    <Text as="p" align={"center"} style={{ maxWidth: 700 }}>
                        {t("ai.providers", { total: providers.length })}
                    </Text>

                    <MeshFiltersRow
                        search={search}
                        onSearchChange={setSearch}
                        selectedCountries={selectedCountries}
                        selectedRegions={selectedRegions}
                        countryOptions={providerCountryOptions}
                        regionOptions={inferenceRegionOptions}
                        onCountriesChange={setSelectedCountries}
                        onRegionsChange={setSelectedRegions}
                    />

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: isDesktop ? "repeat(2, minmax(0, 1fr))" : "1fr",
                            gap: 16,
                            width: "100%",
                            maxWidth: CONTENT_MAX_WIDTH,
                            marginBottom: 24,
                        }}
                    >
                        {filtered.slice(0, visibleCount).map((p) => {
                            const image =
                                p.icons?.find((i) => i.theme === (isDarkMode ? "dark" : "light"))
                                    ?.src ?? p.icons?.[0]?.src;
                            const modelTypes = modelTypesByProvider[p.key] ?? [];

                            return (
                                <div
                                    key={p.key}
                                    style={{ width: "100%" }}
                                >
                                    <ProviderCard
                                        name={p.name}
                                        experimental={p.experimental}
                                        urls={p.urls}
                                        providerCountry={p.providerCountry}
                                        category={p.category}
                                        image={image}
                                        description={p.description ?? p.key}
                                        modelTypes={modelTypes}
                                        onView={() => setSelectedProviderKey(p.key)}
                                    />
                                </div>
                            );
                        })}

                    </div>

                    {filtered.length > visibleCount && (
                        <div
                            style={{
                                width: "100%",
                                display: "flex",
                                justifyContent: "center",
                                marginTop: 16,
                                marginBottom: 24,
                            }}
                        >
                            <Button
                                variant="subtle"
                                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                            >
                                {t("showMore")}
                            </Button>
                        </div>
                    )}

                    {selectedProvider && (
                        <ProviderDetailModal
                            open={!!selectedProvider}
                            onClose={() => setSelectedProviderKey(null)}
                            providerKey={selectedProvider.key}
                            providerName={selectedProvider.name}
                            providerUrls={selectedProvider.urls}
                            providerDescription={selectedProvider.description}
                            providerImage={selectedProviderImage}
                            providerExperimental={selectedProvider.experimental}
                            modelTypes={selectedProviderModelTypes}
                            models={orderedModels}
                            provider={selectedProvider}
                        />
                    )}
                </div>
            </div>
        </>
    );
};
