import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";

const DEFAULT_WEB_FETCH = {
  max_uses: 5,
  allowed_domains: [],
  blocked_domains: [],
  citations: {
    enabled: true,
  },
};

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
              web_fetch: !checked ? undefined : { ...DEFAULT_WEB_FETCH },
            })
          }
        />
      }
    >
      <div>
        <theme.Input
          type="number"
          label={t("providers:anthropic.maxUses")}
          disabled={!webFetchOn}
          value={config?.web_fetch?.max_uses ?? ""}
          onChange={(e: any) =>
            updateConfig({
              ...config,
              web_fetch: {
                ...config.web_fetch,
                max_uses: parseInt(e.target.value, 10),
              },
            })
          }
        />

        <theme.Input
          label={t("providers:anthropic.allowedDomains")}
          placeholder="domain1.com, domain2.com"
          disabled={!webFetchOn}
          value={(config?.web_fetch?.allowed_domains || []).join(", ")}
          onChange={(e: any) =>
            updateConfig({
              ...config,
              web_fetch: {
                ...config.web_fetch,
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
          disabled={!webFetchOn}
          value={(config?.web_fetch?.blocked_domains || []).join(", ")}
          onChange={(e: any) =>
            updateConfig({
              ...config,
              web_fetch: {
                ...config.web_fetch,
                blocked_domains: e.target.value
                  .split(",")
                  .map((s: string) => s.trim())
                  .filter(Boolean),
              },
            })
          }
        />

        <theme.Switch
          id="citations"
          label={t("citations")}
          disabled={!webFetchOn}
          checked={config?.web_fetch?.citations?.enabled}
          onChange={(checked) =>
            updateConfig({
              ...config,
              web_fetch: {
                ...config.web_fetch,
                citations: checked ? { enabled: true } : undefined,
              },
            })
          }
        />
      </div>
    </theme.Card>
  );
};
