import React, { useMemo, useState } from "react";
import { useTranslation } from "aihappey-i18n";
import type { TagItem } from "aihappey-types";

import { useTheme } from "../../../theme/ThemeContext";

const BROWSER_PROFILES = ["lite", "stealth"] as const;
const MAX_FETCH_URLS = 10;

type BrowserProfile = (typeof BROWSER_PROFILES)[number];

export type TinyFishAgentConfig = {
  url: string;
  browser_profile: BrowserProfile;
};

export type TinyFishFetchConfig = {
  urls: string[];
  links: boolean;
  image_links: boolean;
};

export type TinyFishChatConfig = {
  url?: string;
  browser_profile?: BrowserProfile;
  urls?: string[];
  links?: boolean;
  image_links?: boolean;
};

const DEFAULT_AGENT_CONFIG: TinyFishAgentConfig = {
  url: "",
  browser_profile: "lite",
};

const DEFAULT_FETCH_CONFIG: TinyFishFetchConfig = {
  urls: [],
  links: false,
  image_links: false,
};

const isBrowserProfile = (value: unknown): value is BrowserProfile =>
  typeof value === "string" && BROWSER_PROFILES.includes(value as BrowserProfile);

const normalizeUrl = (value: unknown): string => String(value ?? "").trim();

const normalizeUrlList = (value: unknown): string[] => {
  const rawUrls = Array.isArray(value) ? value : [];
  const seen = new Set<string>();
  const urls: string[] = [];

  for (const rawUrl of rawUrls) {
    const url = normalizeUrl(rawUrl);
    const key = url.toLowerCase();

    if (!url || seen.has(key) || urls.length >= MAX_FETCH_URLS) continue;

    seen.add(key);
    urls.push(url);
  }

  return urls;
};

/**
 * Keeps TinyFish metadata aligned with the backend contract. Agent and Fetch
 * are UI-only groupings: their enabled fields are written at the metadata root.
 */
export const normalizeTinyFishChatConfig = (
  config: Partial<TinyFishChatConfig> = {}
): TinyFishChatConfig => {
  const normalized: TinyFishChatConfig = {};
  const agentEnabled = config.url !== undefined || config.browser_profile !== undefined;
  const fetchEnabled = config.urls !== undefined
    || config.links !== undefined
    || config.image_links !== undefined;

  if (agentEnabled) {
    normalized.url = normalizeUrl(config.url);
    normalized.browser_profile = isBrowserProfile(config.browser_profile)
      ? config.browser_profile
      : DEFAULT_AGENT_CONFIG.browser_profile;
  }

  if (fetchEnabled) {
    normalized.urls = normalizeUrlList(config.urls);
    normalized.links = config.links === true;
    normalized.image_links = config.image_links === true;
  }

  return normalized;
};

