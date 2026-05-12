import { useState } from "react";
import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

const SEARCH_CONTEXT_SIZE_OPTIONS = ["low", "medium", "high"] as const;
const RETURN_TOKEN_BUDGET_OPTIONS = ["default", "unlimited"] as const;

const twoColumnGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 0,
  width: "100%",
  alignItems: "end",
} as const;

const DEFAULT_WEB_SEARCH = {
  search_context_size: "medium",
  user_location: undefined,
  filters: undefined,
};

const normalizeDomains = (domains: string[]) =>
  Array.from(
    new Set(
      domains
        .map((domain) => String(domain ?? "").trim())
        .filter(Boolean)
    )
  );

const normalizeFilters = (filters: any) => {
  if (!filters) return undefined;

  const allowed_domains = normalizeDomains(filters.allowed_domains ?? []);

  return allowed_domains.length
    ? {
      ...filters,
      allowed_domains,
    }
    : undefined;
};

const normalizeUserLocation = (loc: any) => {
  if (!loc) return undefined;

  const empty =
    !loc.country &&
    !loc.region &&
    !loc.city &&
    !loc.timezone;

  return empty
    ? undefined
    : {
      ...loc,
      type: "approximate",
    };
};

export const OpenAIWebSearchForm = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [draftDomain, setDraftDomain] = useState("");

  const webSearchOn = !!config?.web_search;
  const allowedDomains = config?.web_search?.filters?.allowed_domains ?? [];
  const searchContextSize =
    config?.web_search?.search_context_size ?? DEFAULT_WEB_SEARCH.search_context_size;
  const searchContextIndex = Math.max(
    0,
    SEARCH_CONTEXT_SIZE_OPTIONS.indexOf(searchContextSize as (typeof SEARCH_CONTEXT_SIZE_OPTIONS)[number])
  );
  const returnTokenBudget =
    config?.web_search?.return_token_budget ?? "default";

  const updateWebSearch = (patch: any) => {
    const nextWebSearch = {
      ...(config?.web_search ?? DEFAULT_WEB_SEARCH),
      ...patch,
    };
    const normalizedFilters = normalizeFilters(nextWebSearch.filters);
    const { filters, return_token_budget, external_web_access, ...restWebSearch } = nextWebSearch;

    updateConfig({
      ...config,
      web_search: {
        ...restWebSearch,
        ...(normalizedFilters ? { filters: normalizedFilters } : {}),
        ...(return_token_budget === "unlimited" ? { return_token_budget } : {}),
        ...(external_web_access === false ? { external_web_access } : {}),
      },
    });
  };

  const updateUserLocation = (patch: any) => {
    const user_location = normalizeUserLocation({
      ...(config?.web_search?.user_location ?? {}),
      ...patch,
    });

    updateWebSearch({ user_location });
  };

  const updateAllowedDomains = (domains: string[]) => {
    updateWebSearch({
      filters: {
        ...(config?.web_search?.filters ?? {}),
        allowed_domains: domains,
      },
    });
  };

  const addAllowedDomain = () => {
    const domain = String(draftDomain ?? "").trim();
    if (!domain) return;
    updateAllowedDomains([...allowedDomains, domain]);
    setDraftDomain("");
  };

  const toggleInclude = (key: string, enabled: boolean) => {
    const current = Array.isArray(config?.include) ? config.include : [];
    const next = enabled
      ? Array.from(new Set([...current, key]))
      : current.filter((a: any) => a !== key);

    updateConfig({
      ...config,
      include: next.length ? next : undefined,
    });
  };

  return (
    <theme.Card
      size="small"
      title={t("webSearch")}
      headerActions={
        <theme.Switch
          id="webSearch"
          checked={webSearchOn}
          onChange={() => {
            updateConfig({
              ...config,
              web_search: webSearchOn ? undefined : { ...DEFAULT_WEB_SEARCH },
            });
          }}
        />
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={twoColumnGrid}>
          <theme.Slider
            label={`${t("searchContextSize", "Search context size")} (${t(searchContextSize)})`}
            disabled={!webSearchOn}
            min={0}
            max={SEARCH_CONTEXT_SIZE_OPTIONS.length - 1}
            step={1}
            value={searchContextIndex}
            onChange={(value: number) =>
              updateWebSearch({
                search_context_size:
                  SEARCH_CONTEXT_SIZE_OPTIONS[value] ?? DEFAULT_WEB_SEARCH.search_context_size,
              })
            }
          />

          <theme.Select
            label={t("providers:openai.returnTokenBudget")}
            disabled={!webSearchOn}
            values={[returnTokenBudget]}
            valueTitle={t(`providers:openai.returnTokenBudgetOptions.${returnTokenBudget}`)}
            options={RETURN_TOKEN_BUDGET_OPTIONS.map((value) => ({
              value,
              label: t(`providers:openai.returnTokenBudgetOptions.${value}`),
            }))}
            onChange={(value: string) =>
              updateWebSearch({
                return_token_budget: value === "unlimited" ? "unlimited" : undefined,
              })
            }
          >
            {RETURN_TOKEN_BUDGET_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {t(`providers:openai.returnTokenBudgetOptions.${value}`)}
              </option>
            ))}
          </theme.Select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
            <theme.Input
              label={t("providers:openai.allowedDomains")}
              placeholder="pubmed.ncbi.nlm.nih.gov"
              disabled={!webSearchOn}
              value={draftDomain}
              style={{ flex: 1, minWidth: 220 }}
              onChange={(e: any) => setDraftDomain(String(e?.target?.value ?? ""))}
              onKeyDown={(e: any) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                addAllowedDomain();
              }}
            />
            <theme.Button
              icon="add"
              size="small"
              variant="informative"
              title={t("add")}
              disabled={!webSearchOn || !draftDomain.trim()}
              onClick={addAllowedDomain}
            />
          </div>

          {allowedDomains.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
              {allowedDomains.map((domain: string, index: number) => (
                <div
                  key={`${domain}-${index}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div style={{ fontFamily: "monospace", wordBreak: "break-all", flex: 1 }}>
                    {domain}
                  </div>
                  <theme.Button
                    size="small"
                    icon="delete"
                    variant="informative"
                    title={t("delete")}
                    disabled={!webSearchOn}
                    onClick={() =>
                      updateAllowedDomains(
                        allowedDomains.filter((_: string, i: number) => i !== index)
                      )
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <theme.Input
            label={t("country")}
            placeholder="NL"
            disabled={!webSearchOn}
            value={config?.web_search?.user_location?.country || ""}
            style={{ minWidth: 70 }}
            onChange={(e: any) =>
              updateUserLocation({ country: e.target.value })
            }
          />

          <theme.Input
            label={t("region")}
            placeholder="Noord-Holland"
            disabled={!webSearchOn}
            value={config?.web_search?.user_location?.region || ""}
            style={{ minWidth: 110 }}
            onChange={(e: any) =>
              updateUserLocation({ region: e.target.value })
            }
          />

          <theme.Input
            label={t("city")}
            placeholder="Amsterdam"
            disabled={!webSearchOn}
            value={config?.web_search?.user_location?.city || ""}
            style={{ minWidth: 110 }}
            onChange={(e: any) =>
              updateUserLocation({ city: e.target.value })
            }
          />

          <theme.Input
            label={t("timezone")}
            placeholder="Europe/Amsterdam"
            disabled={!webSearchOn}
            value={config?.web_search?.user_location?.timezone || ""}
            style={{ minWidth: 140 }}
            onChange={(e: any) =>
              updateUserLocation({ timezone: e.target.value })
            }
          />
        </div>

        <div style={twoColumnGrid}>
          <theme.Switch
            id="externalWebAccess"
            disabled={!webSearchOn}
            checked={config?.web_search?.external_web_access !== false}
            label={t("providers:openai.externalWebAccess")}
            onChange={(value) =>
              updateWebSearch({ external_web_access: value ? undefined : false })
            }
          />

          <theme.Switch
            id="includeSources"
            disabled={!webSearchOn}
            checked={config?.include?.includes("web_search_call.action.sources")}
            label={t("providers:openai.includeSources")}
            onChange={(value) =>
              toggleInclude("web_search_call.action.sources", !!value)
            }
          />
        </div>
      </div>
    </theme.Card>
  );
};
