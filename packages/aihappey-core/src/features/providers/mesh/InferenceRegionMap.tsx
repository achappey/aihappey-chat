import { useEffect, useMemo, useState } from "react";
import WorldMap from "../WorldMap";

type Props = {
  regionProviderCounts: Record<string, number>;
  t: (key: string, options?: any) => string;
};

type RestCountryRegion = {
  cca2?: string;
  region?: string;
  subregion?: string;
};

const COUNTRY_REGION_URL =
  "https://restcountries.com/v3.1/all?fields=cca2,region,subregion";
const REGION_COUNTRIES_CACHE_KEY = "aihappey:worldMap:region-to-cca2:v1";

const parseRegionCountryCache = (raw: string | null) => {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;

    const result: Record<string, string[]> = {};
    for (const [region, countries] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof region !== "string" || !Array.isArray(countries)) continue;

      const normalized = countries
        .filter((country) => typeof country === "string" && country.length === 2)
        .map((country) => String(country).toUpperCase());

      if (normalized.length) {
        result[region] = Array.from(new Set(normalized));
      }
    }

    return Object.keys(result).length ? result : null;
  } catch {
    return null;
  }
};

const buildRegionToCountries = (rows: RestCountryRegion[]) => {
  const byRegion = new Map<string, Set<string>>();

  rows.forEach((row) => {
    const cca2 = row.cca2?.trim().toUpperCase();
    if (!cca2 || cca2.length !== 2) return;

    const candidates = [row.region, row.subregion]
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value));

    candidates.forEach((region) => {
      byRegion.set(region, byRegion.get(region) ?? new Set<string>());
      byRegion.get(region)!.add(cca2);
    });
  });

  return Array.from(byRegion.entries()).reduce<Record<string, string[]>>((acc, [region, set]) => {
    acc[region] = Array.from(set);
    return acc;
  }, {});
};

export const InferenceRegionMap = ({ regionProviderCounts, t }: Props) => {
  const [regionToCountries, setRegionToCountries] = useState<Record<string, string[]>>({});

  useEffect(() => {
    let cancelled = false;

    const loadRegionCountries = async () => {
      try {
        const cached = parseRegionCountryCache(
          window.localStorage.getItem(REGION_COUNTRIES_CACHE_KEY)
        );

        if (cached) {
          if (!cancelled) {
            setRegionToCountries(cached);
          }
          return;
        }
      } catch {
        // Ignore localStorage access issues and continue with network fetch.
      }

      try {
        const response = await fetch(COUNTRY_REGION_URL);
        if (!response.ok) return;

        const payload = (await response.json()) as RestCountryRegion[];
        const built = buildRegionToCountries(payload);

        if (!Object.keys(built).length) return;

        try {
          window.localStorage.setItem(REGION_COUNTRIES_CACHE_KEY, JSON.stringify(built));
        } catch {
          // Ignore localStorage write issues.
        }

        if (!cancelled) {
          setRegionToCountries(built);
        }
      } catch {
        // Keep map rendering with neutral colors when mapping is unavailable.
      }
    };

    void loadRegionCountries();

    return () => {
      cancelled = true;
    };
  }, []);

  const countryProviderCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    Object.entries(regionProviderCounts).forEach(([region, providerCount]) => {
      if (!region || region === "World" || providerCount <= 0) return;

      const countries = regionToCountries[region] ?? [];
      countries.forEach((country) => {
        counts[country] = Math.max(counts[country] ?? 0, providerCount);
      });
    });

    return counts;
  }, [regionProviderCounts, regionToCountries]);

  const worldCount = regionProviderCounts.World ?? 0;

  return (
    <WorldMap
      countryProviderCounts={countryProviderCounts}
      ariaLabel={t("ai.mesh.regionCoverageMap")}
      summaryText={t("ai.mesh.worldProviders", { count: worldCount })}
    />
  );
};

