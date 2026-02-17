import { useEffect, useMemo, useState } from "react";
import {
  ChartJsBlock,
  ProviderLocationFilters,
  PROVIDER_LOCATION_ALL_FILTER_VALUE,
  useTheme,
} from "aihappey-components";
import { useTranslation } from "aihappey-i18n";
import { useAppStore } from "aihappey-state";
import { OverviewPageHeader } from "../../ui/layout/OverviewPageHeader";
import { PROVIDERS } from "../../runtime/providers/providerMetadata";

type MeshModel = {
  id: string;
  name?: string;
  type: string;
  owned_by?: string;
};

type ProviderLocationMeta = {
  name?: string;
  providerCountry?: string;
  inferenceRegions?: string[];
};

const normalizeModelId = (modelId: string) => {
  const parts = modelId.split("/").filter(Boolean);
  return (parts[parts.length - 1] ?? modelId).toLowerCase();
};

const getProviderKey = (model: MeshModel) => {
  const parts = model.id.split("/").filter(Boolean);
  if (parts.length > 1) return parts[0].toLowerCase();
  return (model.owned_by ?? "unknown").toLowerCase();
};

export const MeshPage = () => {
  const { SearchBox, Text, Tabs, Tab, Card } = useTheme();
  const { t } = useTranslation();
  const models = useAppStore((s) => s.models) as MeshModel[] | undefined;

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
    (models ?? []).forEach((model) => {
      keys.add(getProviderKey(model));
    });
    return keys;
  }, [models]);

  const providerCountryOptions = useMemo(() => {
    const values = new Set<string>();

    providerKeysInModels.forEach((providerKey) => {
      const country = providerMetadata[providerKey]?.providerCountry;
      if (country) {
        values.add(country);
      }
    });

    return Array.from(values).sort((a, b) => collator.compare(a, b));
  }, [providerKeysInModels, providerMetadata, collator]);

  const inferenceRegionOptions = useMemo(() => {
    const values = new Set<string>();

    providerKeysInModels.forEach((providerKey) => {
      (providerMetadata[providerKey]?.inferenceRegions ?? []).forEach((region) => {
        if (region) {
          values.add(region);
        }
      });
    });

    return Array.from(values).sort((a, b) => collator.compare(a, b));
  }, [providerKeysInModels, providerMetadata, collator]);

  const locationFiltered = useMemo(() => {
    return (models ?? []).filter((model) => {
      const providerKey = getProviderKey(model);
      const provider = providerMetadata[providerKey];

      const allowAllCountries = selectedCountries.includes(PROVIDER_LOCATION_ALL_FILTER_VALUE);
      const matchesCountry =
        allowAllCountries ||
        (!!provider?.providerCountry && selectedCountries.includes(provider.providerCountry));

      const allowAllRegions = selectedRegions.includes(PROVIDER_LOCATION_ALL_FILTER_VALUE);
      const matchesRegion =
        allowAllRegions ||
        (provider?.inferenceRegions ?? []).some((region) => selectedRegions.includes(region));

      return matchesCountry && matchesRegion;
    });
  }, [models, providerMetadata, selectedCountries, selectedRegions]);

  const types = useMemo(
    () => Array.from(new Set(locationFiltered.map((m) => m.type))).sort(),
    [locationFiltered]
  );

  const [activeTab, setActiveTab] = useState<string>(types[0] ?? "");

  useEffect(() => {
    if (!types.length) {
      setActiveTab("");
      return;
    }

    if (!activeTab || !types.includes(activeTab)) {
      setActiveTab(types[0]);
    }
  }, [types, activeTab]);

  const searchFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return locationFiltered;

    return locationFiltered.filter((m) => {
      const providerKey = getProviderKey(m);
      const normalized = normalizeModelId(m.id);
      const haystack = `${m.id} ${m.name ?? ""} ${m.type ?? ""} ${providerKey} ${normalized}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [locationFiltered, search]);

  const tabFiltered = useMemo(
    () => searchFiltered.filter((m) => !activeTab || m.type === activeTab),
    [searchFiltered, activeTab]
  );

  const graphData = useMemo(() => {
    const providerIndex = new Map<string, number>();
    const modelIndex = new Map<string, number>();
    const nodes: Array<{ id: string; label: string; group: "provider" | "model"; r: number }> = [];
    const edges: Array<{ source: number; target: number }> = [];
    const seenEdges = new Set<string>();

    const providerToModelSet = new Map<string, Set<string>>();

    for (const m of tabFiltered) {
      const provider = getProviderKey(m);
      const normalizedModel = normalizeModelId(m.id);

      const key = `${provider}|${normalizedModel}`;
      if (!seenEdges.has(key)) {
        seenEdges.add(key);

        providerToModelSet.set(provider, providerToModelSet.get(provider) ?? new Set<string>());
        providerToModelSet.get(provider)!.add(normalizedModel);
      }
    }

    for (const provider of Array.from(providerToModelSet.keys()).sort()) {
      const meta = providerMetadata[provider];
      const label = meta?.name ?? provider;
      providerIndex.set(provider, nodes.length);
      nodes.push({
        id: `provider:${provider}`,
        label,
        group: "provider",
        r: 8,
      });
    }

    const allModels = Array.from(
      new Set(Array.from(providerToModelSet.values()).flatMap((set) => Array.from(set)))
    ).sort();

    for (const model of allModels) {
      modelIndex.set(model, nodes.length);
      nodes.push({
        id: `model:${model}`,
        label: model,
        group: "model",
        r: 5,
      });
    }

    for (const [provider, modelSet] of providerToModelSet.entries()) {
      const source = providerIndex.get(provider);
      if (source == null) continue;

      for (const model of modelSet) {
        const target = modelIndex.get(model);
        if (target == null) continue;
        edges.push({ source, target });
      }
    }

    return {
      datasets: [
        {
          label: t("ai.mesh.network"),
          data: nodes,
          edges,
          pointRadius: (ctx: any) => ctx.raw?.r ?? 4,
          pointHoverRadius: (ctx: any) => (ctx.raw?.r ?? 4) + 2,
          pointBackgroundColor: (ctx: any) =>
            ctx.raw?.group === "provider" ? "#0d6efd" : "#20c997",
          borderColor: "rgba(100, 100, 100, 0.35)",
          borderWidth: 1,
        },
      ],
    } as any;
  }, [tabFiltered, t, providerMetadata]);

  const graphRenderKey = useMemo(() => {
    const dataset = graphData?.datasets?.[0] as any;
    const nodes = dataset?.data?.length ?? 0;
    const edges = dataset?.edges?.length ?? 0;
    return `${activeTab}|${nodes}|${edges}|${search.trim().toLowerCase()}|${selectedCountries.join(",")}|${selectedRegions.join(",")}`;
  }, [graphData, activeTab, search, selectedCountries, selectedRegions]);

  const stackedBarData = useMemo(() => {
    const providers = Array.from(new Set(tabFiltered.map((m) => getProviderKey(m)))).sort();
    const modelTypes = Array.from(new Set(tabFiltered.map((m) => m.type))).sort();

    const grouped = new Map<string, Map<string, Set<string>>>();

    for (const m of tabFiltered) {
      const provider = getProviderKey(m);
      const type = m.type;
      const normalizedModel = normalizeModelId(m.id);

      grouped.set(provider, grouped.get(provider) ?? new Map<string, Set<string>>());
      const byType = grouped.get(provider)!;
      byType.set(type, byType.get(type) ?? new Set<string>());
      byType.get(type)!.add(normalizedModel);
    }

    const datasets = modelTypes.map((type, index) => ({
      label: t(type),
      data: providers.map((provider) => grouped.get(provider)?.get(type)?.size ?? 0),
      stack: "models",
      backgroundColor: `hsl(${(index * 47) % 360} 70% 55%)`,
      borderColor: `hsl(${(index * 47) % 360} 70% 40%)`,
      borderWidth: 1,
    }));

    return {
      labels: providers.map((provider) => providerMetadata[provider]?.name ?? provider),
      datasets,
    };
  }, [tabFiltered, t, providerMetadata]);

  const providersPerModelBarData = useMemo(() => {
    const modelToProviders = new Map<string, Set<string>>();

    for (const m of tabFiltered) {
      const provider = getProviderKey(m);
      const normalizedModel = normalizeModelId(m.id);
      modelToProviders.set(normalizedModel, modelToProviders.get(normalizedModel) ?? new Set<string>());
      modelToProviders.get(normalizedModel)!.add(provider);
    }

    const labels = Array.from(modelToProviders.entries())
      .map(([model, providers]) => ({ model, providerCount: providers.size }))
      .filter((item) => item.providerCount > 1)
      .sort((a, b) => b.providerCount - a.providerCount || a.model.localeCompare(b.model))
      .slice(0, 20)
      .map((item) => item.model);

    return {
      labels,
      datasets: [
        {
          data: labels.map((model) => modelToProviders.get(model)?.size ?? 0),
          borderWidth: 1,
        },
      ],
    };
  }, [tabFiltered]);

  return (
    <div style={{ background: "transparent" }}>
      <div
        style={{
          width: 900,
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

        <Text as="p" align={"center"}>
          {t(
            "ai.mesh.description",
            { total: tabFiltered.length }
          )}
        </Text>

        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <div style={{ width: 360, maxWidth: "100%" }}>
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder={t("searchPlaceholder")}
            />
          </div>
        </div>

        <ProviderLocationFilters
          selectedCountries={selectedCountries}
          selectedRegions={selectedRegions}
          countryOptions={providerCountryOptions}
          regionOptions={inferenceRegionOptions}
          onCountriesChange={setSelectedCountries}
          onRegionsChange={setSelectedRegions}
          allLabel={t("all")}
          countryLabel={t("countryOfOrigin")}
          regionLabel={t("aiRegion")}
          getCountryLabel={(country: string) => t("regional:countries." + country)}
          getRegionLabel={(region: string) => t("regional:regions." + region)}
          countryAriaLabel="Mesh provider country filter"
          regionAriaLabel="Mesh provider inference region filter"
        />

        <Tabs activeKey={activeTab} style={{ width: "100%" }} onSelect={(k: string) => setActiveTab(k)}>
          {types.map((type) => {
            const count = searchFiltered.filter((m) => m.type === type).length;
            return (
              <Tab key={type} eventKey={type} title={`${t(type)} (${count})`}>


                <div style={{
                  width: "100%",
                  maxWidth: 900,
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  marginBottom: 24, paddingTop: 12
                }}>
                  <Card title={t(
                    "ai.mesh.networkSummary",
                    {
                      providers: graphData?.datasets?.[0]?.data?.filter((d: any) => d.group === "provider")
                        ?.length ?? 0,
                      models: graphData?.datasets?.[0]?.data?.filter((d: any) => d.group === "model")
                        ?.length ?? 0,
                      links: graphData?.datasets?.[0]?.edges?.length ?? 0,
                    }
                  )}>

                    <ChartJsBlock
                      key={graphRenderKey}
                      type={"forceDirectedGraph" as any}
                      data={graphData}
                      options={{
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            callbacks: {
                              label: (ctx: any) => {
                                const raw = ctx?.raw;
                                return raw?.label ?? "";
                              },
                            },
                          },
                        },
                        scales: {
                          x: { display: false },
                          y: { display: false },
                        },
                      }}
                      height={420}
                    />

                  </Card>


                  <Card title={t("ai.mesh.stackedByProvider")}>
                    <ChartJsBlock
                      type={"bar" as any}
                      data={stackedBarData as any}
                      options={{
                        plugins: {
                          legend: { display: false },
                        },
                        scales: {
                          x: { stacked: true },
                          y: {
                            stacked: true,
                            beginAtZero: true,
                            ticks: { precision: 0 },
                          },
                        },
                      }}
                      height={340}
                    />

                  </Card>

                  <Card title={t("ai.mesh.providersPerModel")}>
                    <ChartJsBlock
                      type={"bar" as any}
                      data={providersPerModelBarData as any}
                      options={{
                        plugins: {
                          legend: { display: false },
                        },
                        scales: {
                          x: {
                            ticks: {
                              autoSkip: true,
                              maxRotation: 60,
                              minRotation: 0,
                            },
                          },
                          y: {
                            beginAtZero: true,
                            ticks: { precision: 0 }
                          },
                        },
                      }}
                      height={340}
                    />

                  </Card>

                </div>
              </Tab>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
};

