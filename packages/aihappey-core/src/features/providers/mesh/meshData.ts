import {
  PROVIDER_LOCATION_ALL_FILTER_VALUE,
} from "aihappey-components";
import { useTranslation } from "aihappey-i18n";

export type MeshModel = {
  id: string;
  name?: string;
  type: string;
  owned_by?: string;
};

export type ProviderLocationMeta = {
  name?: string;
  providerCountry?: string;
  inferenceRegions?: string[];
};

export const normalizeModelId = (modelId: string) => {
  const parts = modelId.split("/").filter(Boolean);
  return (parts[parts.length - 1] ?? modelId).toLowerCase();
};

export const getProviderKey = (model: MeshModel) => {
  const parts = model.id.split("/").filter(Boolean);
  if (parts.length > 1) return parts[0].toLowerCase();
  return (model.owned_by ?? "unknown").toLowerCase();
};

export const getProviderCountryOptions = ({
  providerKeysInModels,
  providerMetadata,
  collator,
}: {
  providerKeysInModels: Set<string>;
  providerMetadata: Record<string, ProviderLocationMeta>;
  collator: Intl.Collator;
}) => {
  const values = new Set<string>();

  providerKeysInModels.forEach((providerKey) => {
    const country = providerMetadata[providerKey]?.providerCountry;
    if (country) values.add(country);
  });

  return Array.from(values).sort((a, b) => collator.compare(a, b));
};

export const getInferenceRegionOptions = ({
  providerKeysInModels,
  providerMetadata,
  collator,
}: {
  providerKeysInModels: Set<string>;
  providerMetadata: Record<string, ProviderLocationMeta>;
  collator: Intl.Collator;
}) => {
  const values = new Set<string>();

  providerKeysInModels.forEach((providerKey) => {
    (providerMetadata[providerKey]?.inferenceRegions ?? []).forEach((region) => {
      if (region) values.add(region);
    });
  });

  return Array.from(values).sort((a, b) => collator.compare(a, b));
};

