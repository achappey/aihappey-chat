import React from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";
import { buildCanonicalProviderToolsConfig } from "../../providerToolConfig";

const DEFAULT_PEOPLE_SEARCH = {
  type: "people_search",
};

const PERPLEXITY_TOOL_TYPES = [
  "web_search",
  "fetch_url",
  "finance_search",
  "people_search",
];

const EMPTY_PEOPLE_SEARCH = {
  ...DEFAULT_PEOPLE_SEARCH,
  max_tokens: undefined,
  max_tokens_per_page: undefined,
  max_results_per_query: undefined,
  max_results_per_request: undefined,
};

const toOptionalNumber = (value: string) =>
  value === "" ? undefined : Number(value);

export const PerplexityPeopleSearchCardForm: React.FC<{
  config: any;
  updateConfig: (val: any) => void;
}> = ({ config, updateConfig }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const peopleSearchOn = !!config?.people_search;
  const submitConfig = (nextConfig: any) =>
    updateConfig(
      buildCanonicalProviderToolsConfig(nextConfig, PERPLEXITY_TOOL_TYPES)
    );

  const peopleSearch = {
    ...EMPTY_PEOPLE_SEARCH,
    ...(config?.people_search ?? {}),
    type: "people_search",
  };

  const updatePeopleSearch = (value: any) =>
    submitConfig({
      ...config,
      people_search: {
        ...peopleSearch,
        ...value,
        type: "people_search",
      },
    });

  return (
    <theme.Card
      size="small"
      title={t("providers:perplexity.peopleSearch") + " (Agents)"}
      headerActions={
        <theme.Switch
          id="perplexityPeopleSearch"
          checked={peopleSearchOn}
          onChange={(val) =>
            submitConfig({
              ...config,
              people_search: val ? { ...DEFAULT_PEOPLE_SEARCH } : undefined,
            })
          }
        />
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <theme.Input
            label={t("providers:perplexity.maxTokens")}
            type="number"
            disabled={!peopleSearchOn}
            style={{ flex: 1 }}
            value={peopleSearch.max_tokens ?? ""}
            onChange={(e: any) =>
              updatePeopleSearch({ max_tokens: toOptionalNumber(e.target.value) })
            }
          />

          <theme.Input
            label={t("providers:perplexity.maxTokensPerPage")}
            type="number"
            disabled={!peopleSearchOn}
            style={{ flex: 1 }}
            value={peopleSearch.max_tokens_per_page ?? ""}
            onChange={(e: any) =>
              updatePeopleSearch({
                max_tokens_per_page: toOptionalNumber(e.target.value),
              })
            }
          />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <theme.Input
            label={t("providers:perplexity.maxResultsPerQuery")}
            type="number"
            disabled={!peopleSearchOn}
            style={{ flex: 1 }}
            value={peopleSearch.max_results_per_query ?? ""}
            onChange={(e: any) =>
              updatePeopleSearch({
                max_results_per_query: toOptionalNumber(e.target.value),
              })
            }
          />

          <theme.Input
            label={t("providers:perplexity.maxResultsPerRequest")}
            type="number"
            disabled={!peopleSearchOn}
            style={{ flex: 1 }}
            value={peopleSearch.max_results_per_request ?? ""}
            onChange={(e: any) =>
              updatePeopleSearch({
                max_results_per_request: toOptionalNumber(e.target.value),
              })
            }
          />
        </div>
      </div>
    </theme.Card>
  );
};

