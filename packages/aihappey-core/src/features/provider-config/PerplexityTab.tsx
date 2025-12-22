import { useTranslation } from "aihappey-i18n";
import { useTheme } from "aihappey-components";

const DEFAULT_WEB_SEARCH_OPTIONS = {
  search_context_size: "medium",
  user_location: {
    latitude: "",
    longitude: "",
    country: "",
  },
};

export const PerplexityTab = ({
  perplexity,
  updatePerplexity,
}: {
  perplexity: any;
  updatePerplexity: (val: any) => void;
}) => {
  const { t } = useTranslation();
  const theme = useTheme();



  const searchModeOptions = [
    { value: "web", label: t("perplexity.web") },
    { value: "academic", label: t("perplexity.academic") },
  ];
  const reasoningEffortOptions = [
    { value: "low", label: t("low") },
    { value: "medium", label: t("medium") },
    { value: "high", label: t("high") },
  ];
  const contextSizeOptions = [
    { value: "low", label: t("low") },
    { value: "medium", label: t("medium") },
    { value: "high", label: t("high") },
  ];

  const webSearchOptions = perplexity.web_search_options || {};
  const userLocation = webSearchOptions.user_location || {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* --- Card 1: Search settings --- */}
      <theme.Card size="small" title={t("webSearch")}>
        <div>
          <theme.Select
            label={t("searchMode")}
            values={[perplexity.search_mode || ""]}
            valueTitle={
              searchModeOptions.find((a) => a.value === perplexity.search_mode)
                ?.label
            }
            options={searchModeOptions}
            onChange={(val: string) =>
              updatePerplexity({ ...perplexity, search_mode: val })
            }
          >
            {searchModeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>

          <theme.Select
            label={t("searchContextSize")}
            disabled={!perplexity.web_search_options}
            values={[webSearchOptions.search_context_size || ""]}
            valueTitle={
              contextSizeOptions.find(
                (a) => a.value === webSearchOptions.search_context_size
              )?.label
            }
            options={contextSizeOptions}
            onChange={(val: string) =>
              updatePerplexity({
                ...perplexity,
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

          {/* Location */}
          <div style={{ display: "flex", gap: 12 }}>
            <theme.Input
              label={t("latitude")}
              type="number"
              disabled={!perplexity.web_search_options}
              style={{ minWidth: 70 }}
              value={userLocation.latitude ?? ""}
              onChange={(e: any) =>
                updatePerplexity({
                  ...perplexity,
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
              label={t("longitude")}
              type="number"
              disabled={!perplexity.web_search_options}
              style={{ minWidth: 70 }}
              value={userLocation.longitude ?? ""}
              onChange={(e: any) =>
                updatePerplexity({
                  ...perplexity,
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
              label={t("country")}
              disabled={!perplexity.web_search_options}
              style={{ minWidth: 70 }}
              value={userLocation.country ?? ""}
              onChange={(e: any) =>
                updatePerplexity({
                  ...perplexity,
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
            label={t("perplexity.improveImageRelevance")}
            checked={!!perplexity.web_search_options?.image_search_relevance_enhanced}
            onChange={(val) =>
              updatePerplexity({
                ...perplexity,
                web_search_options: {
                  ...webSearchOptions,
                  image_search_relevance_enhanced: val,
                },
              })
            }
          />
        </div>
      </theme.Card>

      <theme.Card size="small" title={t("perplexity.dateSearchSettings")}>
        <div>
          {/* Row 1: Recency filter */}
          <theme.Input
            label={t("perplexity.searchRecencyFilter")}
            placeholder="week, day, month..."
            value={perplexity.search_recency_filter ?? ""}
            onChange={(e: any) =>
              updatePerplexity({
                ...perplexity,
                search_recency_filter: e.target.value,
              })
            }
          />

          {/* Row 2: Published after/before */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",

            }}
          >
            <theme.Input
              label={t("perplexity.searchAfterDateFilter")}
              type="datetime-local"
              value={perplexity.search_after_date_filter ?? ""}
              onChange={(e: any) =>
                updatePerplexity({
                  ...perplexity,
                  search_after_date_filter: e.target.value,
                })
              }
              style={{ minWidth: 180 }}
            />
            <theme.Input
              label={t("perplexity.searchBeforeDateFilter")}
              type="datetime-local"
              value={perplexity.search_before_date_filter ?? ""}
              onChange={(e: any) =>
                updatePerplexity({
                  ...perplexity,
                  search_before_date_filter: e.target.value,
                })
              }
              style={{ minWidth: 180 }}
            />
          </div>

          {/* Row 3: Last updated after/before */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <theme.Input
              label={t("perplexity.lastUpdatedAfterFilter")}
              type="datetime-local"
              value={perplexity.last_updated_after_filter ?? ""}
              onChange={(e: any) =>
                updatePerplexity({
                  ...perplexity,
                  last_updated_after_filter: e.target.value,
                })
              }
              style={{ minWidth: 180 }}
            />
            <theme.Input
              label={t("perplexity.lastUpdatedBeforeFilter")}
              type="datetime-local"
              value={perplexity.last_updated_before_filter ?? ""}
              onChange={(e: any) =>
                updatePerplexity({
                  ...perplexity,
                  last_updated_before_filter: e.target.value,
                })
              }
              style={{ minWidth: 180 }}
            />
          </div>
        </div>
      </theme.Card>
      {/* --- Card 2: Sonar Deep Research --- */}
      <theme.Card size="small" title={t("perplexity.sonarDeepResearch")}>
        <div>
          <theme.Select
            label={t("reasoning")}
            disabled={!perplexity.reasoning_effort}
            values={[perplexity.reasoning_effort || ""]}
            valueTitle={
              reasoningEffortOptions.find(
                (a) => a.value === perplexity.reasoning_effort
              )?.label
            }
            options={reasoningEffortOptions}
            onChange={(val: string) =>
              updatePerplexity({ ...perplexity, reasoning_effort: val })
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
      {/* --- Extra switches --- */}
      <theme.Switch
        id="enableSearchClassifier"
        label={t("perplexity.enableSearchClassifier")}
        checked={!!perplexity.enable_search_classifier}
        onChange={(val) =>
          updatePerplexity({
            ...perplexity,
            enable_search_classifier: val,
          })
        }
      />
      <theme.Switch
        id="images"
        label={t("perplexity.returnImages")}
        checked={!!perplexity.return_images}
        onChange={() =>
          updatePerplexity({
            ...perplexity,
            return_images: !perplexity.return_images,
          })
        }
      />
      <theme.Switch
        id="videos"
        label={t("perplexity.returnVideos")}
        checked={!!perplexity.media_response?.return_videos}
        onChange={(val) =>
          updatePerplexity({
            ...perplexity,
            media_response: val ? {
              return_videos: true,
              return_images: perplexity.return_images
            } : undefined,
          })
        }
      />
      <theme.Switch
        id="questions"
        label={t("perplexity.returnRelatedQuestions")}
        checked={!!perplexity.return_related_questions}
        onChange={() =>
          updatePerplexity({
            ...perplexity,
            return_related_questions: !perplexity.return_related_questions,
          })
        }
      />
    </div>
  );
};
