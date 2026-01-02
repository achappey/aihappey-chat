import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

const DEFAULT_WEB_SEARCH = {
  search_context_size: "medium",
  user_location: {
    country: "",
    region: "",
    city: "",
    timezone: "",
    type: "approximate",
  },
};

const CONTEXT_SIZES = ["low", "medium", "high"] as const;
type ContextSize = (typeof CONTEXT_SIZES)[number];

export const OpenAIWebSearchForm = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const webSearchOn = !!config?.web_search;

  const sizeToIndex = (s?: ContextSize) =>
    Math.max(0, CONTEXT_SIZES.indexOf((s ?? "medium") as ContextSize));

  const indexToSize = (i: number): ContextSize =>
    CONTEXT_SIZES[Math.min(CONTEXT_SIZES.length - 1, Math.max(0, i))];

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
      <div>
        <theme.Slider
          label={`${t("searchContextSize")} (${t(
            config?.web_search?.search_context_size ?? "medium",
            config?.web_search?.search_context_size ?? "medium"
          )})`}
          disabled={!webSearchOn}
          min={0}
          max={CONTEXT_SIZES.length - 1}
          step={1}
          value={sizeToIndex(config?.web_search?.search_context_size as ContextSize)}
          onChange={(i: number) =>
            updateConfig({
              ...config,
              web_search: {
                ...(config.web_search ?? {}),
                search_context_size: indexToSize(i),
                user_location:
                  config.web_search?.user_location ??
                  { ...DEFAULT_WEB_SEARCH.user_location },
              },
            })
          }
        />

        <div style={{ display: "flex", gap: 12 }}>
          <theme.Input
            label={t("country")}
            placeholder="NL"
            disabled={!webSearchOn}
            value={config?.web_search?.user_location?.country || ""}
            style={{ minWidth: 70 }}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                web_search: {
                  ...config.web_search,
                  user_location: {
                    ...(config.web_search?.user_location ?? {}),
                    country: e.target.value,
                  },
                },
              })
            }
          />
          <theme.Input
            label={t("region")}
            placeholder="Noord-Holland"
            disabled={!webSearchOn}
            value={config?.web_search?.user_location?.region || ""}
            style={{ minWidth: 110 }}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                web_search: {
                  ...config.web_search,
                  user_location: {
                    ...(config.web_search?.user_location ?? {}),
                    region: e.target.value,
                  },
                },
              })
            }
          />
          <theme.Input
            label={t("city")}
            placeholder="Amsterdam"
            disabled={!webSearchOn}
            value={config?.web_search?.user_location?.city || ""}
            style={{ minWidth: 110 }}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                web_search: {
                  ...config.web_search,
                  user_location: {
                    ...(config.web_search?.user_location ?? {}),
                    city: e.target.value,
                  },
                },
              })
            }
          />
          <theme.Input
            label={t("timezone")}
            placeholder="Europe/Amsterdam"
            disabled={!webSearchOn}
            value={config?.web_search?.user_location?.timezone || ""}
            style={{ minWidth: 140 }}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                web_search: {
                  ...config.web_search,
                  user_location: {
                    ...(config.web_search?.user_location ?? {}),
                    timezone: e.target.value,
                  },
                },
              })
            }
          />
        </div>

        <theme.Switch
          id="includeSources"
          disabled={!webSearchOn}
          checked={config?.include?.includes("web_search_call.action.sources")}
          label={t("providers:openai.includeSources", "includeSources")}
          onChange={(value) =>
            toggleInclude("web_search_call.action.sources", !!value)
          }
        />
      </div>
    </theme.Card>
  );
};

