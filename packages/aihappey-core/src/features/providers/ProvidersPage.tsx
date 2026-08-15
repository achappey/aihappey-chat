import { useCallback, useEffect, useMemo, useState } from "react";
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

type ProviderFilterSelections = {
    selectedCountries: string[];
    selectedRegions: string[];
    selectedCategories: string[];
    selectedModelTypes: string[];
};

type ProviderFilterFacet = "country" | "region" | "category" | "modelType";

const isAllFilterSelected = (selected: string[]) =>
    selected.includes(PROVIDER_LOCATION_ALL_FILTER_VALUE);

const sameSelection = (a: string[], b: string[]) =>
    a.length === b.length && a.every((value, index) => value === b[index]);

const keepAvailableSelection = (
    selected: string[],
    options: string[],
    counts: Record<string, number>
) => {
    if (isAllFilterSelected(selected)) return selected;

    const optionSet = new Set(options);
    const next = selected.filter(
        (value) => optionSet.has(value) && (counts[value] ?? 0) > 0
    );

    return next.length > 0 ? next : [PROVIDER_LOCATION_ALL_FILTER_VALUE];
};

export const ProvidersPage = () => {
    const PAGE_SIZE = 50;
    const { Drawer, Switch, Button, Text, Tabs, Tab } = useTheme();
    const CONTENT_MAX_WIDTH = 980;
    const DESKTOP_FILTER_DRAWER_WIDTH = 320;
    const { t } = useTranslation();
    const { isDarkMode } = useDarkMode();
    const isDesktop = useIsDesktop();
    const [search, setSearch] = useState("");
    const [filtersOpen, setFiltersOpen] = useState(false);
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
    const [activeTab, setActiveTab] = useState<string>("all");
    const providerRegistry = useProviderRegistry();
    const models = useAppStore((s) => s.models);
    const enabledProvidersByType = useAppStore(
        (s: any) => s.enabledProvidersByType as Record<string, string[]> | undefined
    );
    const favoriteProviderIds = useAppStore((s: any) => s.favoriteProviderIds as string[] | undefined);
    const toggleFavoriteProvider = useAppStore((s: any) => s.toggleFavoriteProvider as (providerId: string) => void);
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

    const favoriteProviderSet = useMemo(
        () => new Set((favoriteProviderIds ?? []).filter(Boolean)),
        [favoriteProviderIds]
    );

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

    const enabledProviderValues = useMemo(() => {
        const values = new Set<string>();

        Object.values(enabledProvidersByType ?? {}).forEach((providerNames) => {
            (providerNames ?? []).forEach((providerName) => {
                const normalized = String(providerName ?? "").trim().toLocaleLowerCase();
                if (normalized) values.add(normalized);
            });
        });

        return values;
    }, [enabledProvidersByType]);

    const enabledProviderKeys = useMemo(() => {
        const keys = new Set<string>();

        providers.forEach((provider) => {
            const normalizedKey = provider.key.trim().toLocaleLowerCase();
            const normalizedName = provider.name.trim().toLocaleLowerCase();

            if (
                enabledProviderValues.has(normalizedKey) ||
                enabledProviderValues.has(normalizedName)
            ) {
                keys.add(provider.key);
            }
        });

        return keys;
    }, [enabledProviderValues, providers]);

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

    const sortedProviderCountryOptions = useMemo(() => {
        return [...providerCountryOptions].sort((a, b) =>
            collator.compare(t(`regional:countries.${a}`), t(`regional:countries.${b}`))
        );
    }, [collator, providerCountryOptions, t]);

    const effectiveModelTypesByProvider = useMemo(() => {
        const byProvider: Record<string, string[]> = {};

        providers.forEach((provider) => {
            const discovered = modelTypesByProvider[provider.key] ?? [];
            if (discovered.length > 0) {
                byProvider[provider.key] = [...discovered].sort((a, b) => collator.compare(t(a), t(b)));
            }
        });

        return byProvider;
    }, [collator, modelTypesByProvider, providers, t]);

    const modelTypeOptions = useMemo(() => {
        const values = new Set<string>();

        Object.values(effectiveModelTypesByProvider).forEach((types) => {
            types.forEach((type) => {
                if (type) {
                    values.add(type);
                }
            });
        });

        return Array.from(values).sort((a, b) => collator.compare(t(a), t(b)));
    }, [collator, effectiveModelTypesByProvider, t]);

    const currentSelections = useMemo<ProviderFilterSelections>(() => ({
        selectedCountries,
        selectedRegions,
        selectedCategories,
        selectedModelTypes,
    }), [selectedCategories, selectedCountries, selectedModelTypes, selectedRegions]);

    const normalizedSearch = useMemo(() => search.trim().toLowerCase(), [search]);

    const providerMatchesFilters = useCallback((
        p: ProviderListItem,
        selections: ProviderFilterSelections,
        omittedFacet?: ProviderFilterFacet,
        includeSearch = true
    ) => {
        const haystack = `${p.key} ${p.name} ${p.urls?.homepage} ${p.description ?? ""}`.toLowerCase();
        const matchesSearch = !includeSearch || !normalizedSearch || haystack.includes(normalizedSearch);

        const matchesCountry =
            omittedFacet === "country" ||
            isAllFilterSelected(selections.selectedCountries) ||
            (!!p.providerCountry && selections.selectedCountries.includes(p.providerCountry));

        const matchesRegion =
            omittedFacet === "region" ||
            isAllFilterSelected(selections.selectedRegions) ||
            (p.inferenceRegions ?? []).some((region) => selections.selectedRegions.includes(region));

        const matchesCategory =
            omittedFacet === "category" ||
            isAllFilterSelected(selections.selectedCategories) ||
            (!!p.category && selections.selectedCategories.includes(p.category));

            const providerModelTypes = effectiveModelTypesByProvider[p.key] ?? [];
        const matchesModelType =
            omittedFacet === "modelType" ||
            isAllFilterSelected(selections.selectedModelTypes) ||
            selections.selectedModelTypes.every((type) => providerModelTypes.includes(type));

        return (
            matchesSearch &&
            matchesCountry &&
            matchesRegion &&
            matchesCategory &&
            matchesModelType
        );
    }, [effectiveModelTypesByProvider, normalizedSearch]);

    const countProviders = useCallback((
        selections: ProviderFilterSelections,
        omittedFacet?: ProviderFilterFacet,
        includeSearch = true
    ) => providers.reduce(
        (count, p) => count + (providerMatchesFilters(p, selections, omittedFacet, includeSearch) ? 1 : 0),
        0
    ), [providerMatchesFilters, providers]);

    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        categoryOptions.forEach((category) => {
            counts[category] = countProviders({
                ...currentSelections,
                selectedCategories: [category],
            });
        });

        return counts;
    }, [categoryOptions, countProviders, currentSelections]);

    const modelTypeCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        const activeModelTypes = isAllFilterSelected(selectedModelTypes) ? [] : selectedModelTypes;

        modelTypeOptions.forEach((modelType) => {
            const nextModelTypes = activeModelTypes.includes(modelType)
                ? activeModelTypes
                : [...activeModelTypes, modelType];

            counts[modelType] = countProviders({
                ...currentSelections,
                selectedModelTypes: nextModelTypes.length > 0
                    ? nextModelTypes
                    : [PROVIDER_LOCATION_ALL_FILTER_VALUE],
            });
        });

        return counts;
    }, [countProviders, currentSelections, modelTypeOptions, selectedModelTypes]);

    const countryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        providerCountryOptions.forEach((country) => {
            counts[country] = countProviders({
                ...currentSelections,
                selectedCountries: [country],
            });
        });

        return counts;
    }, [countProviders, currentSelections, providerCountryOptions]);

    const regionCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        inferenceRegionOptions.forEach((region) => {
            counts[region] = countProviders({
                ...currentSelections,
                selectedRegions: [region],
            });
        });

        return counts;
    }, [countProviders, currentSelections, inferenceRegionOptions]);

    const cleanupCounts = useMemo(() => {
        const createCounts = (facet: ProviderFilterFacet, values: string[]) => {
            const counts: Record<string, number> = {};
            values.forEach((value) => {
                const selections = { ...currentSelections };
                if (facet === "category") selections.selectedCategories = [value];
                if (facet === "country") selections.selectedCountries = [value];
                if (facet === "region") selections.selectedRegions = [value];
                if (facet === "modelType") {
                    const activeModelTypes = isAllFilterSelected(selectedModelTypes) ? [] : selectedModelTypes;
                    selections.selectedModelTypes = activeModelTypes.includes(value)
                        ? activeModelTypes
                        : [...activeModelTypes, value];
                }

                counts[value] = countProviders(selections, undefined, false);
            });
            return counts;
        };

        return {
            categories: createCounts("category", categoryOptions),
            countries: createCounts("country", providerCountryOptions),
            regions: createCounts("region", inferenceRegionOptions),
            modelTypes: createCounts("modelType", modelTypeOptions),
        };
    }, [categoryOptions, countProviders, currentSelections, inferenceRegionOptions, modelTypeOptions, providerCountryOptions, selectedModelTypes]);

    const allCategoryCount = useMemo(
        () => countProviders(currentSelections, "category"),
        [countProviders, currentSelections]
    );

    const allModelTypeCount = useMemo(
        () => countProviders(currentSelections, "modelType"),
        [countProviders, currentSelections]
    );

    const allRegionCount = useMemo(
        () => countProviders(currentSelections, "region"),
        [countProviders, currentSelections]
    );

    const allCountryCount = useMemo(
        () => countProviders(currentSelections, "country"),
        [countProviders, currentSelections]
    );

    const filterSections = useMemo(() => {
        return [
            {
                id: "provider-category-filters",
                label: t('category'),
                allOption: {
                    id: "all-categories",
                    label: t("all"),
                    count: allCategoryCount,
                    checked: selectedCategories.includes(PROVIDER_LOCATION_ALL_FILTER_VALUE),
                    onChange: () => setSelectedCategories([PROVIDER_LOCATION_ALL_FILTER_VALUE]),
                },
                items: categoryOptions.map((category) => {
                    const count = categoryCounts[category] ?? 0;
                    const checked =
                        !selectedCategories.includes(PROVIDER_LOCATION_ALL_FILTER_VALUE) &&
                        selectedCategories.includes(category);

                    return {
                        id: `category-${category}`,
                        label: t(`ai.providerCategories.${category}.label`),
                        count,
                        checked,
                        disabled: count === 0 && !checked,
                        onChange: () => {
                            if (count === 0 && !checked) return;
                            setSelectedCategories((current) =>
                                toggleProviderLocationMultiSelectValue(
                                    current,
                                    category,
                                    PROVIDER_LOCATION_ALL_FILTER_VALUE
                                )
                            );
                        },
                    };
                }),
            },
            {
                id: "provider-model-type-filters",
                label: t("models"),
                allOption: {
                    id: "all-model-types",
                    label: t("all"),
                    count: allModelTypeCount,
                    checked: selectedModelTypes.includes(PROVIDER_LOCATION_ALL_FILTER_VALUE),
                    onChange: () => setSelectedModelTypes([PROVIDER_LOCATION_ALL_FILTER_VALUE]),
                },
                items: modelTypeOptions.map((modelType) => {
                    const count = modelTypeCounts[modelType] ?? 0;
                    const checked =
                        !selectedModelTypes.includes(PROVIDER_LOCATION_ALL_FILTER_VALUE) &&
                        selectedModelTypes.includes(modelType);

                    return {
                        id: `model-type-${modelType}`,
                        label: t(modelType),
                        count,
                        checked,
                        disabled: count === 0 && !checked,
                        onChange: () => {
                            if (count === 0 && !checked) return;
                            setSelectedModelTypes((current) =>
                                toggleProviderLocationMultiSelectValue(
                                    current,
                                    modelType,
                                    PROVIDER_LOCATION_ALL_FILTER_VALUE
                                )
                            );
                        },
                    };
                }),
            },
            {
                id: "provider-region-filters",
                label: t("aiRegion"),
                allOption: {
                    id: "all-regions",
                    label: t("all"),
                    count: allRegionCount,
                    checked: selectedRegions.includes(PROVIDER_LOCATION_ALL_FILTER_VALUE),
                    onChange: () => setSelectedRegions([PROVIDER_LOCATION_ALL_FILTER_VALUE]),
                },
                items: inferenceRegionOptions.map((region) => {
                    const count = regionCounts[region] ?? 0;
                    const checked =
                        !selectedRegions.includes(PROVIDER_LOCATION_ALL_FILTER_VALUE) &&
                        selectedRegions.includes(region);

                    return {
                        id: `region-${region}`,
                        label: t(`regional:regions.${region}`),
                        count,
                        checked,
                        disabled: count === 0 && !checked,
                        onChange: () => {
                            if (count === 0 && !checked) return;
                            setSelectedRegions((current) =>
                                toggleProviderLocationMultiSelectValue(
                                    current,
                                    region,
                                    PROVIDER_LOCATION_ALL_FILTER_VALUE
                                )
                            );
                        },
                    };
                }),
            },
            {
                id: "provider-country-filters",
                label: t("countryOfOrigin"),
                allOption: {
                    id: "all-countries",
                    label: t("all"),
                    count: allCountryCount,
                    checked: selectedCountries.includes(PROVIDER_LOCATION_ALL_FILTER_VALUE),
                    onChange: () => setSelectedCountries([PROVIDER_LOCATION_ALL_FILTER_VALUE]),
                },
                items: sortedProviderCountryOptions.map((country) => {
                    const count = countryCounts[country] ?? 0;
                    const checked =
                        !selectedCountries.includes(PROVIDER_LOCATION_ALL_FILTER_VALUE) &&
                        selectedCountries.includes(country);

                    return {
                        id: `country-${country}`,
                        label: t(`regional:countries.${country}`),
                        count,
                        checked,
                        disabled: count === 0 && !checked,
                        onChange: () => {
                            if (count === 0 && !checked) return;
                            setSelectedCountries((current) =>
                                toggleProviderLocationMultiSelectValue(
                                    current,
                                    country,
                                    PROVIDER_LOCATION_ALL_FILTER_VALUE
                                )
                            );
                        },
                    };
                }),
            },
        ];
    }, [
        allCategoryCount,
        allCountryCount,
        allModelTypeCount,
        allRegionCount,
        categoryCounts,
        categoryOptions,
        countryCounts,
        inferenceRegionOptions,
        modelTypeCounts,
        modelTypeOptions,
        regionCounts,
        selectedCategories,
        selectedCountries,
        selectedModelTypes,
        selectedRegions,
        sortedProviderCountryOptions,
        t,
    ]);

    const filtered = useMemo(() => {
        return providers.filter((p) => providerMatchesFilters(p, currentSelections));
    }, [currentSelections, providerMatchesFilters, providers]);

    const favoriteFiltered = useMemo(
        () => filtered.filter((p) => favoriteProviderSet.has(p.key)),
        [favoriteProviderSet, filtered]
    );

    const enabledFiltered = useMemo(
        () => filtered.filter((p) => enabledProviderKeys.has(p.key)),
        [enabledProviderKeys, filtered]
    );

    useEffect(() => {
        setSelectedCategories((current) => {
            const next = keepAvailableSelection(current, categoryOptions, cleanupCounts.categories);
            return sameSelection(current, next) ? current : next;
        });

        setSelectedModelTypes((current) => {
            const next = keepAvailableSelection(current, modelTypeOptions, cleanupCounts.modelTypes);
            return sameSelection(current, next) ? current : next;
        });

        setSelectedRegions((current) => {
            const next = keepAvailableSelection(current, inferenceRegionOptions, cleanupCounts.regions);
            return sameSelection(current, next) ? current : next;
        });

        setSelectedCountries((current) => {
            const next = keepAvailableSelection(current, providerCountryOptions, cleanupCounts.countries);
            return sameSelection(current, next) ? current : next;
        });
    }, [
        categoryOptions,
        cleanupCounts,
        inferenceRegionOptions,
        modelTypeOptions,
        providerCountryOptions,
    ]);

    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [activeTab, search, selectedCategories, selectedCountries, selectedModelTypes, selectedRegions]);

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
        return effectiveModelTypesByProvider[selectedProvider.key] ?? [];
    }, [effectiveModelTypesByProvider, selectedProvider]);

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

    const renderProviderResults = (items: ProviderListItem[]) => (
        <>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: isDesktop
                        ? "repeat(auto-fit, minmax(320px, 1fr))"
                        : "1fr",
                    gap: 16,
                    width: "100%",
                    maxWidth: "100%",
                    minWidth: 0,
                    boxSizing: "border-box",
                    marginBottom: 24,
                }}
            >
                {items.slice(0, visibleCount).map((p) => {
                    const image =
                        p.icons?.find((i) => i.theme === (isDarkMode ? "dark" : "light"))
                            ?.src ?? p.icons?.[0]?.src;
                    const modelTypes = effectiveModelTypesByProvider[p.key] ?? [];

                    return (
                        <div
                            key={p.key}
                            style={{
                                width: isDesktop ? "100%" : "auto",
                                maxWidth: "100%",
                                minWidth: 0,
                                marginRight: isDesktop ? 0 : 4,
                            }}
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
                                isFavorite={favoriteProviderSet.has(p.key)}
                                onToggleFavorite={() => toggleFavoriteProvider(p.key)}
                            />
                        </div>
                    );
                })}
            </div>

            {items.length > visibleCount && (
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
        </>
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
                        paddingLeft: isDesktop ? 8 : 0,
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
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 12,
                                        justifyContent: "flex-end",
                                    }}
                                >
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

                                    <Button icon="add" variant="primary" onClick={() => setShowAddProvider(true)}>
                                        {t("providersPage.addProvider") ?? "Add provider"}
                                    </Button>
                                </div>
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
                                paddingLeft: isDesktop ? 0 : 12,
                                paddingRight: isDesktop ? 0 : 12,
                                boxSizing: "border-box",
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

                                <MeshFiltersRow
                                    search={search}
                                    onSearchChange={setSearch}
                                    selectedCountries={selectedCountries}
                                    selectedRegions={selectedRegions}
                                    countryOptions={providerCountryOptions}
                                    regionOptions={inferenceRegionOptions}
                                    countryCounts={countryCounts}
                                    regionCounts={regionCounts}
                                    onCountriesChange={setSelectedCountries}
                                    onRegionsChange={setSelectedRegions}
                                />

                                <Tabs activeKey={activeTab} onSelect={(k: string) => setActiveTab(k)}>
                                    <Tab eventKey="all" icon="cardList" title={`${t("all")} (${filtered.length})`}>
                                        <div style={{ paddingTop: 12 }}>{renderProviderResults(filtered)}</div>
                                    </Tab>

                                    <Tab eventKey="enabled" title={`${t("enabled")} (${enabledFiltered.length})`}>
                                        <div style={{ paddingTop: 12 }}>{renderProviderResults(enabledFiltered)}</div>
                                    </Tab>

                                    <Tab eventKey="favorites" icon="starFilled" title={`${t("favorites")} (${favoriteFiltered.length})`}>
                                        <div style={{ paddingTop: 12 }}>{renderProviderResults(favoriteFiltered)}</div>
                                    </Tab>
                                </Tabs>
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