export const filterModelsByLocation = ({
  models,
  providerMetadata,
  selectedCountries,
  selectedRegions,
}: {
  models: MeshModel[];
  providerMetadata: Record<string, ProviderLocationMeta>;
  selectedCountries: string[];
  selectedRegions: string[];
}) => {
  return models.filter((model) => {
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
};

export const filterModelsBySearch = (models: MeshModel[], search: string) => {
  const q = search.trim().toLowerCase();
  if (!q) return models;

  return models.filter((m) => {
    const providerKey = getProviderKey(m);
    const normalized = normalizeModelId(m.id);
    const haystack = `${m.id} ${m.name ?? ""} ${m.type ?? ""} ${providerKey} ${normalized}`.toLowerCase();
    return haystack.includes(q);
  });
};

export const buildProviderModelGraphData = ({
  models,
  providerMetadata,
  t,
}: {
  models: MeshModel[];
  providerMetadata: Record<string, ProviderLocationMeta>;
  t: (k: string, o?: any) => string;
}) => {
  const providerIndex = new Map<string, number>();
  const modelIndex = new Map<string, number>();
  const nodes: Array<{ id: string; label: string; group: "provider" | "model"; r: number }> = [];
  const edges: Array<{ source: number; target: number }> = [];
  const seenEdges = new Set<string>();

  const providerToModelSet = new Map<string, Set<string>>();

  for (const m of models) {
    const provider = getProviderKey(m);
    const normalizedModel = normalizeModelId(m.id);
    const key = `${provider}|${normalizedModel}`;

    if (seenEdges.has(key)) continue;
    seenEdges.add(key);

    providerToModelSet.set(provider, providerToModelSet.get(provider) ?? new Set<string>());
    providerToModelSet.get(provider)!.add(normalizedModel);
  }

  for (const provider of Array.from(providerToModelSet.keys()).sort()) {
    const meta = providerMetadata[provider];
    const label = meta?.name ?? provider;
    providerIndex.set(provider, nodes.length);
    nodes.push({ id: `provider:${provider}`, label, group: "provider", r: 8 });
  }

  const allModels = Array.from(
    new Set(Array.from(providerToModelSet.values()).flatMap((set) => Array.from(set)))
  ).sort();

  for (const model of allModels) {
    modelIndex.set(model, nodes.length);
    nodes.push({ id: `model:${model}`, label: model, group: "model", r: 5 });
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
};

export const buildStackedByProviderTypeData = ({
  models,
  providerMetadata,
  t,
}: {
  models: MeshModel[];
  providerMetadata: Record<string, ProviderLocationMeta>;
  t: (k: string, o?: any) => string;
}) => {
  const providers = Array.from(new Set(models.map((m) => getProviderKey(m)))).sort();
  const modelTypes = Array.from(new Set(models.map((m) => m.type))).sort();

  const grouped = new Map<string, Map<string, Set<string>>>();

  for (const m of models) {
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
};

export const buildProvidersPerModelBarData = (models: MeshModel[], limit = 20) => {
  const modelToProviders = new Map<string, Set<string>>();

  for (const m of models) {
    const provider = getProviderKey(m);
    const normalizedModel = normalizeModelId(m.id);
    modelToProviders.set(normalizedModel, modelToProviders.get(normalizedModel) ?? new Set<string>());
    modelToProviders.get(normalizedModel)!.add(provider);
  }

  const labels = Array.from(modelToProviders.entries())
    .map(([model, providers]) => ({ model, providerCount: providers.size }))
    .filter((item) => item.providerCount > 1)
    .sort((a, b) => b.providerCount - a.providerCount || a.model.localeCompare(b.model))
    .slice(0, limit)
    .map((item) => item.model);

  return {
    labels,
    datasets: [
      {
        data: labels.map((model) => modelToProviders.get(model)?.size ?? 0),
        borderWidth: 1,
        backgroundColor: "hsl(204 70% 45%)",
        borderColor: "hsl(204 70% 35%)",
      },
    ],
  };
};

export const buildModelTypeDistributionData = ({
  models,
  t,
}: {
  models: MeshModel[];
  t: (k: string, o?: any) => string;
}) => {
  const byType = new Map<string, Set<string>>();

  for (const m of models) {
    const type = m.type || "unknown";
    const normalizedModel = normalizeModelId(m.id);
    byType.set(type, byType.get(type) ?? new Set<string>());
    byType.get(type)!.add(normalizedModel);
  }

  const rows = Array.from(byType.entries())
    .map(([type, modelSet]) => ({ type, count: modelSet.size }))
    .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type));

  return {
    labels: rows.map((row) => t(row.type)),
    datasets: [
      {
        data: rows.map((row) => row.count),
        borderWidth: 1,
        backgroundColor: rows.map((_, index) => `hsl(${(index * 53) % 360} 65% 52%)`),
        borderColor: rows.map((_, index) => `hsl(${(index * 53) % 360} 65% 38%)`),
      },
    ],
  };
};

export const buildProviderCoverageHistogramData = ({
  models,
}: {
  models: MeshModel[];
}) => {
  const modelToProviders = new Map<string, Set<string>>();

  for (const model of models) {
    const provider = getProviderKey(model);
    const normalizedModel = normalizeModelId(model.id);
    modelToProviders.set(normalizedModel, modelToProviders.get(normalizedModel) ?? new Set<string>());
    modelToProviders.get(normalizedModel)!.add(provider);
  }

  const bucketCounts = new Map<number, number>();
  for (const providers of modelToProviders.values()) {
    const providerCount = providers.size;
    bucketCounts.set(providerCount, (bucketCounts.get(providerCount) ?? 0) + 1);
  }

  const buckets = Array.from(bucketCounts.entries())
    .map(([providerCount, modelCount]) => ({ providerCount, modelCount }))
    .sort((a, b) => a.providerCount - b.providerCount);

  return {
    labels: buckets.map((bucket) => String(bucket.providerCount)),
    datasets: [
      {
        data: buckets.map((bucket) => bucket.modelCount),
        borderWidth: 1,
        backgroundColor: "hsl(284 67% 56%)",
        borderColor: "hsl(284 67% 42%)",
      },
    ],
  };
};

export const buildCountryProviderCounts = ({
  models,
  providerMetadata,
}: {
  models: MeshModel[];
  providerMetadata: Record<string, ProviderLocationMeta>;
}) => {
  const byCountry = new Map<string, Set<string>>();

  for (const model of models) {
    const providerKey = getProviderKey(model);
    const providerCountry = providerMetadata[providerKey]?.providerCountry?.toUpperCase();
    if (!providerCountry) continue;

    byCountry.set(providerCountry, byCountry.get(providerCountry) ?? new Set<string>());
    byCountry.get(providerCountry)!.add(providerKey);
  }

  return Array.from(byCountry.entries()).reduce<Record<string, number>>((acc, [country, providers]) => {
    acc[country] = providers.size;
    return acc;
  }, {});
};

export const buildRegionProviderCounts = ({
  models,
  providerMetadata,
}: {
  models: MeshModel[];
  providerMetadata: Record<string, ProviderLocationMeta>;
}) => {
  const byRegion = new Map<string, Set<string>>();

  for (const model of models) {
    const providerKey = getProviderKey(model);
    const regions = providerMetadata[providerKey]?.inferenceRegions ?? [];
    for (const region of regions) {
      if (!region) continue;
      byRegion.set(region, byRegion.get(region) ?? new Set<string>());
      byRegion.get(region)!.add(providerKey);
    }
  }

  return Array.from(byRegion.entries()).reduce<Record<string, number>>((acc, [region, providers]) => {
    acc[region] = providers.size;
    return acc;
  }, {});
};

export const buildProvidersByRegionBarData = ({
  models,
  providerMetadata,
}: {
  models: MeshModel[];
  providerMetadata: Record<string, ProviderLocationMeta>;
}) => {
  const counts = buildRegionProviderCounts({ models, providerMetadata });
  const { t } = useTranslation()
  const rows = Object.entries(counts)
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count || a.region.localeCompare(b.region));

  return {
    labels: rows.map((row) => t('regional:regions.' + row.region)),
    datasets: [
      {
        data: rows.map((row) => row.count),
        borderWidth: 1,
        backgroundColor: "hsl(152 62% 44%)",
        borderColor: "hsl(152 62% 34%)",
      },
    ],
  };
};

export const buildTopProvidersByUniqueModelCountData = ({
  models,
  providerMetadata,
  limit = 16,
}: {
  models: MeshModel[];
  providerMetadata: Record<string, ProviderLocationMeta>;
  limit?: number;
}) => {
  const byProvider = new Map<string, Set<string>>();

  for (const model of models) {
    const provider = getProviderKey(model);
    const normalized = normalizeModelId(model.id);
    byProvider.set(provider, byProvider.get(provider) ?? new Set<string>());
    byProvider.get(provider)!.add(normalized);
  }

  const rows = Array.from(byProvider.entries())
    .map(([provider, modelSet]) => ({ provider, count: modelSet.size }))
    .sort((a, b) => b.count - a.count || a.provider.localeCompare(b.provider))
    .slice(0, limit);

  return {
    labels: rows.map((row) => providerMetadata[row.provider]?.name ?? row.provider),
    datasets: [
      {
        data: rows.map((row) => row.count),
        borderWidth: 1,
        backgroundColor: "hsl(8 80% 58%)",
        borderColor: "hsl(8 80% 40%)",
      },
    ],
  };
};

export const buildRegionTypeHeatData = ({
  models,
  providerMetadata,
  t,
}: {
  models: MeshModel[];
  providerMetadata: Record<string, ProviderLocationMeta>;
  t: (k: string, o?: any) => string;
}) => {
  const regions = new Set<string>();
  const types = new Set<string>();
  const counter = new Map<string, Set<string>>();

  for (const m of models) {
    const type = m.type || "unknown";
    const provider = getProviderKey(m);
    const normalized = normalizeModelId(m.id);
    const inferenceRegions = providerMetadata[provider]?.inferenceRegions ?? [];

    types.add(type);
    for (const region of inferenceRegions) {
      regions.add(region);
      const key = `${region}|${type}`;
      counter.set(key, counter.get(key) ?? new Set<string>());
      counter.get(key)!.add(normalized);
    }
  }

  const sortedRegions = Array.from(regions).sort();
  const sortedTypes = Array.from(types).sort();

  return {
    labels: sortedRegions,
    datasets: sortedTypes.map((type, idx) => ({
      label: t(type),
      data: sortedRegions.map((region) => counter.get(`${region}|${type}`)?.size ?? 0),
      stack: "regionType",
      backgroundColor: `hsl(${(idx * 41) % 360} 65% 56%)`,
      borderColor: `hsl(${(idx * 41) % 360} 65% 38%)`,
      borderWidth: 1,
    })),
  };
};

export const getAllFilterValue = () => PROVIDER_LOCATION_ALL_FILTER_VALUE;
