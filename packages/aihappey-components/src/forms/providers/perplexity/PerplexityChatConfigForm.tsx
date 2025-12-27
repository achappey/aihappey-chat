// PerplexityChatConfigForm.tsx

import { useTheme } from "../../../theme/ThemeContext";

const DEFAULT_WEB_SEARCH_OPTIONS = {
  search_context_size: "medium",
  user_location: {
    latitude: "",
    longitude: "",
    country: "",
  },
};

export type PerplexityChatConfigFormTranslations = {
  webSearch?: string;

  searchMode?: string;
  searchContextSize?: string;
  latitude?: string;
  longitude?: string;
  country?: string;

  low?: string;
  medium?: string;
  high?: string;

  dateSearchSettings?: string;
  searchRecencyFilter?: string;
  searchAfterDateFilter?: string;
  searchBeforeDateFilter?: string;
  lastUpdatedAfterFilter?: string;
  lastUpdatedBeforeFilter?: string;

  sonarDeepResearch?: string;
  reasoning?: string;

  enableSearchClassifier?: string;
  returnImages?: string;
  returnVideos?: string;
  returnRelatedQuestions?: string;

  improveImageRelevance?: string;

  web?: string;
  academic?: string;
};

export const PerplexityChatConfigForm = ({
  config,
  updateConfig,
  translations,
}: {
  config: any;
  updateConfig: (val: any) => void;
  translations?: PerplexityChatConfigFormTranslations;
}) => {
  const theme = useTheme();

  const searchModeOptions = [
    { value: "web", label: translations?.web ?? "web" },
    { value: "academic", label: translations?.academic ?? "academic" },
  ];

  const reasoningEffortOptions = [
    { value: "low", label: translations?.low ?? "low" },
    { value: "medium", label: translations?.medium ?? "medium" },
    { value: "high", label: translations?.high ?? "high" },
  ];

  const contextSizeOptions = [
    { value: "low", label: translations?.low ?? "low" },
    { value: "medium", label: translations?.medium ?? "medium" },
    { value: "high", label: translations?.high ?? "high" },
  ];

  const webSearchOptions = config?.web_search_options || {};
  const userLocation = webSearchOptions.user_location || {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={translations?.webSearch ?? "webSearch"}>
        <div>
          <theme.Select
            label={translations?.searchMode ?? "searchMode"}
            values={[config?.search_mode || ""]}
            valueTitle={
              searchModeOptions.find((a) => a.value === config?.search_mode)?.label
            }
            options={searchModeOptions}
            onChange={(val: string) =>
              updateConfig({ ...config, search_mode: val })
            }
          >
            {searchModeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>

          <theme.Select
            label={translations?.searchContextSize ?? "searchContextSize"}
            disabled={!config?.web_search_options}
            values={[webSearchOptions.search_context_size || ""]}
            valueTitle={
              contextSizeOptions.find(
                (a) => a.value === webSearchOptions.search_context_size
              )?.label
            }
            options={contextSizeOptions}
            onChange={(val: string) =>
              updateConfig({
                ...config,
                web_search_options: {
                  ...webSearchOptions,
                  search_context_size: val,
                  user_location: userLocation,
                },
              })
            }
          >
            {contextSizeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>

          <div style={{ display: "flex", gap: 12 }}>
            <theme.Input
              label={translations?.latitude ?? "latitude"}
              type="number"
              disabled={!config?.web_search_options}
              style={{ minWidth: 70 }}
              value={userLocation.latitude ?? ""}
              onChange={(e: any) =>
                updateConfig({
                  ...config,
                  web_search_options: {
                    ...webSearchOptions,
                    user_location: {
                      ...userLocation,
                      latitude: e.target.value,
                    },
                  },
                })
              }
            />
            <theme.Input
              label={translations?.longitude ?? "longitude"}
              type="number"
              disabled={!config?.web_search_options}
              style={{ minWidth: 70 }}
              value={userLocation.longitude ?? ""}
              onChange={(e: any) =>
                updateConfig({
                  ...config,
                  web_search_options: {
                    ...webSearchOptions,
                    user_location: {
                      ...userLocation,
                      longitude: e.target.value,
                    },
                  },
                })
              }
            />
            <theme.Input
              label={translations?.country ?? "country"}
              disabled={!config?.web_search_options}
              style={{ minWidth: 70 }}
              value={userLocation.country ?? ""}
              onChange={(e: any) =>
                updateConfig({
                  ...config,
                  web_search_options: {
                    ...webSearchOptions,
                    user_location: {
                      ...userLocation,
                      country: e.target.value,
                    },
                  },
                })
              }
            />
          </div>

          <theme.Switch
            id="image_search_relevance_enhanced"
            label={translations?.improveImageRelevance ?? "improveImageRelevance"}
            checked={!!config?.web_search_options?.image_search_relevance_enhanced}
            onChange={(val) =>
              updateConfig({
                ...config,
                web_search_options: {
                  ...webSearchOptions,
                  image_search_relevance_enhanced: val,
                },
              })
            }
          />
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={translations?.dateSearchSettings ?? "dateSearchSettings"}
      >
        <div>
          <theme.Input
            label={translations?.searchRecencyFilter ?? "searchRecencyFilter"}
            placeholder="week, day, month..."
            value={config?.search_recency_filter ?? ""}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                search_recency_filter: e.target.value,
              })
            }
          />

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <theme.Input
              label={translations?.searchAfterDateFilter ?? "searchAfterDateFilter"}
              type="datetime-local"
              value={config?.search_after_date_filter ?? ""}
              onChange={(e: any) =>
                updateConfig({
                  ...config,
                  search_after_date_filter: e.target.value,
                })
              }
              style={{ minWidth: 180 }}
            />
            <theme.Input
              label={
                translations?.searchBeforeDateFilter ?? "searchBeforeDateFilter"
              }
              type="datetime-local"
              value={config?.search_before_date_filter ?? ""}
              onChange={(e: any) =>
                updateConfig({
                  ...config,
                  search_before_date_filter: e.target.value,
                })
              }
              style={{ minWidth: 180 }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <theme.Input
              label={
                translations?.lastUpdatedAfterFilter ?? "lastUpdatedAfterFilter"
              }
              type="datetime-local"
              value={config?.last_updated_after_filter ?? ""}
              onChange={(e: any) =>
                updateConfig({
                  ...config,
                  last_updated_after_filter: e.target.value,
                })
              }
              style={{ minWidth: 180 }}
            />
            <theme.Input
              label={
                translations?.lastUpdatedBeforeFilter ?? "lastUpdatedBeforeFilter"
              }
              type="datetime-local"
              value={config?.last_updated_before_filter ?? ""}
              onChange={(e: any) =>
                updateConfig({
                  ...config,
                  last_updated_before_filter: e.target.value,
                })
              }
              style={{ minWidth: 180 }}
            />
          </div>
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={translations?.sonarDeepResearch ?? "sonarDeepResearch"}
      >
        <div>
          <theme.Select
            label={translations?.reasoning ?? "reasoning"}
            disabled={!config?.reasoning_effort}
            values={[config?.reasoning_effort || ""]}
            valueTitle={
              reasoningEffortOptions.find(
                (a) => a.value === config?.reasoning_effort
              )?.label
            }
            options={reasoningEffortOptions}
            onChange={(val: string) =>
              updateConfig({ ...config, reasoning_effort: val })
            }
          >
            {reasoningEffortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>
        </div>
      </theme.Card>

      <theme.Switch
        id="enableSearchClassifier"
        label={translations?.enableSearchClassifier ?? "enableSearchClassifier"}
        checked={!!config?.enable_search_classifier}
        onChange={(val) =>
          updateConfig({
            ...config,
            enable_search_classifier: val,
          })
        }
      />

      <theme.Switch
        id="images"
        label={translations?.returnImages ?? "returnImages"}
        checked={!!config?.return_images}
        onChange={() =>
          updateConfig({
            ...config,
            return_images: !config?.return_images,
          })
        }
      />

      <theme.Switch
        id="videos"
        label={translations?.returnVideos ?? "returnVideos"}
        checked={!!config?.media_response?.return_videos}
        onChange={(val) =>
          updateConfig({
            ...config,
            media_response: val
              ? {
                  return_videos: true,
                  return_images: config?.return_images,
                }
              : undefined,
          })
        }
      />

      <theme.Switch
        id="questions"
        label={translations?.returnRelatedQuestions ?? "returnRelatedQuestions"}
        checked={!!config?.return_related_questions}
        onChange={() =>
          updateConfig({
            ...config,
            return_related_questions: !config?.return_related_questions,
          })
        }
      />
    </div>
  );
};
