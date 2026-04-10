import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";
import {
  AnthropicSharedToolFields,
  formatAnthropicStringList,
  parseAnthropicNumberInput,
  parseAnthropicStringList,
} from "./AnthropicToolCardShared";

const WEB_FETCH_VERSIONS = [
  "web_fetch_20260309",
  "web_fetch_20260209",
  "web_fetch_20250910",
];

const createDefaultWebFetchTool = () => ({
  name: "web_fetch",
  type: WEB_FETCH_VERSIONS[0],
  max_uses: 5,
  allowed_domains: null,
  blocked_domains: null,
  citations: {
    enabled: true,
  },
});

export const AnthropicWebFetchCard = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const webFetchOn = !!config?.web_fetch;
  const tool = config?.web_fetch ?? createDefaultWebFetchTool();
  const supportsUseCache = tool?.type === "web_fetch_20260309";

  return (
    <theme.Card
      size="small"
      title={t("webFetch")}
      headerActions={
        <theme.Switch
          id="webFetch"
          checked={webFetchOn}
          onChange={(checked) =>
            updateConfig({
              ...config,
              web_fetch: checked ? createDefaultWebFetchTool() : undefined,
            })
          }
        />
      }
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <AnthropicSharedToolFields
          idPrefix="anthropic-web-fetch"
          disabled={!webFetchOn}
          tool={tool}
          versions={WEB_FETCH_VERSIONS}
          onVersionChange={(value: string) =>
            updateConfig({
              ...config,
              web_fetch: {
                ...tool,
                name: "web_fetch",
                type: value,
                use_cache:
                  value === "web_fetch_20260309" ? tool?.use_cache : undefined,
              },
            })
          }
          onChange={(nextTool: any) =>
            updateConfig({
              ...config,
              web_fetch: {
                ...nextTool,
                name: "web_fetch",
              },
            })
          }
        />

        <theme.Input
          type="number"
          label={t("providers:anthropic.maxUses")}
          disabled={!webFetchOn}
          value={tool?.max_uses ?? ""}
          onChange={(e: any) =>
            updateConfig({
              ...config,
              web_fetch: {
                ...tool,
                max_uses: parseAnthropicNumberInput(e.target.value),
              },
            })
          }
        />

        <theme.Input
          type="number"
          label={t("providers:anthropic.maxContentTokens")}
          disabled={!webFetchOn}
          value={tool?.max_content_tokens ?? ""}
          onChange={(e: any) =>
            updateConfig({
              ...config,
              web_fetch: {
                ...tool,
                max_content_tokens: parseAnthropicNumberInput(e.target.value),
              },
            })
          }
        />

        <theme.Input
          label={t("providers:anthropic.allowedDomains")}
          placeholder="domain1.com, domain2.com"
          disabled={!webFetchOn}
          value={formatAnthropicStringList(tool?.allowed_domains)}
          onChange={(e: any) =>
            updateConfig({
              ...config,
              web_fetch: {
                ...tool,
                allowed_domains: parseAnthropicStringList(e.target.value),
              },
            })
          }
        />

        <theme.Input
          label={t("providers:anthropic.blockedDomains")}
          placeholder="domain1.com, domain2.com"
          disabled={!webFetchOn}
          value={formatAnthropicStringList(tool?.blocked_domains)}
          onChange={(e: any) =>
            updateConfig({
              ...config,
              web_fetch: {
                ...tool,
                blocked_domains: parseAnthropicStringList(e.target.value),
              },
            })
          }
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: supportsUseCache
              ? "repeat(2, minmax(0, 1fr))"
              : "minmax(0, 1fr)",
            width: "100%",
            alignItems: "start",
          }}
        >
          <theme.Switch
            id="citations"
            label={t("providers:anthropic.citations")}
            size="small"
            disabled={!webFetchOn}
            checked={!!tool?.citations?.enabled}
            onChange={(checked) =>
              updateConfig({
                ...config,
                web_fetch: {
                  ...tool,
                  citations: checked ? { enabled: true } : undefined,
                },
              })
            }
          />

          {supportsUseCache ? (
            <theme.Switch
              id="anthropic-web-fetch-use-cache"
              label={t("providers:anthropic.useCache")}
              size="small"
              disabled={!webFetchOn}
              checked={!!tool?.use_cache}
              onChange={(checked: boolean) =>
                updateConfig({
                  ...config,
                  web_fetch: {
                    ...tool,
                    use_cache: checked,
                  },
                })
              }
            />
          ) : null}
        </div>
      </div>
    </theme.Card>
  );
};
