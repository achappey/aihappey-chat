import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";

const DEFAULT_WEB_SEARCH = {
  max_uses: 5,
  allowed_domains: [],
  blocked_domains: [],
  user_location: {
    timezone: "",
    country: "",
    region: "",
    city: "",
  },
};

export const AnthropicWebSearchCard = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const webSearchOn = !!config?.web_search;
  const userLocation = config?.web_search?.user_location || {};

  return (
    <theme.Card
      size="small"
      title={t("webSearch")}
      headerActions={
        <theme.Switch
          id="webSearch"
          checked={webSearchOn}
          onChange={() =>
            updateConfig({
              ...config,
              web_search: webSearchOn ? undefined : { ...DEFAULT_WEB_SEARCH },
            })
          }
        />
      }
    >
      <div>
        <theme.Input
          type="number"
          label={t("providers:anthropic.maxUses")}
          disabled={!webSearchOn}
          value={config?.web_search?.max_uses ?? ""}
          onChange={(e: any) =>
            updateConfig({
              ...config,
              web_search: {
                ...config.web_search,
                max_uses: parseInt(e.target.value, 10),
              },
            })
          }
        />

        <theme.Input
          label={t("providers:anthropic.allowedDomains")}
          placeholder="domain1.com, domain2.com"
          disabled={!webSearchOn}
          value={(config?.web_search?.allowed_domains || []).join(", ")}
          onChange={(e: any) =>
            updateConfig({
              ...config,
              web_search: {
                ...config.web_search,
                allowed_domains: e.target.value
                  .split(",")
                  .map((s: string) => s.trim())
                  .filter(Boolean),
              },
            })
          }
        />

        <theme.Input
          label={t("providers:anthropic.blockedDomains")}
          placeholder="domain1.com, domain2.com"
          disabled={!webSearchOn}
          value={(config?.web_search?.blocked_domains || []).join(", ")}
          onChange={(e: any) =>
            updateConfig({
              ...config,
              web_search: {
                ...config.web_search,
                blocked_domains: e.target.value
                  .split(",")
                  .map((s: string) => s.trim())
                  .filter(Boolean),
              },
            })
          }
        />

        <div style={{ display: "flex", gap: 12 }}>
          <theme.Input
            label={t("country")}
            disabled={!webSearchOn}
            value={userLocation.country ?? ""}
            style={{ minWidth: 70 }}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                web_search: {
                  ...config.web_search,
                  user_location: {
                    ...userLocation,
                    country: e.target.value,
                  },
                },
              })
            }
          />
          <theme.Input
            label={t("region")}
            disabled={!webSearchOn}
            value={userLocation.region ?? ""}
            style={{ minWidth: 110 }}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                web_search: {
                  ...config.web_search,
                  user_location: {
                    ...userLocation,
                    region: e.target.value,
                  },
                },
              })
            }
          />
          <theme.Input
            label={t("city")}
            disabled={!webSearchOn}
            value={userLocation.city ?? ""}
            style={{ minWidth: 110 }}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                web_search: {
                  ...config.web_search,
                  user_location: {
                    ...userLocation,
                    city: e.target.value,
                  },
                },
              })
            }
          />
          <theme.Input
            label={t("timezone")}
            disabled={!webSearchOn}
            value={userLocation.timezone ?? ""}
            style={{ minWidth: 140 }}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                web_search: {
                  ...config.web_search,
                  user_location: {
                    ...userLocation,
                    timezone: e.target.value,
                  },
                },
              })
            }
          />
        </div>
      </div>
    </theme.Card>
  );
};
