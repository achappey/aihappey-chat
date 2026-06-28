import { useEffect, useMemo, useState } from "react";
import {
    FilterDrawerPanel,
    ProviderCard,
    ProviderDetailModal,
    PROVIDER_LOCATION_ALL_FILTER_VALUE,
    StickyHeaderBar,
    toggleProviderLocationMultiSelectValue,
    useTheme,
} from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { useDarkMode } from "usehooks-ts";
import { OverviewPageHeader } from "../../ui/layout/OverviewPageHeader";
import type { Provider, ProviderCategory } from "aihappey-types";
import { useAppStore } from "aihappey-state";
import { useIsDesktop } from "../../shell/responsive/useIsDesktop";
import { MeshFiltersRow } from "./mesh/MeshFiltersRow";
import { useProviderRegistry } from "../../runtime/providers/useProviderRegistry";
import { AddProviderModal } from "./AddProviderModal";
import { getModelProviderKey, isUserVisibleModel } from "aihappey-types";

type ProviderListItem = {
    key: string;
} & Provider;

export const ProvidersPage = () => {
    const PAGE_SIZE = 50;
    const { Drawer, Switch, Button, Text } = useTheme();
    const CONTENT_MAX_WIDTH = 980;
    const DESKTOP_FILTER_DRAWER_WIDTH = 320;
    const { t } = useTranslation();
    const { isDarkMode } = useDarkMode();
    const isDesktop = useIsDesktop();
    const [search, setSearch] = useState("");
    const [filtersOpen, setFiltersOpen] = useState(() => isDesktop);
    const [selectedCountries, setSelectedCountries] = useState<string[]>([
        PROVIDER_LOCATION_ALL_FILTER_VALUE,
    ]);
    const [selectedRegions, setSelectedRegions] = useState<string[]>([
        PROVIDER_LOCATION_ALL_FILTER_VALUE,
    ]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([
        PROVIDER_LOCATION_ALL_FILTER_VALUE,
    ]);
    const [selectedModelTypes, setSelectedModelTypes] = useState<string[]>([
        PROVIDER_LOCATION_ALL_FILTER_VALUE,
    ]);
    const [selectedProviderKey, setSelectedProviderKey] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [showAddProvider, setShowAddProvider] = useState(false);
    const providerRegistry = useProviderRegistry();
    const models = useAppStore((s) => s.models);
    const favoriteModelsByType = useAppStore((s: any) => s.favoriteModelsByType as Record<string, string[]> | undefined);
    const toggleFavoriteModelForType = useAppStore((s: any) => s.toggleFavoriteModelForType as (type: string, modelId: string) => void);
    const collator = useMemo(
        () => new Intl.Collator(undefined, { sensitivity: "base", numeric: true }),
        []
    );

    const orderedModels = useMemo(() => {
        if (!models) return [];

        return models.filter(isUserVisibleModel).sort((a, b) =>
            t(a.type).localeCompare(t(b.type))
        );
    }, [models]);

    const modelTypesByProvider = useMemo(() => {
        const byProvider: Record<string, string[]> = {};

        orderedModels.forEach((model) => {
            if (!model.type) return;

            const providerKey = getModelProviderKey(model.id, model);
            if (!providerKey) return;

            const existing = byProvider[providerKey] ?? [];
            if (!existing.includes(model.type)) {
                byProvider[providerKey] = [...existing, model.type];
            }
        });

        return byProvider;
    }, [orderedModels]);

    const providers: ProviderListItem[] = useMemo(() => {
        const items = Object.entries(providerRegistry).map(([key, meta]) => {
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
    }, [collator, providerRegistry]);

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

    const categoryOptions = useMemo(() => {
        const values = new Set<ProviderCategory>();
        providers.forEach((p) => {
            if (p.category) {
                values.add(p.category);
            }
        });

        return Array.from(values).sort((a, b) =>
            collator.compare(t(`ai.providerCategories.${a}.label`), t(`ai.providerCategories.${b}.label`))
        );
    }, [providers, collator, t]);

    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        providers.forEach((p) => {
            if (!p.category) return;
            counts[p.category] = (counts[p.category] ?? 0) + 1;
        });

        return counts;
    }, [providers]);

    const modelTypeOptions = useMemo(() => {
        const values = new Set<string>();

        Object.values(modelTypesByProvider).forEach((types) => {
            types.forEach((type) => {
                if (type) {
                    values.add(type);
                }
            });
        });

        return Array.from(values).sort((a, b) => collator.compare(t(a), t(b)));
    }, [collator, modelTypesByProvider, t]);

    const modelTypeCounts = useMemo(() => {
        const counts: Record<string, number> = {};

        providers.forEach((p) => {
            const types = modelTypesByProvider[p.key] ?? [];
            types.forEach((type) => {
                counts[type] = (counts[type] ?? 0) + 1;
            });
        });

        return counts;
    }, [modelTypesByProvider, providers]);

    const sortedProviderCountryOptions = useMemo(() => {
        return [...providerCountryOptions].sort((a, b) =>
            collator.compare(t(`regional:countries.${a}`), t(`regional:countries.${b}`))
        );
    }, [collator, providerCountryOptions, t]);

    const countryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        providers.forEach((p) => {
            if (!p.providerCountry) return;
            counts[p.providerCountry] = (counts[p.providerCountry] ?? 0) + 1;
        });

        return counts;
    }, [providers]);

    const regionCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        providers.forEach((p) => {
            (p.inferenceRegions ?? []).forEach((region) => {
                if (!region) return;
                counts[region] = (counts[region] ?? 0) + 1;
            });
        });

        return counts;
    }, [providers]);

    const filterSections = useMemo(() => {
        return [
            {
                id: "provider-category-filters",
                label: t('category'),
                allOption: {
                    id: "all-categories",
                    label: t("all"),
                    count: providers.length,
                    checked: selectedCategories.includes(PROVIDER_LOCATION_ALL_FILTER_VALUE),
                    onChange: () => setSelectedCategories([PROVIDER_LOCATION_ALL_FILTER_VALUE]),
                },
                items: categoryOptions.map((category) => ({
                    id: `category-${category}`,
                    label: t(`ai.providerCategories.${category}.label`),
                    count: categoryCounts[category] ?? 0,
                    checked:
                        !selectedCategories.includes(PROVIDER_LOCATION_ALL_FILTER_VALUE) &&
                        selectedCategories.includes(category),
                    onChange: () => {
                        setSelectedCategories((current) =>
                            toggleProviderLocationMultiSelectValue(
                                current,
                                category,
                                PROVIDER_LOCATION_ALL_FILTER_VALUE
                            )
                        );
                    },
                })),
            },
            {
                id: "provider-model-type-filters",
                label: t("models"),
                allOption: {
                    id: "all-model-types",
                    label: t("all"),
                    count: providers.length,
                    checked: selectedModelTypes.includes(PROVIDER_LOCATION_ALL_FILTER_VALUE),
                    onChange: () => setSelectedModelTypes([PROVIDER_LOCATION_ALL_FILTER_VALUE]),
                },
                items: modelTypeOptions.map((modelType) => ({
                    id: `model-type-${modelType}`,
                    label: t(modelType),
                    count: modelTypeCounts[modelType] ?? 0,
                    checked:
                        !selectedModelTypes.includes(PROVIDER_LOCATION_ALL_FILTER_VALUE) &&
                        selectedModelTypes.includes(modelType),
                    onChange: () => {
                        setSelectedModelTypes((current) =>
                            toggleProviderLocationMultiSelectValue(
                                current,
                                modelType,
                                PROVIDER_LOCATION_ALL_FILTER_VALUE
                            )
                        );
                    },
                })),
            },
            {
                id: "provider-region-filters",
                label: t("aiRegion"),
                allOption: {
                    id: "all-regions",
                    label: t("all"),
                    count: providers.length,
                    checked: selectedRegions.includes(PROVIDER_LOCATION_ALL_FILTER_VALUE),
                    onChange: () => setSelectedRegions([PROVIDER_LOCATION_ALL_FILTER_VALUE]),
                },
                items: inferenceRegionOptions.map((region) => ({
                    id: `region-${region}`,
                    label: t(`regional:regions.${region}`),
                    count: regionCounts[region] ?? 0,
                    checked:
                        !selectedRegions.includes(PROVIDER_LOCATION_ALL_FILTER_VALUE) &&
                        selectedRegions.includes(region),
                    onChange: () => {
                        setSelectedRegions((current) =>
                            toggleProviderLocationMultiSelectValue(
                                current,
                                region,
                                PROVIDER_LOCATION_ALL_FILTER_VALUE
                            )
                        );
                    },
                })),
            },
            {
                id: "provider-country-filters",
                label: t("countryOfOrigin"),
                allOption: {
                    id: "all-countries",
                    label: t("all"),
                    count: providers.length,
                    checked: selectedCountries.includes(PROVIDER_LOCATION_ALL_FILTER_VALUE),
                    onChange: () => setSelectedCountries([PROVIDER_LOCATION_ALL_FILTER_VALUE]),
                },
                items: sortedProviderCountryOptions.map((country) => ({
                    id: `country-${country}`,
                    label: t(`regional:countries.${country}`),
                    count: countryCounts[country] ?? 0,
                    checked:
                        !selectedCountries.includes(PROVIDER_LOCATION_ALL_FILTER_VALUE) &&
                        selectedCountries.includes(country),
                    onChange: () => {
                        setSelectedCountries((current) =>
                            toggleProviderLocationMultiSelectValue(
                                current,
                                country,
                                PROVIDER_LOCATION_ALL_FILTER_VALUE
                            )
                        );
                    },
                })),
            },
        ];
    }, [
        categoryCounts,
        categoryOptions,
        countryCounts,
        inferenceRegionOptions,
        modelTypeCounts,
        modelTypeOptions,
        providers.length,
        regionCounts,
        selectedCategories,
        selectedCountries,
        selectedModelTypes,
        selectedRegions,
        sortedProviderCountryOptions,
        t,
    ]);

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

            const allowAllCategories = selectedCategories.includes(PROVIDER_LOCATION_ALL_FILTER_VALUE);
            const matchesCategory =
                allowAllCategories ||
                (!!p.category && selectedCategories.includes(p.category));

            const allowAllModelTypes = selectedModelTypes.includes(PROVIDER_LOCATION_ALL_FILTER_VALUE);
            const providerModelTypes = modelTypesByProvider[p.key] ?? [];
            const matchesModelType =
                allowAllModelTypes ||
                selectedModelTypes.every((type) => providerModelTypes.includes(type));

            return (
                matchesSearch &&
                matchesCountry &&
                matchesRegion &&
                matchesCategory &&
                matchesModelType
            );
        });
    }, [
        modelTypesByProvider,
        providers,
        search,
        selectedCategories,
        selectedCountries,
        selectedModelTypes,
        selectedRegions,
    ]);

    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [search, selectedCategories, selectedCountries, selectedModelTypes, selectedRegions]);

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

    const showInlineFilters = filtersOpen && isDesktop;

    const renderFilterPanels = () => (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
            }}
        >
            {filterSections.map((section) => (
                <FilterDrawerPanel
                    key={section.id}
                    sections={[section]}
                />
            ))}
        </div>
    );

    return (
        <>
            <div style={{ background: "transparent" }}>
                <div
                    style={{
                        width: "100%",
                        margin: "0 auto",
                        display: "flex",
                        flexDirection: "column",
                        paddingLeft: 8,
                        paddingRight: 0,
                        boxSizing: "border-box",
                    }}
                >
                    <div
                        style={{
                            width: "100%",
                            marginBottom: 12,
                        }}
                    >
                        <StickyHeaderBar
                            height={44}
                            rightContent={
                                <label
                                    htmlFor="providers-filters-toggle"
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "flex-end",
                                    }}
                                >
                                    <span
                                        style={{
                                            position: "absolute",
                                            width: 1,
                                            height: 1,
                                            padding: 0,
                                            margin: -1,
                                            overflow: "hidden",
                                            clip: "rect(0, 0, 0, 0)",
                                            whiteSpace: "nowrap",
                                            border: 0,
                                        }}
                                    >
                                        {t("filters")}
                                    </span>
                                    <Switch
                                        id="providers-filters-toggle"
                                        checked={filtersOpen}
                                        onChange={setFiltersOpen}
                                    />
                                </label>
                            }
                        />
                    </div>

                    <div
                        style={{
                            width: "100%",
                            display: showInlineFilters ? "grid" : "block",
                            gridTemplateColumns: showInlineFilters
                                ? `minmax(0, 1fr) ${DESKTOP_FILTER_DRAWER_WIDTH}px`
                                : undefined,
                            alignItems: "stretch",
                            minWidth: 0,
                        }}
                    >
                        <div
                            style={{
                                width: "100%",
                                minWidth: 0,
                            }}
                        >
                            <div
                                style={{
                                    width: "100%",
                                    maxWidth: CONTENT_MAX_WIDTH,
                                    margin: "0 auto",
                                    minWidth: 0,
                                }}
                            >
                                <div
                                    style={{
                                        width: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                    }}
                                >
                                    <OverviewPageHeader title={t("ai.title")} />

                                    <Text as="p" align={"center"} style={{ maxWidth: 700 }}>
                                        {t("ai.providers", { total: providers.length })}
                                    </Text>
                                </div>

                                <div style={{ width: "100%", display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                                    <Button icon="add" variant="primary" onClick={() => setShowAddProvider(true)}>
                                        {t("providersPage.addProvider") ?? "Add provider"}
                                    </Button>
                                </div>

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
                                        gridTemplateColumns: isDesktop
                                            ? "repeat(auto-fit, minmax(320px, 1fr))"
                                            : "1fr",
                                        gap: 16,
                                        width: "100%",
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
                            </div>
                        </div>

                        {showInlineFilters ? (
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    width: DESKTOP_FILTER_DRAWER_WIDTH,
                                    maxWidth: "100%",
                                    minHeight: "100%",
                                    height: "100%",
                                }}
                            >
                                <Drawer
                                    open={true}
                                    title={t("filters")}
                                    overlay={false}
                                    position="end"
                                    size="medium"
                                    onClose={() => setFiltersOpen(false)}
                                >
                                    <div
                                        id="providers-inline-filter-drawer"
                                        style={{
                                            width: "100%",
                                            boxSizing: "border-box",
                                            padding: 16,
                                        }}
                                    >
                                        {renderFilterPanels()}
                                    </div>
                                </Drawer>
                            </div>
                        ) : null}
                    </div>

                    {!isDesktop ? (
                        <Drawer
                            open={filtersOpen}
                            title={t("filters")}
                            overlay={true}
                            position="end"
                            size="small"
                            onClose={() => setFiltersOpen(false)}
                        >
                            <div
                                id="providers-inline-filter-drawer"
                                style={{
                                    width: "100%",
                                    boxSizing: "border-box",
                                    padding: 16,
                                }}
                            >
                                {renderFilterPanels()}
                            </div>
                        </Drawer>
                    ) : null}

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
                            isModelFavorite={(model) => (favoriteModelsByType?.[model.type] ?? []).includes(model.id)}
                            onToggleModelFavorite={(model) => toggleFavoriteModelForType(model.type, model.id)}
                        />
                    )}
                    <AddProviderModal open={showAddProvider} onClose={() => setShowAddProvider(false)} />
                </div>
            </div>
        </>
    );
};
