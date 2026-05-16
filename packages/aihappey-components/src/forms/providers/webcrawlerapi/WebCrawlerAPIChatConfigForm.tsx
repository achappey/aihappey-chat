import { useTranslation } from "aihappey-i18n";
import { useMemo, useState } from "react";
import { useTheme } from "../../../theme/ThemeContext";

export type WebCrawlerAPIChatConfig = {
  max_spend_usd?: number;
  urls?: string[];
  seed_urls_only?: boolean;
};

const normalizeUrl = (value: unknown) => String(value ?? "").trim();

const normalizeUrlList = (value: unknown): string[] => {
  const rawItems = Array.isArray(value) ? value : [];
  const seen = new Set<string>();
  const urls: string[] = [];

  for (const item of rawItems) {
    const url = normalizeUrl(item);
    const key = url.toLowerCase();
    if (!url || seen.has(key)) continue;
    seen.add(key);
    urls.push(url);
  }

  return urls;
};

const toOptionalUrlList = (value: unknown) => {
  const urls = normalizeUrlList(value);
  return urls.length > 0 ? urls : undefined;
};

const parsePositiveNumber = (value: unknown) => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return undefined;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

export const WebCrawlerAPIChatConfigForm = ({
  config,
  updateConfig,
}: {
  config: WebCrawlerAPIChatConfig;
  updateConfig: (val: WebCrawlerAPIChatConfig) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [draftUrl, setDraftUrl] = useState("");
  const urls = useMemo(() => normalizeUrlList(config?.urls), [config?.urls]);
  const normalizedDraftUrl = normalizeUrl(draftUrl);
  const draftUrlExists = urls.some(
    (url) => url.toLowerCase() === normalizedDraftUrl.toLowerCase()
  );

  const setConfigValue = <K extends keyof WebCrawlerAPIChatConfig>(
    key: K,
    value: WebCrawlerAPIChatConfig[K] | undefined
  ) => {
    const nextConfig = { ...(config ?? {}) };

    if (value === undefined || value === false) {
      delete nextConfig[key];
    } else {
      nextConfig[key] = value;
    }

    updateConfig(nextConfig);
  };

  const addUrl = () => {
    if (!normalizedDraftUrl || draftUrlExists) return;
    setConfigValue("urls", toOptionalUrlList([...urls, normalizedDraftUrl]));
    setDraftUrl("");
  };

  const removeUrl = (index: number) => {
    const nextUrls = urls.filter((_, i) => i !== index);
    const nextConfig = { ...(config ?? {}) };

    if (nextUrls.length > 0) {
      nextConfig.urls = nextUrls;
    } else {
      delete nextConfig.urls;
      delete nextConfig.seed_urls_only;
    }

    updateConfig(nextConfig);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card
        size="small"
        title={t("providers:webcrawlerapi.costs", "Costs")}
      >
        <div>
          <theme.Input
            label={t("providers:webcrawlerapi.maxSpendUsd", "Maximum spend (USD)")}
            type="number"
            min={0.01}
            required
            step="0.01"
            value={config?.max_spend_usd ?? ""}
            onChange={(e: any) =>
              setConfigValue("max_spend_usd", parsePositiveNumber(e?.target?.value))
            }
          />
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={t("providers:webcrawlerapi.sources", "Sources")}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "end" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <theme.Input
                  label={t("providers:webcrawlerapi.urls", "Seed URLs")}
                  placeholder="https://example.com/products"
                  value={draftUrl}
                  onChange={(e: any) => setDraftUrl(String(e?.target?.value ?? ""))}
                  onKeyDown={(e: any) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addUrl();
                    }
                  }}
                />
              </div>

              <theme.Button
                icon="add"
                size="small"
                title={t("add")}
                variant="informative"
                disabled={!normalizedDraftUrl || draftUrlExists}
                onClick={addUrl}
              >
                {t("add")}
              </theme.Button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {urls.map((url, index) => (
                <div
                  key={`${url}-${index}`}
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    justifyContent: "space-between",
                    border: "1px solid rgba(0,0,0,0.08)",
                    borderRadius: 10,
                    padding: "8px 10px",
                  }}
                >
                  <div
                    title={url}
                    style={{
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontSize: 13,
                    }}
                  >
                    {url}
                  </div>

                  <theme.Button
                    icon="delete"
                    size="small"
                    variant="danger"
                    title={t("delete")}
                    onClick={() => removeUrl(index)}
                  />
                </div>
              ))}
            </div>
          </div>

          <theme.Switch
            id="webcrawlerapiSeedUrlsOnly"
            disabled={urls.length < 1}
            checked={!!config?.seed_urls_only}
            label={t("providers:webcrawlerapi.seedUrlsOnly", "Use URLs only")}
            size="small"
            onChange={(value) =>
              setConfigValue("seed_urls_only", value ? true : undefined)
            }
          />
        </div>
      </theme.Card>
    </div>
  );
};

