import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";
import {
  AnthropicSharedToolFields,
  formatAnthropicStringList,
  parseAnthropicNumberInput,
  parseAnthropicStringList,
} from "./AnthropicToolCardShared";

const WEB_SEARCH_VERSIONS = [
  "web_search_20260318",
  "web_search_20260209",
  "web_search_20250305",
];

const createDefaultUserLocation = () => ({
  type: "approximate",
  timezone: "",
  country: "",
  region: "",
  city: "",
});

const createDefaultWebSearchTool = () => ({
  name: "web_search",
  type: WEB_SEARCH_VERSIONS[0],
  max_uses: 5,
  allowed_domains: null,
  blocked_domains: null,
  user_location: null,
  allowed_callers: ["direct"]
  //user_location: createDefaultUserLocation(),
});

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
  const tool = config?.web_search ?? createDefaultWebSearchTool();
  const userLocation = tool?.user_location;
  const supportsResponseInclusion = tool?.type === "web_search_20260318";

  return (
    <theme.Card
      size="small"
      title={t("webSearch")}
      headerActions={
        <theme.Switch
          id="webSearch"
          checked={webSearchOn}
          onChange={(checked: boolean) =>
            updateConfig({
              ...config,
              web_search: checked ? createDefaultWebSearchTool() : undefined,
            })
          }
        />
      }
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <AnthropicSharedToolFields
          idPrefix="anthropic-web-search"
          disabled={!webSearchOn}
          tool={tool}
          versions={WEB_SEARCH_VERSIONS}
          onVersionChange={(value: string) =>
            updateConfig({
              ...config,
              web_search: {
                ...tool,
                name: "web_search",
                type: value,
                response_inclusion:
                  value === "web_search_20260318"
                    ? tool?.response_inclusion
                    : undefined,
              },
            })
          }
          onChange={(nextTool: any) =>
            updateConfig({
              ...config,
              web_search: {
                ...nextTool,
                name: "web_search",
              },
            })
          }
        />

        <theme.Input
          type="number"
          label={t("providers:anthropic.maxUses")}
          disabled={!webSearchOn}
          value={tool?.max_uses ?? ""}
          onChange={(e: any) =>
            updateConfig({
              ...config,
              web_search: {
                ...tool,
                max_uses: parseAnthropicNumberInput(e.target.value),
              },
            })
          }
        />

        {supportsResponseInclusion ? (
          <theme.Select
            label={t("providers:anthropic.responseInclusion", "Response inclusion")}
            disabled={!webSearchOn}
            values={[tool?.response_inclusion ?? ""]}
            valueTitle={
              tool?.response_inclusion ?? t("providers:anthropic.defaultOption")
            }
            onChange={(value: string) =>
              updateConfig({
                ...config,
                web_search: {
                  ...tool,
                  response_inclusion: value || undefined,
                },
              })
            }
          >
            <option value="">{t("providers:anthropic.defaultOption")}</option>
            <option value="excluded">excluded</option>
          </theme.Select>
        ) : null}

        <theme.Input
          label={t("providers:anthropic.allowedDomains")}
          placeholder="domain1.com, domain2.com"
          disabled={!webSearchOn}
          value={formatAnthropicStringList(tool?.allowed_domains)}
          onChange={(e: any) =>
            updateConfig({
              ...config,
              web_search: {
                ...tool,
                allowed_domains: parseAnthropicStringList(e.target.value),
              },
            })
          }
        />

        <theme.Input
          label={t("providers:anthropic.blockedDomains")}
          placeholder="domain1.com, domain2.com"
          disabled={!webSearchOn}
          value={formatAnthropicStringList(tool?.blocked_domains)}
          onChange={(e: any) =>
            updateConfig({
              ...config,
              web_search: {
                ...tool,
                blocked_domains: parseAnthropicStringList(e.target.value),
              },
            })
          }
        />

        <theme.Switch
          id="anthropic-web-search-user-location"
          label={t("providers:anthropic.userLocation")}
          disabled={!webSearchOn}
          checked={!!userLocation}
          onChange={(checked: boolean) =>
            updateConfig({
              ...config,
              web_search: {
                ...tool,
                user_location: checked
                  ? userLocation ?? createDefaultUserLocation()
                  : undefined,
              },
            })
          }
        />

        {userLocation ? (
          <>
            <theme.Select
              label={t("providers:anthropic.locationType")}
              disabled={!webSearchOn}
              values={[userLocation?.type ?? "approximate"]}
              valueTitle={t("providers:anthropic.locationApproximate")}
              onChange={() =>
                updateConfig({
                  ...config,
                  web_search: {
                    ...tool,
                    user_location: {
                      ...userLocation,
                      type: "approximate",
                    },
                  },
                })
              }
            >
              <option value="approximate">
                {t("providers:anthropic.locationApproximate")}
              </option>
            </theme.Select>

            <div style={{ display: "flex", flexWrap: "wrap" }}>
              <theme.Input
                label={t("country")}
                disabled={!webSearchOn}
                value={userLocation.country ?? ""}
                style={{ minWidth: 120, flex: "1 1 160px" }}
                onChange={(e: any) =>
                  updateConfig({
                    ...config,
                    web_search: {
                      ...tool,
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
                style={{ minWidth: 120, flex: "1 1 160px" }}
                onChange={(e: any) =>
                  updateConfig({
                    ...config,
                    web_search: {
                      ...tool,
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
                style={{ minWidth: 120, flex: "1 1 160px" }}
                onChange={(e: any) =>
                  updateConfig({
                    ...config,
                    web_search: {
                      ...tool,
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
                style={{ minWidth: 140, flex: "1 1 180px" }}
                onChange={(e: any) =>
                  updateConfig({
                    ...config,
                    web_search: {
                      ...tool,
                      user_location: {
                        ...userLocation,
                        timezone: e.target.value,
                      },
                    },
                  })
                }
              />
            </div>
          </>
        ) : null}
      </div>
    </theme.Card>
  );
};