export const TinyFishChatConfigForm = ({
  config,
  updateConfig,
}: {
  config: Partial<TinyFishChatConfig>;
  updateConfig: (config: TinyFishChatConfig) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [draftUrl, setDraftUrl] = useState("");
  const normalizedConfig = normalizeTinyFishChatConfig(config);
  const agentEnabled = normalizedConfig.url !== undefined
    || normalizedConfig.browser_profile !== undefined;
  const fetchEnabled = normalizedConfig.urls !== undefined
    || normalizedConfig.links !== undefined
    || normalizedConfig.image_links !== undefined;
  const fetchUrls = normalizedConfig.urls ?? [];
  const normalizedDraftUrl = normalizeUrl(draftUrl);
  const draftUrlExists = fetchUrls.some(
    (url) => url.toLowerCase() === normalizedDraftUrl.toLowerCase()
  );
  const canAddUrl = fetchEnabled
    && !!normalizedDraftUrl
    && !draftUrlExists
    && fetchUrls.length < MAX_FETCH_URLS;
  const fetchUrlItems: TagItem[] = useMemo(
    () => fetchUrls.map((url) => ({ key: url, label: url })),
    [fetchUrls]
  );

  const update = (nextConfig: Partial<TinyFishChatConfig>) =>
    updateConfig(normalizeTinyFishChatConfig(nextConfig));

  const updateAgent = (nextAgent: TinyFishAgentConfig) =>
    update({ ...normalizedConfig, ...nextAgent });

  const updateFetch = (nextFetch: TinyFishFetchConfig) =>
    update({ ...normalizedConfig, ...nextFetch });

  const addUrl = () => {
    if (!canAddUrl) return;

    updateFetch({
      links: normalizedConfig.links ?? DEFAULT_FETCH_CONFIG.links,
      image_links: normalizedConfig.image_links ?? DEFAULT_FETCH_CONFIG.image_links,
      urls: [...fetchUrls, normalizedDraftUrl],
    });
    setDraftUrl("");
  };

  const removeUrl = (urlToRemove: string) => {
    const normalizedUrlToRemove = normalizeUrl(urlToRemove).toLowerCase();
    updateFetch({
      links: normalizedConfig.links ?? DEFAULT_FETCH_CONFIG.links,
      image_links: normalizedConfig.image_links ?? DEFAULT_FETCH_CONFIG.image_links,
      urls: fetchUrls.filter((url) => url.toLowerCase() !== normalizedUrlToRemove),
    });
  };

  const browserProfileOptions = BROWSER_PROFILES.map((value) => ({
    value,
    label: t(`providers:tinyfish.browserProfile.${value}`, value[0].toUpperCase() + value.slice(1)),
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card
        size="small"
        title={t("providers:tinyfish.agent", "Agent")}
        headerActions={
          <theme.Switch
            id="tinyfish-agent"
            checked={agentEnabled}
            onChange={(enabled) => {
              if (enabled) {
                update({ ...normalizedConfig, ...DEFAULT_AGENT_CONFIG });
                return;
              }

              const { url, browser_profile, ...rest } = normalizedConfig;
              update(rest);
            }}
          />
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Input
            label={t("providers:tinyfish.url", "URL")}
            placeholder="https://example.com"
            disabled={!agentEnabled}
            value={normalizedConfig.url ?? ""}
            onChange={(event: any) =>
              updateAgent({
                browser_profile: normalizedConfig.browser_profile ?? DEFAULT_AGENT_CONFIG.browser_profile,
                url: normalizeUrl(event?.target?.value),
              })
            }
          />

          <theme.Select
            label={t("providers:tinyfish.browserProfile", "Browser profile")}
            disabled={!agentEnabled}
            values={[normalizedConfig.browser_profile ?? DEFAULT_AGENT_CONFIG.browser_profile]}
            valueTitle={
              browserProfileOptions.find(
                (option) => option.value === normalizedConfig.browser_profile
              )?.label ?? browserProfileOptions[0].label
            }
            options={browserProfileOptions}
            onChange={(browser_profile: string) =>
              updateAgent({
                url: normalizedConfig.url ?? DEFAULT_AGENT_CONFIG.url,
                browser_profile: browser_profile as BrowserProfile,
              })
            }
          >
            {browserProfileOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </theme.Select>
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={t("providers:tinyfish.fetch", "Fetch")}
        headerActions={
          <theme.Switch
            id="tinyfish-fetch"
            checked={fetchEnabled}
            onChange={(enabled) => {
              if (enabled) {
                update({ ...normalizedConfig, ...DEFAULT_FETCH_CONFIG });
                return;
              }

              const { urls, links, image_links, ...rest } = normalizedConfig;
              update(rest);
            }}
          />
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "end" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <theme.Input
                  label={t("providers:tinyfish.urls", "URLs")}
                  placeholder="https://example.com/article"
                  disabled={!fetchEnabled}
                  value={draftUrl}
                  onChange={(event: any) => setDraftUrl(String(event?.target?.value ?? ""))}
                  onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addUrl();
                    }
                  }}
                />
              </div>
              <theme.Button
                icon="add"
                size="small"
                title={t("add", "Add")}
                variant="informative"
                disabled={!canAddUrl}
                onClick={addUrl}
              >
                {t("add", "Add")}
              </theme.Button>
            </div>

            {fetchUrlItems.length > 0 ? (
              fetchEnabled ? (
                <theme.Tags size="small" items={fetchUrlItems} onRemove={removeUrl} />
              ) : (
                <theme.Tags size="small" items={fetchUrlItems} />
              )
            ) : (
              <div style={{ fontSize: 12, opacity: 0.72 }}>
                {t("providers:tinyfish.noUrls", "No URLs added yet.")}
              </div>
            )}
          </div>

          <theme.Switch
            id="tinyfish-fetch-links"
            label={t("providers:tinyfish.links", "Extract links")}
            disabled={!fetchEnabled}
            checked={normalizedConfig.links ?? false}
            onChange={(links) =>
              updateFetch({
                urls: fetchUrls,
                image_links: normalizedConfig.image_links ?? DEFAULT_FETCH_CONFIG.image_links,
                links,
              })
            }
          />

          <theme.Switch
            id="tinyfish-fetch-image-links"
            label={t("providers:tinyfish.imageLinks", "Extract image links")}
            disabled={!fetchEnabled}
            checked={normalizedConfig.image_links ?? false}
            onChange={(image_links) =>
              updateFetch({
                urls: fetchUrls,
                links: normalizedConfig.links ?? DEFAULT_FETCH_CONFIG.links,
                image_links,
              })
            }
          />
        </div>
      </theme.Card>
    </div>
  );
};
