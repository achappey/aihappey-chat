import { useEffect, useMemo, useState } from "react";
import {
  PROVIDER_LOCATION_ALL_FILTER_VALUE,
  useTheme,
} from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { useAppStore } from "aihappey-state";
import { OverviewPageHeader } from "../../ui/layout/OverviewPageHeader";
import { PROVIDERS } from "../../runtime/providers/providerMetadata";
import { MeshAnalysisTabs } from "./mesh/MeshAnalysisTabs";
import { MeshFiltersRow } from "./mesh/MeshFiltersRow";
import {
  filterModelsByLocation,
  filterModelsBySearch,
  getInferenceRegionOptions,
  getProviderCountryOptions,
  getProviderKey,
  type MeshModel,
  type ProviderLocationMeta,
} from "./mesh/meshData";

export const MeshPage = () => {
  const { Text, Tabs, Tab } = useTheme();
  const { t } = useTranslation();
  const models = (useAppStore((s) => s.models) as MeshModel[] | undefined) ?? [];

  const [search, setSearch] = useState("");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([
    PROVIDER_LOCATION_ALL_FILTER_VALUE,
  ]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([
    PROVIDER_LOCATION_ALL_FILTER_VALUE,
  ]);

  const collator = useMemo(
    () => new Intl.Collator(undefined, { sensitivity: "base", numeric: true }),
    []
  );

  const providerMetadata = PROVIDERS as Record<string, ProviderLocationMeta>;

  const providerKeysInModels = useMemo(() => {
    const keys = new Set<string>();
    models.forEach((model) => keys.add(getProviderKey(model)));
    return keys;
  }, [models]);

  const providerCountryOptions = useMemo(
    () =>
      getProviderCountryOptions({
        providerKeysInModels,
        providerMetadata,
        collator,
      }),
    [providerKeysInModels, providerMetadata, collator]
  );

  const inferenceRegionOptions = useMemo(
    () =>
      getInferenceRegionOptions({
        providerKeysInModels,
        providerMetadata,
        collator,
      }),
    [providerKeysInModels, providerMetadata, collator]
  );

  const locationFiltered = useMemo(
    () =>
      filterModelsByLocation({
        models,
        providerMetadata,
        selectedCountries,
        selectedRegions,
      }),
    [models, providerMetadata, selectedCountries, selectedRegions]
  );

  const types = useMemo(
    () => Array.from(new Set(locationFiltered.map((m) => m.type))).sort(),
    [locationFiltered]
  );

  const [activeTypeTab, setActiveTypeTab] = useState<string>(types[0] ?? "");

  useEffect(() => {
    if (!types.length) {
      setActiveTypeTab("");
      return;
    }

    if (!activeTypeTab || !types.includes(activeTypeTab)) {
      setActiveTypeTab(types[0]);
    }
  }, [types, activeTypeTab]);

  const searchFiltered = useMemo(
    () => filterModelsBySearch(locationFiltered, search),
    [locationFiltered, search]
  );

  return (
    <div style={{ background: "transparent" }}>
      <div
        style={{
          width: 980,
          maxWidth: "100%",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingLeft: 8,
          paddingRight: 8,
          boxSizing: "border-box",
        }}
      >
        <OverviewPageHeader title={t("ai.mesh.title")} />

        <Text as="p" align={"center"} style={{ maxWidth: 800 }}>
          {t("ai.mesh.description", { total: searchFiltered.length })}
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

        <Tabs
          activeKey={activeTypeTab}
          style={{ width: "100%" }}
          onSelect={(k: string) => setActiveTypeTab(k)}
        >
          {types.map((type) => {
            const modelsForType = searchFiltered.filter((m) => m.type === type);
            const count = modelsForType.length;
            const signature = `${type}|${count}|${search.trim().toLowerCase()}|${selectedCountries.join(",")}|${selectedRegions.join(",")}`;

            return (
              <Tab key={type} eventKey={type} title={`${t(type)} (${count})`}>
                <div style={{ width: "100%", maxWidth: 980, paddingTop: 12 }}>
                  <MeshAnalysisTabs
                    models={modelsForType}
                    providerMetadata={providerMetadata}
                    filterSignature={signature}
                    t={t}
                  />
                </div>
              </Tab>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
};

