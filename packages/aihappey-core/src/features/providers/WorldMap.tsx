import { useEffect, useMemo, useState } from "react";
import { geoPath, geoNaturalEarth1 } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { useTranslation } from "react-i18next";

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const COUNTRY_CODES_URL =
  "https://restcountries.com/v3.1/all?fields=cca2,ccn3";
const COUNTRY_CODES_CACHE_KEY = "aihappey:worldMap:numeric-to-cca2:v1";
const INACTIVE_FILL = "#E5E7EB";

type CountryFeature = Feature<Geometry> & {
  id?: string | number;
};

type RestCountryCode = {
  cca2?: string;
  ccn3?: string | number;
};

type WorldMapProps = {
  countryProviderCounts: Record<string, number>;
  width?: number;
  height?: number;
};

const getCountryFill = (providerCount: number, maxProviderCount: number) => {
  if (providerCount <= 0) return INACTIVE_FILL;

  const normalized =
    maxProviderCount <= 1
      ? 0.45
      : (providerCount - 1) / (maxProviderCount - 1);
  const ratio = Math.max(0, Math.min(1, normalized));
  const lightness = 76 - ratio * 36;

  return `hsl(205 84% ${lightness}%)`;
};

const parseCountryCodeCache = (raw: string | null) => {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;

    const map: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      const numericKey = Number(key);
      if (!Number.isFinite(numericKey)) continue;
      if (typeof value !== "string" || value.length !== 2) continue;
      map[String(numericKey)] = value.toUpperCase();
    }

    return Object.keys(map).length ? map : null;
  } catch {
    return null;
  }
};

const buildNumericToIsoMap = (rows: RestCountryCode[]) => {
  const map: Record<string, string> = {};

  rows.forEach((row) => {
    const cca2 = row.cca2?.trim().toUpperCase();
    const ccn3Raw = String(row.ccn3 ?? "").trim();
    const numericCode = Number(ccn3Raw);

    if (!cca2 || cca2.length !== 2 || !Number.isFinite(numericCode)) {
      return;
    }

    map[String(numericCode)] = cca2;
  });

  return map;
};

export default function WorldMap({
  countryProviderCounts,
  width = 900,
  height = 500,
}: WorldMapProps) {
  const [countries, setCountries] = useState<CountryFeature[]>([]);
  const [numericToIso, setNumericToIso] = useState<Record<string, string>>({});
  const { t } = useTranslation();

  useEffect(() => {
    let cancelled = false;

    const loadGeometry = async () => {
      try {
        const response = await fetch(GEO_URL);
        const topology = await response.json();
        const geojson = feature(
          topology,
          topology.objects.countries
        ) as unknown as FeatureCollection<Geometry>;

        if (!cancelled) {
          setCountries(geojson.features as CountryFeature[]);
        }
      } catch {
        if (!cancelled) {
          setCountries([]);
        }
      }
    };

    void loadGeometry();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadCountryCodes = async () => {
      try {
        const cached = parseCountryCodeCache(
          window.localStorage.getItem(COUNTRY_CODES_CACHE_KEY)
        );

        if (cached) {
          if (!cancelled) {
            setNumericToIso(cached);
          }
          return;
        }
      } catch {
        // Ignore localStorage access issues and continue with network fetch.
      }

      try {
        const response = await fetch(COUNTRY_CODES_URL);
        if (!response.ok) return;

        const payload = (await response.json()) as RestCountryCode[];
        const built = buildNumericToIsoMap(payload);

        if (!Object.keys(built).length) return;

        try {
          window.localStorage.setItem(COUNTRY_CODES_CACHE_KEY, JSON.stringify(built));
        } catch {
          // Ignore localStorage write issues.
        }

        if (!cancelled) {
          setNumericToIso(built);
        }
      } catch {
        // Keep map rendering with neutral colors when code mapping is unavailable.
      }
    };

    void loadCountryCodes();

    return () => {
      cancelled = true;
    };
  }, []);

  const projection = useMemo(
    () => geoNaturalEarth1().scale((160 * width) / 800).translate([width / 2, height / 2]),
    [width, height]
  );

  const path = useMemo(() => geoPath(projection), [projection]);

  const maxProviders = useMemo(() => {
    const values = Object.values(countryProviderCounts);
    return values.length ? Math.max(...values) : 0;
  }, [countryProviderCounts]);

  const activeCountries = useMemo(
    () => Object.values(countryProviderCounts).filter((count) => count > 0).length,
    [countryProviderCounts]
  );

  const lowActiveFill = getCountryFill(1, Math.max(maxProviders, 2));
  const highActiveFill = getCountryFill(Math.max(maxProviders, 1), Math.max(maxProviders, 1));

  const getProviderCountForFeature = (geo: CountryFeature) => {
    const numericId = Number(geo.id);
    if (!Number.isFinite(numericId)) return 0;

    const iso2 = numericToIso[String(numericId)];
    if (!iso2) return 0;

    return countryProviderCounts[iso2] ?? 0;
  };

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", height: "auto", display: "block" }}
        role="img"
        aria-label="World map showing active providers by country"
      >
        {countries.map((geo) => {
          const providerCount = getProviderCountForFeature(geo);
          const fill = getCountryFill(providerCount, maxProviders);

          return (
            <path
              key={String(geo.id)}
              d={path(geo) || ""}
              fill={fill}
              stroke="#FFFFFF"
              strokeWidth={0.5}
            >
              <title>
                {`Country ${String(geo.id)} · ${providerCount} provider${providerCount === 1 ? "" : "s"}`}
              </title>
            </path>
          );
        })}
      </svg>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          fontSize: 12,
          color: "#6B7280",
        }}
      >
        <span>{t('ai.mesh.activeCountriesView', { count: activeCountries })}</span>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 16,
              height: 10,
              borderRadius: 4,
              background: INACTIVE_FILL,
              border: "1px solid #D1D5DB",
            }}
          />
          <span>0</span>

          <div
            style={{
              width: 120,
              height: 10,
              borderRadius: 999,
              background: `linear-gradient(90deg, ${lowActiveFill} 0%, ${highActiveFill} 100%)`,
            }}
          />
          <span>{maxProviders}</span>
        </div>
      </div>
    </div>
  );
}
