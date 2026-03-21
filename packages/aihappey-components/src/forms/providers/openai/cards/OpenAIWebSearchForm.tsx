import { useTheme } from "../../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";

const DEFAULT_WEB_SEARCH = {
  user_location: {
    country: "",
    region: "",
    city: "",
    timezone: "",
    type: "approximate",
  },
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

  const webSearchOn = !!config?.web_search;

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

