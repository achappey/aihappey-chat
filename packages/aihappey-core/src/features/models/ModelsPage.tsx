import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useAppStore } from "aihappey-state";
import {
  ModelCard,
  ModelFavoriteToggleButton,
  PROVIDER_LOCATION_ALL_FILTER_VALUE,
  StickyHeaderBar,
  toggleProviderLocationMultiSelectValue,
  useTheme,
} from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { OverviewPageHeader } from "../../ui/layout/OverviewPageHeader";
import { useDarkMode } from "usehooks-ts";
import { PROVIDERS } from "../../runtime/providers/providerMetadata";
import { useNavigate } from "react-router";
import { getModelDisplayName, getModelProviderKey, isUserVisibleModel, type GenericDataGridColumn, type ModelOption } from "aihappey-types";
import { useIsDesktop } from "../../shell/responsive/useIsDesktop";

const isAllFilterSelected = (selected: string[]) =>
  selected.includes(PROVIDER_LOCATION_ALL_FILTER_VALUE);

const sameSelection = (a: string[], b: string[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

const keepAvailableSelection = (selected: string[], options: string[]) => {
  if (isAllFilterSelected(selected)) return selected;

  const optionSet = new Set(options);
  const next = selected.filter((value) => optionSet.has(value));

  return next.length > 0 ? next : [PROVIDER_LOCATION_ALL_FILTER_VALUE];
};

const getMultiSelectValueTitle = ({
  selected,
  allLabel,
  getLabel,
}: {
  selected: string[];
  allLabel: string;
  getLabel: (value: string) => string;
}) => {
  if (isAllFilterSelected(selected)) return allLabel;
  return selected.map((value) => getLabel(value)).join(", ");
};

const resolveSelectionValue = (e: ChangeEvent<HTMLSelectElement> | any) =>
  e?.target?.value ?? e?.currentTarget?.value ?? e;

const toFiniteNumber = (value?: string | number | null) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const toNonNegativeFiniteNumber = (value?: string | number | null) => {
  const n = toFiniteNumber(value);
  return n !== undefined && n >= 0 ? n : undefined;
};

const createNumericRange = (values: Array<number | undefined>) => {
  const finiteValues = values.filter((value): value is number =>
    typeof value === "number" && Number.isFinite(value)
  );

  if (finiteValues.length === 0) {
    return { min: 0, max: 0, hasValues: false };
  }

  return {
    min: Math.min(...finiteValues),
    max: Math.max(...finiteValues),
    hasValues: true,
  };
};

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const resolveSliderNumber = (value: number | number[]) => {
  const resolved = Array.isArray(value) ? value[0] : value;
  return Number.isFinite(Number(resolved)) ? Number(resolved) : 0;
};

const normalizeRangeSelection = (
  selectedMin: number | null,
  selectedMax: number | null,
  range: { min: number; max: number }
) => {
  const min = clampNumber(selectedMin ?? range.min, range.min, range.max);
  const max = clampNumber(selectedMax ?? range.max, range.min, range.max);

  return {
    min: Math.min(min, max),
    max: Math.max(min, max),
  };
};

const getModelProviderId = (model: ModelOption) =>
  getModelProviderKey(model.id, model) ?? model.id.split("/")[0].toLowerCase();

const normalizeProviderLookupValue = (value?: string) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const getEnabledProviderBucketForModelType = (
  enabledProviderKeysByType: Record<string, string[]>,
  type?: string,
) => {
  const primary = type ? enabledProviderKeysByType[type] : undefined;
  if (primary?.length) return primary;

  if (type === "audio") {
    const realtime = enabledProviderKeysByType.realtime;
    if (realtime?.length) return realtime;
  }

  const language = enabledProviderKeysByType.language;
  if (language?.length) return language;

  return primary ?? [];
};

const getAllEnabledProviderKeys = (enabledProviderKeysByType: Record<string, string[]>) =>
  Array.from(new Set(Object.values(enabledProviderKeysByType).flat()));

const getEnabledProviderKeysForModels = (
  enabledProviderKeysByType: Record<string, string[]>,
  models: ModelOption[],
) => Array.from(new Set(models.flatMap((model) =>
  getEnabledProviderBucketForModelType(enabledProviderKeysByType, model.type)
)));

const PRICE_PER_MILLION_TOKENS_MULTIPLIER = 1_000_000;
const ENABLED_PROVIDERS_FILTER_VALUE = "__ENABLED_PROVIDERS__";

export const ModelsPage = () => {
  const PAGE_SIZE = 50;
  const CONTENT_MAX_WIDTH = 980;
  const DESKTOP_FILTER_DRAWER_WIDTH = 320;
  const {
    SearchBox,
    Text,
    Tabs,
    Tab,
    ToggleButton,
    DataGrid,
    Button,
    Image,
    ProgressBar,
    Select,
    Drawer,
    Switch,
    Card,
    Slider,
  } = useTheme();
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedProviderKeys, setSelectedProviderKeys] = useState<string[]>([
    PROVIDER_LOCATION_ALL_FILTER_VALUE,
  ]);
  const [providerFilterTouched, setProviderFilterTouched] = useState(false);
  const [contextFilterEnabled, setContextFilterEnabled] = useState(false);
  const [priceFilterEnabled, setPriceFilterEnabled] = useState(false);
  const [contextMin, setContextMin] = useState<number | null>(null);
  const [contextMax, setContextMax] = useState<number | null>(null);
  const [inputPriceMin, setInputPriceMin] = useState<number | null>(null);
  const [inputPriceMax, setInputPriceMax] = useState<number | null>(null);
  const [outputPriceMin, setOutputPriceMin] = useState<number | null>(null);
  const [outputPriceMax, setOutputPriceMax] = useState<number | null>(null);
  const { isDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const models = useAppStore((s) => s.models);
  const visibleModels = useMemo(
    () => (models ?? []).filter(isUserVisibleModel),
    [models],
  );
  const modelsLoadingProgress = useAppStore((s: any) => s.modelsLoadingProgress as { completed: number; total: number; active: boolean } | undefined);
  const favoriteModelsByType = useAppStore((s: any) => s.favoriteModelsByType as Record<string, string[]> | undefined);
  const toggleFavoriteModelForType = useAppStore((s: any) => s.toggleFavoriteModelForType as (type: string, modelId: string) => void);
  const enabledProvidersByType = useAppStore((s: any) => s.enabledProvidersByType as Record<string, string[]> | undefined);
  const SelectComponent = Select || "select";
  const [activeTab, setActiveTab] = useState<string>("");
  const isDesktop = useIsDesktop();

  const [viewMode, setViewMode] = useState<"cards" | "grid">("cards");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const modelLoadPercent = modelsLoadingProgress?.total
    ? Math.round((modelsLoadingProgress.completed / modelsLoadingProgress.total) * 100)
    : 0;

  const numberLocale = i18n.resolvedLanguage ?? i18n.language;

  const collator = useMemo(
    () => new Intl.Collator(numberLocale, { sensitivity: "base", numeric: true }),
    [numberLocale]
  );

  const money = useMemo(
    () =>
      new Intl.NumberFormat(numberLocale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 10,
      }),
    [numberLocale]
  );

  const filterPanelInteger = useMemo(
    () =>
      new Intl.NumberFormat(numberLocale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    [numberLocale]
  );

  const filterPanelPrice = useMemo(
    () =>
      new Intl.NumberFormat(numberLocale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
    [numberLocale]
  );

  const formatPrice = (v?: string | number) => {
    if (v === undefined || v === null || v === "") return "";
    const n = Number(v);
    if (!Number.isFinite(n)) return String(v);
    if (n < 0) return "";
    return money.format(n);
  };

  const formatCompactNumber = useCallback(
    (value: number) => filterPanelInteger.format(Math.round(value)),
    [filterPanelInteger]
  );

  const formatPricePerMillionTokens = useCallback(
    (value: number) => filterPanelPrice.format(value * PRICE_PER_MILLION_TOKENS_MULTIPLIER),
    [filterPanelPrice]
  );

  const providerOptions = useMemo(() => {
    const counts: Record<string, number> = {};

    visibleModels.forEach((model) => {
      const providerId = getModelProviderId(model);
      counts[providerId] = (counts[providerId] ?? 0) + 1;
    });

    return Object.entries(counts)
      .map(([key, count]) => ({
        key,
        count,
        label: (PROVIDERS as any)[key]?.name ?? key,
      }))
      .filter((provider) => provider.count > 0)
      .sort((a, b) => collator.compare(a.label, b.label));
  }, [collator, visibleModels]);

  const providerOptionKeys = useMemo(
    () => providerOptions.map((provider) => provider.key),
    [providerOptions]
  );

  const providerLabelByKey = useMemo(() => {
    const labels: Record<string, string> = {};
    providerOptions.forEach((provider) => {
      labels[provider.key] = provider.label;
    });
    return labels;
  }, [providerOptions]);

  const providerNameToKey = useMemo(() => {
    const mapping: Record<string, string> = {};
    Object.entries(PROVIDERS as Record<string, any>).forEach(([key, provider]) => {
      mapping[key] = key;
      mapping[normalizeProviderLookupValue(key)] = key;

      if (provider?.name) {
        mapping[String(provider.name)] = key;
        mapping[String(provider.name).toLowerCase()] = key;
        mapping[normalizeProviderLookupValue(provider.name)] = key;
      }
    });
    return mapping;
  }, []);

  const enabledProviderKeysByType = useMemo(() => {
    const byType: Record<string, string[]> = {};
    Object.entries(enabledProvidersByType ?? {}).forEach(([type, names]) => {
      byType[type] = (names ?? [])
        .map((name) => {
          const value = String(name ?? "").trim();
          return providerNameToKey[value]
            ?? providerNameToKey[value.toLowerCase()]
            ?? providerNameToKey[normalizeProviderLookupValue(value)]
            ?? value.toLowerCase();
        })
        .filter(Boolean);
    });
    return byType;
  }, [enabledProvidersByType, providerNameToKey]);

  const activeTabModels = useMemo(
    () => visibleModels.filter((model) => model.type === activeTab),
    [activeTab, visibleModels]
  );

  const enabledProviderKeysForActiveTab = useMemo(() => {
    return getEnabledProviderKeysForModels(enabledProviderKeysByType, activeTabModels);
  }, [activeTabModels, enabledProviderKeysByType]);

  const hasEnabledProvidersForActiveTab = enabledProviderKeysForActiveTab.length > 0;

  const contextRange = useMemo(
    () => createNumericRange(activeTabModels.map((model) => toFiniteNumber(model.context_window))),
    [activeTabModels]
  );

  const inputPriceRange = useMemo(
    () => createNumericRange(activeTabModels.map((model) => toNonNegativeFiniteNumber(model.pricing?.input))),
    [activeTabModels]
  );

  const outputPriceRange = useMemo(
    () => createNumericRange(activeTabModels.map((model) => toNonNegativeFiniteNumber(model.pricing?.output))),
    [activeTabModels]
  );

  const effectiveContextRange = useMemo(
    () => normalizeRangeSelection(contextMin, contextMax, contextRange),
    [contextMax, contextMin, contextRange]
  );

  const effectiveInputPriceRange = useMemo(
    () => normalizeRangeSelection(inputPriceMin, inputPriceMax, inputPriceRange),
    [inputPriceMax, inputPriceMin, inputPriceRange]
  );

  const effectiveOutputPriceRange = useMemo(
    () => normalizeRangeSelection(outputPriceMin, outputPriceMax, outputPriceRange),
    [outputPriceMax, outputPriceMin, outputPriceRange]
  );

  const contextSliderStep = useMemo(
    () => Math.max(1, Math.round((contextRange.max - contextRange.min) / 100)),
    [contextRange]
  );

  const inputPriceStep = useMemo(
    () => Math.max((inputPriceRange.max - inputPriceRange.min) / 100, 0.0000000001),
    [inputPriceRange]
  );

  const outputPriceStep = useMemo(
    () => Math.max((outputPriceRange.max - outputPriceRange.min) / 100, 0.0000000001),
    [outputPriceRange]
  );

  const normalizedSearchTerms = useMemo(
    () => search.toLowerCase().split(/\s+/).filter(Boolean),
    [search]
  );

  const modelMatchesFilters = useCallback((model: ModelOption) => {
    if (normalizedSearchTerms.length > 0) {
      const normalize = (value?: string) => value?.toLowerCase() ?? "";
      const providerId = getModelProviderId(model);
      const providerName = providerLabelByKey[providerId] ?? providerId;
      const haystack = [
        normalize(getModelDisplayName(model)),
        normalize(model.name),
        normalize(model.description),
        normalize(model.owned_by),
        normalize(providerId),
        normalize(providerName),
      ].join(" ");

      if (!normalizedSearchTerms.every((term) => haystack.includes(term))) {
        return false;
      }
    }

    if (selectedProviderKeys.includes(ENABLED_PROVIDERS_FILTER_VALUE)) {
      const providerId = getModelProviderId(model);
      const enabledProviderKeys = getAllEnabledProviderKeys(enabledProviderKeysByType);
      if (!enabledProviderKeys.includes(providerId)) return false;
    } else if (!isAllFilterSelected(selectedProviderKeys)) {
      const providerId = getModelProviderId(model);
      if (!selectedProviderKeys.includes(providerId)) return false;
    }

    if (contextFilterEnabled) {
      const context = toFiniteNumber(model.context_window);
      if (context === undefined) return false;
      if (context < effectiveContextRange.min || context > effectiveContextRange.max) return false;
    }

    if (priceFilterEnabled) {
      const inputPrice = toNonNegativeFiniteNumber(model.pricing?.input);
      const outputPrice = toNonNegativeFiniteNumber(model.pricing?.output);
      if (inputPrice === undefined || outputPrice === undefined) return false;
      if (inputPrice < effectiveInputPriceRange.min || inputPrice > effectiveInputPriceRange.max) return false;
      if (outputPrice < effectiveOutputPriceRange.min || outputPrice > effectiveOutputPriceRange.max) return false;
    }

    return true;
  }, [
    contextFilterEnabled,
    effectiveContextRange,
    effectiveInputPriceRange,
    effectiveOutputPriceRange,
    normalizedSearchTerms,
    priceFilterEnabled,
    enabledProviderKeysByType,
    providerLabelByKey,
    selectedProviderKeys,
  ]);

  const filteredModels = useMemo(
    () => visibleModels.filter(modelMatchesFilters),
    [modelMatchesFilters, visibleModels]
  );

  const types = useMemo(
    () => Array
      .from(new Set(visibleModels.map(m => m.type)))
      .sort((a, b) =>
        t(a === "audio" ? "realtime" : a)
          .localeCompare(
            t(b === "audio" ? "realtime" : b)
          )
      ),
    [t, visibleModels]
  );

  const filteredModelCountByType = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredModels.forEach((model) => {
      counts[model.type] = (counts[model.type] ?? 0) + 1;
    });
    return counts;
  }, [filteredModels]);

  useEffect(() => {
    if (types.length === 0) return;
    if (!activeTab || !types.includes(activeTab)) {
      setActiveTab(types[0]);
    }
  }, [activeTab, types]);

  useEffect(() => {
    setSelectedProviderKeys((current) => {
      if (!providerFilterTouched && hasEnabledProvidersForActiveTab) {
        return sameSelection(current, [ENABLED_PROVIDERS_FILTER_VALUE])
          ? current
          : [ENABLED_PROVIDERS_FILTER_VALUE];
      }

      const next = keepAvailableSelection(
        current,
        hasEnabledProvidersForActiveTab
          ? [ENABLED_PROVIDERS_FILTER_VALUE, ...providerOptionKeys]
          : providerOptionKeys
      );
      return sameSelection(current, next) ? current : next;
    });
  }, [hasEnabledProvidersForActiveTab, providerFilterTouched, providerOptionKeys]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [
    activeTab,
    contextFilterEnabled,
    contextMax,
    contextMin,
    inputPriceMax,
    inputPriceMin,
    outputPriceMax,
    outputPriceMin,
    priceFilterEnabled,
    search,
    selectedProviderKeys,
  ]);

  const gridColumns: GenericDataGridColumn<ModelOption>[] = useMemo(
    () => [
      {
        key: "provider",
        header: "",
        render: (row) => {
          const providerId = getModelProviderId(row);
          const icons = (PROVIDERS as any)[providerId]?.icons as
            | { src: string; theme?: "light" | "dark" }[]
            | undefined;
          const image =
            icons?.find((i) => i.theme === (isDarkMode ? "dark" : "light"))
              ?.src ?? icons?.[0]?.src;

          if (!image) return null;

          return (
            <div style={{ width: 24, height: 24, display: "flex", alignItems: "center" }}>
              <Image src={image} width={24} height={24} />
            </div>
          );
        },
      },
      {
        key: "name",
        header: "Name",
        sortable: true,
        sortFn: (a, b) => collator.compare(a.name ?? "", b.name ?? ""),
        render: (row) => getModelDisplayName(row),
      },
      {
        key: "owned_by",
        header: "Owned by",
        sortable: true,
        sortFn: (a, b) => collator.compare(a.owned_by ?? "", b.owned_by ?? ""),
        render: (row) => row.owned_by,
      },
      {
        key: "pricing_input",
        header: "Input",
        sortable: true,
        sortFn: (a, b) =>
          (toNonNegativeFiniteNumber(a.pricing?.input) ?? 0) - (toNonNegativeFiniteNumber(b.pricing?.input) ?? 0),
        render: (row) => formatPrice(row.pricing?.input),
      },
      {
        key: "pricing_output",
        header: "Output",
        sortable: true,
        sortFn: (a, b) =>
          (toNonNegativeFiniteNumber(a.pricing?.output) ?? 0) - (toNonNegativeFiniteNumber(b.pricing?.output) ?? 0),
        render: (row) => formatPrice(row.pricing?.output),
      },
      {
        key: "favorite",
        header: "",
        render: (row) => {
          const isFavorite = (favoriteModelsByType?.[row.type] ?? []).includes(row.id);
          return (
            <ModelFavoriteToggleButton
              variant="subtle"
              isFavorite={isFavorite}
              modelName={getModelDisplayName(row)}
              onToggleFavorite={() => toggleFavoriteModelForType(row.type, row.id)}
            />
          );
        },
      },
      {
        key: "chat",
        header: "",
        render: (row) => (
          <Button
            variant="subtle"
            icon="chat"
            onClick={() => navigate(`/?model=${encodeURIComponent(row.id)}`)}
          />
        ),
      },
    ],
    [Button, collator, favoriteModelsByType, Image, isDarkMode, navigate, toggleFavoriteModelForType]
  );

  const showInlineFilters = filtersOpen && isDesktop;

  const renderFilterPanels = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <Card
        size="small"
        title={t("contextWindow")}
        headerActions={
          <Switch
            id="models-context-filter-toggle"
            checked={contextFilterEnabled}
            onChange={setContextFilterEnabled}
          />
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Slider
            label={`${t("ai.modelsFilter.min")} (${formatCompactNumber(effectiveContextRange.min)})`}
            min={contextRange.min}
            max={contextRange.max}
            step={contextSliderStep}
            value={effectiveContextRange.min}
            disabled={!contextFilterEnabled || !contextRange.hasValues || contextRange.min >= contextRange.max}
            onChange={(next: number | number[]) => {
              const value = resolveSliderNumber(next);
              setContextMin(Math.min(value, effectiveContextRange.max));
            }}
          />
          <Slider
            label={`${t("ai.modelsFilter.max")} (${formatCompactNumber(effectiveContextRange.max)})`}
            min={contextRange.min}
            max={contextRange.max}
            step={contextSliderStep}
            value={effectiveContextRange.max}
            disabled={!contextFilterEnabled || !contextRange.hasValues || contextRange.min >= contextRange.max}
            onChange={(next: number | number[]) => {
              const value = resolveSliderNumber(next);
              setContextMax(Math.max(value, effectiveContextRange.min));
            }}
          />
        </div>
      </Card>

      <Card
        size="small"
        title={t("ai.modelsFilter.pricePerMillionTokens")}
        headerActions={
          <Switch
            id="models-price-filter-toggle"
            checked={priceFilterEnabled}
            onChange={setPriceFilterEnabled}
          />
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Text as="p" style={{ margin: 0, fontWeight: 700 }}>{t("input")}</Text>
            <Slider
              label={`${t("ai.modelsFilter.min")} (${formatPricePerMillionTokens(effectiveInputPriceRange.min)})`}
              min={inputPriceRange.min}
              max={inputPriceRange.max}
              step={inputPriceStep}
              value={effectiveInputPriceRange.min}
              disabled={!priceFilterEnabled || !inputPriceRange.hasValues || inputPriceRange.min >= inputPriceRange.max}
              onChange={(next: number | number[]) => {
                const value = resolveSliderNumber(next);
                setInputPriceMin(Math.min(value, effectiveInputPriceRange.max));
              }}
            />
            <Slider
              label={`${t("ai.modelsFilter.max")} (${formatPricePerMillionTokens(effectiveInputPriceRange.max)})`}
              min={inputPriceRange.min}
              max={inputPriceRange.max}
              step={inputPriceStep}
              value={effectiveInputPriceRange.max}
              disabled={!priceFilterEnabled || !inputPriceRange.hasValues || inputPriceRange.min >= inputPriceRange.max}
              onChange={(next: number | number[]) => {
                const value = resolveSliderNumber(next);
                setInputPriceMax(Math.max(value, effectiveInputPriceRange.min));
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Text as="p" style={{ margin: 0, fontWeight: 700 }}>{t("output")}</Text>
            <Slider
              label={`${t("ai.modelsFilter.min")} (${formatPricePerMillionTokens(effectiveOutputPriceRange.min)})`}
              min={outputPriceRange.min}
              max={outputPriceRange.max}
              step={outputPriceStep}
              value={effectiveOutputPriceRange.min}
              disabled={!priceFilterEnabled || !outputPriceRange.hasValues || outputPriceRange.min >= outputPriceRange.max}
              onChange={(next: number | number[]) => {
                const value = resolveSliderNumber(next);
                setOutputPriceMin(Math.min(value, effectiveOutputPriceRange.max));
              }}
            />
            <Slider
              label={`${t("ai.modelsFilter.max")} (${formatPricePerMillionTokens(effectiveOutputPriceRange.max)})`}
              min={outputPriceRange.min}
              max={outputPriceRange.max}
              step={outputPriceStep}
              value={effectiveOutputPriceRange.max}
              disabled={!priceFilterEnabled || !outputPriceRange.hasValues || outputPriceRange.min >= outputPriceRange.max}
              onChange={(next: number | number[]) => {
                const value = resolveSliderNumber(next);
                setOutputPriceMax(Math.max(value, effectiveOutputPriceRange.min));
              }}
            />
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <>
      <div style={{ background: "transparent" }}>
        <div
          style={{
            width: "100%",
            maxWidth: "100%",
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
                  htmlFor="models-filters-toggle"
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
                    id="models-filters-toggle"
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
                  <OverviewPageHeader
                    title={t("ai.title")}
                  />

                  <Text as="p" align={"center"} style={{ maxWidth: 700 }}>
                    {t("ai.description", { total: visibleModels.length })}
                  </Text>
                </div>

                {modelsLoadingProgress?.active && (
                  <div style={{ width: "100%", maxWidth: 700, margin: "0 auto 16px" }}>
                    <ProgressBar
                      value={modelLoadPercent}
                      label={`Loading models ${modelsLoadingProgress.completed}/${modelsLoadingProgress.total}`}
                    />
                  </div>
                )}

                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  <div style={{ flex: "1 1 360px", minWidth: 240, maxWidth: 420 }}>
                    <SearchBox
                      value={search}
                      onChange={setSearch}
                      placeholder={t("searchPlaceholder")}
                    />
                  </div>

                  <div style={{ width: 260, maxWidth: "100%" }}>
                    <SelectComponent
                      values={selectedProviderKeys}
                      multiselect={true}
                      size="small"
                      label={t("providers")}
                      valueTitle={getMultiSelectValueTitle({
                        selected: selectedProviderKeys,
                        allLabel: t("all"),
                        getLabel: (providerKey) => providerKey === ENABLED_PROVIDERS_FILTER_VALUE
                          ? t("enabled")
                          : providerLabelByKey[providerKey] ?? providerKey,
                      })}
                      onChange={(e: ChangeEvent<HTMLSelectElement> | any) => {
                        const selectedValue = resolveSelectionValue(e);
                        if (typeof selectedValue !== "string") return;

                        setProviderFilterTouched(true);

                        if (selectedValue === ENABLED_PROVIDERS_FILTER_VALUE) {
                          setSelectedProviderKeys([ENABLED_PROVIDERS_FILTER_VALUE]);
                          return;
                        }

                        setSelectedProviderKeys((current) =>
                          toggleProviderLocationMultiSelectValue(
                            current.filter((value) => value !== ENABLED_PROVIDERS_FILTER_VALUE),
                            selectedValue,
                            PROVIDER_LOCATION_ALL_FILTER_VALUE
                          )
                        );
                      }}
                      aria-label="Model provider filter"
                    >
                      <option value={PROVIDER_LOCATION_ALL_FILTER_VALUE}>{t("all")}</option>
                      {hasEnabledProvidersForActiveTab ? (
                        <option value={ENABLED_PROVIDERS_FILTER_VALUE}>{t("enabled")}</option>
                      ) : null}
                      {providerOptions.map((provider) => (
                        <option key={provider.key} value={provider.key}>
                          {`${provider.label} (${provider.count})`}
                        </option>
                      ))}
                    </SelectComponent>
                  </div>
                </div>

                {false && <div
                  style={{
                    width: "100%",
                    maxWidth: 700,
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <ToggleButton
                    checked={false}
                    size="small"
                    variant="informative"
                    icon={viewMode === "cards" ? "cardList" : "table"}
                    onClick={() => setViewMode(viewMode === "cards" ? "grid" : "cards")}
                    title={viewMode === "cards" ? "Card view" : "Table view"}
                    style={{ opacity: 0.85 }}
                  />
                </div>}

                <Tabs activeKey={activeTab}
                  style={{ width: "100%" }}
                  onSelect={(k: string) => setActiveTab(k)}>
                  {types.map(type => (
                    <Tab key={type}
                      eventKey={type}
                      title={t(type === "audio" ? "realtime" : type)
                        + " (" + (filteredModelCountByType[type] ?? 0) + ")"}>
                      {(() => {
                        const tabFiltered = filteredModels.filter(m => m.type === type) as ModelOption[] | undefined;

                        if (viewMode === "grid") {
                          return (
                            <div style={{ width: "100%", maxWidth: 700, margin: "0 auto 24px" }}>
                              <DataGrid
                                columns={gridColumns}
                                data={tabFiltered ?? []}
                                rowKey={(row) => row.id}
                                selectionMode="none"
                              />
                            </div>
                          );
                        }

                        return (
                          <div style={{ width: "100%", marginBottom: 24 }}>
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: isDesktop ? "repeat(auto-fit, minmax(320px, 1fr))" : "1fr",
                                gap: 16,
                                paddingTop: 12,
                                width: "100%",
                                justifyItems: "center",
                              }}
                            >
                              {tabFiltered?.slice(0, visibleCount).map(r => {
                                const providerId = getModelProviderId(r);
                                const provider = PROVIDERS[providerId];
                                const isFavorite = (favoriteModelsByType?.[r.type] ?? []).includes(r.id);

                                return (
                                  <div key={r.id}
                                    style={{
                                      width: "100%"
                                    }}>
                                    <ModelCard
                                      model={r}
                                      provider={provider}
                                      onChat={() => navigate(`/?model=${encodeURIComponent(r.id)}`)}
                                      isFavorite={isFavorite}
                                      onToggleFavorite={() => toggleFavoriteModelForType(r.type, r.id)}
                                    />
                                  </div>
                                );
                              })}
                            </div>

                            {!!tabFiltered && tabFiltered.length > visibleCount && (
                              <div
                                style={{
                                  width: "100%",
                                  display: "flex",
                                  justifyContent: "center",
                                  marginTop: 16,
                                }}
                              >
                                <Button
                                  variant="subtle"
                                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                                >
                                  {t('showMore')}
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </Tab>
                  ))}
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
                    id="models-inline-filter-drawer"
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
                id="models-overlay-filter-drawer"
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
        </div>
      </div>
    </>
  );
};
