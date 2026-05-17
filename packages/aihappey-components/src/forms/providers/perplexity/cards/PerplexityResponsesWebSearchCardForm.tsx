import React from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";
import { buildCanonicalProviderToolsConfig } from "../../providerToolConfig";

const DEFAULT_WEB_SEARCH = {
  type: "web_search",
};

const PERPLEXITY_TOOL_TYPES = [
  "web_search",
  "fetch_url",
  "finance_search",
  "people_search",
];

const EMPTY_WEB_SEARCH = {
  ...DEFAULT_WEB_SEARCH,
  filters: {
    search_domain_filter: [],
    last_updated_after_filter: "",
    last_updated_before_filter: "",
    search_after_date_filter: "",
    search_before_date_filter: "",
    search_recency_filter: undefined,
  },
  max_tokens: undefined,
  max_tokens_per_page: undefined,
  user_location: {
    city: "",
    country: "",
    latitude: undefined,
    longitude: undefined,
    region: "",
  },
};

const RECENCY_OPTIONS = ["hour", "day", "week", "month", "year"];

const toDomainArray = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);

export const PerplexityResponsesWebSearchCardForm: React.FC<{
  config: any;
  updateConfig: (val: any) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const webSearchOn = !!config?.web_search;
  const submitConfig = (nextConfig: any) =>
    updateConfig(
      buildCanonicalProviderToolsConfig(nextConfig, PERPLEXITY_TOOL_TYPES)
    );

  const webSearch = {
    ...EMPTY_WEB_SEARCH,
    ...(config?.web_search ?? {}),
    type: "web_search",
    filters: {
      ...EMPTY_WEB_SEARCH.filters,
      ...(config?.web_search?.filters ?? {}),
    },
    user_location: {
      ...EMPTY_WEB_SEARCH.user_location,
      ...(config?.web_search?.user_location ?? {}),
    },
  };

  const updateWebSearch = (value: any) =>
    submitConfig({
      ...config,
      web_search: {
        ...webSearch,
        ...value,
        type: "web_search",
      },
    });

  const updateFilters = (value: any) =>
    updateWebSearch({
      filters: {
        ...webSearch.filters,
        ...value,
      },
    });

  const updateUserLocation = (value: any) =>
    updateWebSearch({
      user_location: {
        ...webSearch.user_location,
        ...value,
      },
    });

  return (
    <theme.Card
      size="small"
      title={t("providers:perplexity.responsesWebSearch") + " (Agents)"}
      headerActions={
        <theme.Switch
          id="perplexityResponsesWebSearch"
          checked={webSearchOn}
          onChange={(val) =>
            submitConfig({
              ...config,
              web_search: val ? { ...DEFAULT_WEB_SEARCH } : undefined,
            })
          }
        />
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <theme.Input
          label={t("providers:perplexity.searchDomainFilter")}
          placeholder="example.com, docs.perplexity.ai"
          disabled={!webSearchOn}
          value={(webSearch.filters.search_domain_filter || []).join(", ")}
          onChange={(e: any) =>
            updateFilters({
              search_domain_filter: toDomainArray(e.target.value),
            })
          }
        />

        <div style={{ display: "flex", gap: 12 }}>
          <theme.Select
            label={t("providers:perplexity.searchRecencyFilter")}
            disabled={!webSearchOn}
            style={{ flex: 1 }}
            values={[webSearch.filters.search_recency_filter || ""]}
            valueTitle={
              webSearch.filters.search_recency_filter
                ? t(
                    `providers:perplexity.recency.${webSearch.filters.search_recency_filter}`
                  )
                : t("auto")
            }
            options={[
              { value: "", label: t("auto") },
              ...RECENCY_OPTIONS.map((value) => ({
                value,
                label: t(`providers:perplexity.recency.${value}`),
              })),
            ]}
            onChange={(val: string) =>
              updateFilters({ search_recency_filter: val })
            }
          >
            <option value="">{t("auto")}</option>
            {RECENCY_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {t(`providers:perplexity.recency.${value}`)}
              </option>
            ))}
          </theme.Select>

        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <theme.Input
            label={t("providers:perplexity.searchAfterDateFilter")}
            placeholder="MM/DD/YYYY"
            disabled={!webSearchOn}
            style={{ minWidth: 180, flex: 1 }}
            value={webSearch.filters.search_after_date_filter ?? ""}
            onChange={(e: any) =>
              updateFilters({ search_after_date_filter: e.target.value })
            }
          />
          <theme.Input
            label={t("providers:perplexity.searchBeforeDateFilter")}
            placeholder="MM/DD/YYYY"
            disabled={!webSearchOn}
            style={{ minWidth: 180, flex: 1 }}
            value={webSearch.filters.search_before_date_filter ?? ""}
            onChange={(e: any) =>
              updateFilters({ search_before_date_filter: e.target.value })
            }
          />
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <theme.Input
            label={t("providers:perplexity.lastUpdatedAfterFilter")}
            placeholder="MM/DD/YYYY"
            disabled={!webSearchOn}
            style={{ minWidth: 180, flex: 1 }}
            value={webSearch.filters.last_updated_after_filter ?? ""}
            onChange={(e: any) =>
              updateFilters({ last_updated_after_filter: e.target.value })
            }
          />
          <theme.Input
            label={t("providers:perplexity.lastUpdatedBeforeFilter")}
            placeholder="MM/DD/YYYY"
            disabled={!webSearchOn}
            style={{ minWidth: 180, flex: 1 }}
            value={webSearch.filters.last_updated_before_filter ?? ""}
            onChange={(e: any) =>
              updateFilters({ last_updated_before_filter: e.target.value })
            }
          />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <theme.Input
            label={t("providers:perplexity.maxTokens")}
            type="number"
            disabled={!webSearchOn}
            style={{ flex: 1 }}
            value={webSearch.max_tokens ?? ""}
            onChange={(e: any) =>
              updateWebSearch({
                max_tokens: e.target.value === "" ? "" : Number(e.target.value),
              })
            }
          />

          <theme.Input
            label={t("providers:perplexity.maxTokensPerPage")}
            type="number"
            disabled={!webSearchOn}
            style={{ flex: 1 }}
            value={webSearch.max_tokens_per_page ?? ""}
            onChange={(e: any) =>
              updateWebSearch({
                max_tokens_per_page:
                  e.target.value === "" ? "" : Number(e.target.value),
              })
            }
          />
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <theme.Input
            label={t("country")}
            placeholder="NL"
            disabled={!webSearchOn}
            style={{ minWidth: 80, flex: 1 }}
            value={webSearch.user_location.country ?? ""}
            onChange={(e: any) =>
              updateUserLocation({ country: e.target.value })
            }
          />
          <theme.Input
            label={t("region")}
            placeholder="Noord-Holland"
            disabled={!webSearchOn}
            style={{ minWidth: 120, flex: 1 }}
            value={webSearch.user_location.region ?? ""}
            onChange={(e: any) => updateUserLocation({ region: e.target.value })}
          />
          <theme.Input
            label={t("city")}
            placeholder="Amsterdam"
            disabled={!webSearchOn}
            style={{ minWidth: 120, flex: 1 }}
            value={webSearch.user_location.city ?? ""}
            onChange={(e: any) => updateUserLocation({ city: e.target.value })}
          />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <theme.Input
            label={t("latitude")}
            type="number"
            disabled={!webSearchOn}
            style={{ minWidth: 100, flex: 1 }}
            value={webSearch.user_location.latitude ?? ""}
            onChange={(e: any) =>
              updateUserLocation({
                latitude: e.target.value === "" ? "" : Number(e.target.value),
              })
            }
          />
          <theme.Input
            label={t("longitude")}
            type="number"
            disabled={!webSearchOn}
            style={{ minWidth: 100, flex: 1 }}
            value={webSearch.user_location.longitude ?? ""}
            onChange={(e: any) =>
              updateUserLocation({
                longitude: e.target.value === "" ? "" : Number(e.target.value),
              })
            }
          />
        </div>
      </div>
    </theme.Card>
  );
};
