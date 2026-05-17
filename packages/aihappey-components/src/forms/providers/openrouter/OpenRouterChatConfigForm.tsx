import { useMemo } from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../theme/ThemeContext";
import {
  buildCanonicalProviderToolsConfig,
  withResolvedProviderTools,
} from "../providerToolConfig";

const OPENROUTER_TOOL_TYPES = [
  "openrouter:web_search",
  "openrouter:datetime",
  "openrouter:image_generation",
  "openrouter:web_fetch",
];

const APP_ATTRIBUTION_HEADERS = {
  referer: "HTTP-Referer",
  title: "X-OpenRouter-Title",
  categories: "X-OpenRouter-Categories",
} as const;

const APP_ATTRIBUTION_CATEGORIES = "general-chat,personal-agent";
const DEFAULT_APP_TITLE = "AIHappey";

const WEB_SEARCH_ENGINES = ["", "auto", "native", "exa", "firecrawl", "parallel"] as const;
const WEB_FETCH_ENGINES = ["", "auto", "native", "exa", "openrouter", "firecrawl"] as const;
const SEARCH_CONTEXT_SIZES = ["", "low", "medium", "high"] as const;
const PDF_ENGINES = ["", "cloudflare-ai", "mistral-ocr", "native"] as const;
const OUTPUT_FORMATS = ["", "png", "jpeg", "webp"] as const;
const BACKGROUNDS = ["", "transparent", "opaque", "auto"] as const;
const QUALITIES = ["", "low", "medium", "high", "auto"] as const;
const MODERATION_LEVELS = ["", "auto", "low"] as const;

const normalizeOptionalString = (value: unknown) => {
  const trimmed = String(value ?? "").trim();
  return trimmed ? trimmed : undefined;
};

const parseOptionalInteger = (value: unknown) => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return undefined;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined;
};

const parseOptionalNumber = (value: unknown) => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return undefined;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseDomainList = (value: unknown) => {
  if (Array.isArray(value)) {
    const list = value
      .map((item) => normalizeOptionalString(item))
      .filter((item): item is string => !!item);
    return list.length ? Array.from(new Set(list)) : undefined;
  }

  const list = String(value ?? "")
    .split(/[\n,]+/)
    .map((item) => normalizeOptionalString(item))
    .filter((item): item is string => !!item);

  return list.length ? Array.from(new Set(list)) : undefined;
};

const serializeDomainList = (value: unknown) =>
  Array.isArray(value) ? value.filter(Boolean).join(", ") : "";

const pruneEmptyObject = <T extends Record<string, any>>(value: T) => {
  const entries = Object.entries(value).filter(([, item]) => {
    if (item === undefined || item === null || item === "") return false;
    if (Array.isArray(item)) return item.length > 0;
    if (typeof item === "object") return Object.keys(item).length > 0;
    return true;
  });

  return entries.length ? Object.fromEntries(entries) : undefined;
};

const withToolParameters = (tool: any, patch: Record<string, any>) => {
  const parameters = pruneEmptyObject({
    ...(tool?.parameters ?? {}),
    ...patch,
  });

  return {
    ...(tool ?? {}),
    parameters,
  };
};

const getPlugin = (config: any, id: string) => {
  const plugins = Array.isArray(config?.plugins) ? config.plugins : [];
  return plugins.find((plugin: any) => plugin?.id === id);
};

const setPlugin = (config: any, id: string, value: any) => {
  const plugins = Array.isArray(config?.plugins) ? config.plugins.filter(Boolean) : [];
  const nextPlugins = value
    ? [...plugins.filter((plugin: any) => plugin?.id !== id), { ...value, id }]
    : plugins.filter((plugin: any) => plugin?.id !== id);

  return {
    ...(config ?? {}),
    plugins: nextPlugins.length ? nextPlugins : undefined,
  };
};

const getBrowserOrigin = () => {
  if (typeof window === "undefined") return undefined;
  return window.location?.origin || undefined;
};

const getAttributionHeaders = (appTitle?: string) => ({
  [APP_ATTRIBUTION_HEADERS.referer]: getBrowserOrigin(),
  [APP_ATTRIBUTION_HEADERS.title]: normalizeOptionalString(appTitle) ?? DEFAULT_APP_TITLE,
  [APP_ATTRIBUTION_HEADERS.categories]: APP_ATTRIBUTION_CATEGORIES,
});

const removeAttributionHeaders = (headers: Record<string, any> | undefined) => {
  const nextHeaders = { ...(headers ?? {}) };
  delete nextHeaders[APP_ATTRIBUTION_HEADERS.referer];
  delete nextHeaders[APP_ATTRIBUTION_HEADERS.title];
  delete nextHeaders[APP_ATTRIBUTION_HEADERS.categories];
  return Object.keys(nextHeaders).length ? nextHeaders : undefined;
};

const optionItems = (values: readonly string[], notSetLabel: string) =>
  values.map((value) => ({ value, label: value || notSetLabel }));

const selectLabel = (value: string | undefined, notSetLabel: string) => value || notSetLabel;

const compactStack = { display: "flex", flexDirection: "column" } as const;

const tk = (t: (key: string, options?: any) => string, key: string, fallback: string) =>
  t(`providers:openrouter.${key}`) ?? fallback;

export const OpenRouterChatConfigForm = ({
  config,
  updateConfig,
  appTitle,
}: {
  config: any;
  updateConfig: (val: any) => void;
  appTitle?: string;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const resolvedConfig = withResolvedProviderTools(config, OPENROUTER_TOOL_TYPES);
  const submitConfig = (nextConfig: any) =>
    updateConfig(buildCanonicalProviderToolsConfig(nextConfig, OPENROUTER_TOOL_TYPES));

  const webSearch = resolvedConfig?.["openrouter:web_search"];
  const datetime = resolvedConfig?.["openrouter:datetime"];
  const imageGeneration = resolvedConfig?.["openrouter:image_generation"];
  const webFetch = resolvedConfig?.["openrouter:web_fetch"];
  const responseHealingPlugin = getPlugin(resolvedConfig, "response-healing");
  const contextCompressionPlugin = getPlugin(resolvedConfig, "context-compression");
  const fileParserPlugin = getPlugin(resolvedConfig, "file-parser");
  const appAttributionHeaders = useMemo(() => getAttributionHeaders(appTitle), [appTitle]);
  const appAttributionOn =
    !!resolvedConfig?.headers?.[APP_ATTRIBUTION_HEADERS.referer] &&
    !!resolvedConfig?.headers?.[APP_ATTRIBUTION_HEADERS.title] &&
    resolvedConfig?.headers?.[APP_ATTRIBUTION_HEADERS.categories] === APP_ATTRIBUTION_CATEGORIES;

  const twoColumnGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
    width: "100%",
    alignItems: "end",
  } as const;

  const updateTool = (type: string, value: any) =>
    submitConfig({
      ...resolvedConfig,
      [type]: value,
    });

  const updateToolParameter = (type: string, tool: any, patch: Record<string, any>) =>
    updateTool(type, withToolParameters(tool, patch));

  const updateAppAttribution = (enabled: boolean) => {
    submitConfig({
      ...resolvedConfig,
      headers: enabled
        ? {
          ...(resolvedConfig?.headers ?? {}),
          ...appAttributionHeaders,
        }
        : removeAttributionHeaders(resolvedConfig?.headers),
    });
  };

  const updateZdr = (enabled: boolean) => {
    const provider = pruneEmptyObject({
      ...(resolvedConfig?.provider ?? {}),
      zdr: enabled ? true : undefined,
    });

    submitConfig({
      ...resolvedConfig,
      provider,
    });
  };

  const updateResponseHealing = (enabled: boolean) => {
    submitConfig(
      setPlugin(resolvedConfig, "response-healing", enabled ? { id: "response-healing" } : undefined)
    );
  };

  const updateContextCompression = (enabled: boolean) => {
    submitConfig(
      setPlugin(resolvedConfig, "context-compression", enabled ? { id: "context-compression" } : undefined)
    );
  };

  const updateFileParser = (enabled: boolean) => {
    submitConfig(
      setPlugin(
        resolvedConfig,
        "file-parser",
        enabled ? { id: "file-parser", pdf: { engine: "cloudflare-ai" } } : undefined
      )
    );
  };

  const updateFileParserEngine = (engine: string) => {
    const pdf = pruneEmptyObject({
      ...(fileParserPlugin?.pdf ?? {}),
      engine: normalizeOptionalString(engine),
    });

    submitConfig(
      setPlugin(resolvedConfig, "file-parser", {
        ...(fileParserPlugin ?? {}),
        id: "file-parser",
        pdf,
      })
    );
  };

  const tr = (key: string, fallback: string) => tk(t, key, fallback);
  const notSetLabel = tr("notSet", "Not set");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card
        size="small"
        title={tr("appAttribution", "App attribution")}
        headerActions={
          <theme.Switch
            id="openrouterAppAttribution"
            checked={appAttributionOn}
            onChange={updateAppAttribution}
          />
        }
      >
      </theme.Card>

      <theme.Card
        size="small"
        title={tr("zdr", "Zero Data Retention")}
        headerActions={
          <theme.Switch
            id="openrouterZdr"
            checked={!!resolvedConfig?.provider?.zdr}
            onChange={updateZdr}
          />
        }
      >
      </theme.Card>

      <theme.Card
        size="small"
        title={tr("webSearchServerTool", "Web Search server tool")}
        headerActions={
          <theme.Switch
            id="openrouterWebSearch"
            checked={!!webSearch}
            onChange={(enabled) =>
              updateTool(
                "openrouter:web_search",
                enabled ? { type: "openrouter:web_search" } : undefined
              )
            }
          />
        }
      >
        <div style={compactStack}>
          <div style={twoColumnGrid}>
            <theme.Select
              label={tr("engine", "Engine")}
              disabled={!webSearch}
              values={[webSearch?.parameters?.engine ?? ""]}
              valueTitle={selectLabel(webSearch?.parameters?.engine, notSetLabel)}
              options={optionItems(WEB_SEARCH_ENGINES, notSetLabel)}
              onChange={(value: string) =>
                updateToolParameter("openrouter:web_search", webSearch, {
                  engine: normalizeOptionalString(value),
                })
              }
            >
              {WEB_SEARCH_ENGINES.map((value) => (
                <option key={value || "unset"} value={value}>{value || notSetLabel}</option>
              ))}
            </theme.Select>

            <theme.Select
              label={tr("searchContextSize", "Search context size")}
              disabled={!webSearch}
              values={[webSearch?.parameters?.search_context_size ?? ""]}
              valueTitle={selectLabel(webSearch?.parameters?.search_context_size, notSetLabel)}
              options={optionItems(SEARCH_CONTEXT_SIZES, notSetLabel)}
              onChange={(value: string) =>
                updateToolParameter("openrouter:web_search", webSearch, {
                  search_context_size: normalizeOptionalString(value),
                })
              }
            >
              {SEARCH_CONTEXT_SIZES.map((value) => (
                <option key={value || "unset"} value={value}>{value || notSetLabel}</option>
              ))}
            </theme.Select>
          </div>

          <div style={twoColumnGrid}>
            <theme.Input
              label={tr("maxResults", "Max results")}
              type="number"
              min={1}
              max={25}
              step={1}
              disabled={!webSearch}
              value={webSearch?.parameters?.max_results ?? ""}
              onChange={(e: any) =>
                updateToolParameter("openrouter:web_search", webSearch, {
                  max_results: parseOptionalInteger(e.target.value),
                })
              }
            />
            <theme.Input
              label={tr("maxTotalResults", "Max total results")}
              type="number"
              min={1}
              step={1}
              disabled={!webSearch}
              value={webSearch?.parameters?.max_total_results ?? ""}
              onChange={(e: any) =>
                updateToolParameter("openrouter:web_search", webSearch, {
                  max_total_results: parseOptionalInteger(e.target.value),
                })
              }
            />
          </div>

          <div style={twoColumnGrid}>
            <theme.Input
              label={tr("allowedDomains", "Allowed domains")}
              placeholder="example.com, docs.example.com"
              disabled={!webSearch}
              value={serializeDomainList(webSearch?.parameters?.allowed_domains)}
              onChange={(e: any) =>
                updateToolParameter("openrouter:web_search", webSearch, {
                  allowed_domains: parseDomainList(e.target.value),
                })
              }
            />
            <theme.Input
              label={tr("excludedDomains", "Excluded domains")}
              placeholder="reddit.com"
              disabled={!webSearch}
              value={serializeDomainList(webSearch?.parameters?.excluded_domains)}
              onChange={(e: any) =>
                updateToolParameter("openrouter:web_search", webSearch, {
                  excluded_domains: parseDomainList(e.target.value),
                })
              }
            />
          </div>

          <div style={twoColumnGrid}>
            <theme.Input
              label={tr("userCity", "User city")}
              placeholder="Amsterdam"
              disabled={!webSearch}
              value={webSearch?.parameters?.user_location?.city ?? ""}
              onChange={(e: any) => {
                const userLocation = pruneEmptyObject({
                  ...(webSearch?.parameters?.user_location ?? {}),
                  type: "approximate",
                  city: normalizeOptionalString(e.target.value),
                });
                updateToolParameter("openrouter:web_search", webSearch, { user_location: userLocation });
              }}
            />
            <theme.Input
              label={tr("userCountry", "User country")}
              placeholder="NL"
              disabled={!webSearch}
              value={webSearch?.parameters?.user_location?.country ?? ""}
              onChange={(e: any) => {
                const userLocation = pruneEmptyObject({
                  ...(webSearch?.parameters?.user_location ?? {}),
                  type: "approximate",
                  country: normalizeOptionalString(e.target.value),
                });
                updateToolParameter("openrouter:web_search", webSearch, { user_location: userLocation });
              }}
            />
          </div>

          <div style={twoColumnGrid}>
            <theme.Input
              label={tr("userRegion", "User region")}
              placeholder="Noord-Holland"
              disabled={!webSearch}
              value={webSearch?.parameters?.user_location?.region ?? ""}
              onChange={(e: any) => {
                const userLocation = pruneEmptyObject({
                  ...(webSearch?.parameters?.user_location ?? {}),
                  type: "approximate",
                  region: normalizeOptionalString(e.target.value),
                });
                updateToolParameter("openrouter:web_search", webSearch, { user_location: userLocation });
              }}
            />
            <theme.Input
              label={tr("userTimezone", "User timezone")}
              placeholder="Europe/Amsterdam"
              disabled={!webSearch}
              value={webSearch?.parameters?.user_location?.timezone ?? ""}
              onChange={(e: any) => {
                const userLocation = pruneEmptyObject({
                  ...(webSearch?.parameters?.user_location ?? {}),
                  type: "approximate",
                  timezone: normalizeOptionalString(e.target.value),
                });
                updateToolParameter("openrouter:web_search", webSearch, { user_location: userLocation });
              }}
            />
          </div>
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={tr("webFetchServerTool", "Web Fetch server tool")}
        headerActions={
          <theme.Switch
            id="openrouterWebFetch"
            checked={!!webFetch}
            onChange={(enabled) =>
              updateTool(
                "openrouter:web_fetch",
                enabled ? { type: "openrouter:web_fetch" } : undefined
              )
            }
          />
        }
      >
        <div style={compactStack}>
          <div style={twoColumnGrid}>
            <theme.Select
              label={tr("engine", "Engine")}
              disabled={!webFetch}
              values={[webFetch?.parameters?.engine ?? ""]}
              valueTitle={selectLabel(webFetch?.parameters?.engine, notSetLabel)}
              options={optionItems(WEB_FETCH_ENGINES, notSetLabel)}
              onChange={(value: string) =>
                updateToolParameter("openrouter:web_fetch", webFetch, {
                  engine: normalizeOptionalString(value),
                })
              }
            >
              {WEB_FETCH_ENGINES.map((value) => (
                <option key={value || "unset"} value={value}>{value || notSetLabel}</option>
              ))}
            </theme.Select>
            <theme.Input
              label={tr("maxUses", "Max uses")}
              type="number"
              min={1}
              step={1}
              disabled={!webFetch}
              value={webFetch?.parameters?.max_uses ?? ""}
              onChange={(e: any) =>
                updateToolParameter("openrouter:web_fetch", webFetch, {
                  max_uses: parseOptionalInteger(e.target.value),
                })
              }
            />
          </div>

          <theme.Input
            label={tr("maxContentTokens", "Max content tokens")}
            type="number"
            min={1}
            step={1}
            disabled={!webFetch}
            value={webFetch?.parameters?.max_content_tokens ?? ""}
            onChange={(e: any) =>
              updateToolParameter("openrouter:web_fetch", webFetch, {
                max_content_tokens: parseOptionalInteger(e.target.value),
              })
            }
          />

          <div style={twoColumnGrid}>
            <theme.Input
              label={tr("allowedDomains", "Allowed domains")}
              placeholder="docs.example.com"
              disabled={!webFetch}
              value={serializeDomainList(webFetch?.parameters?.allowed_domains)}
              onChange={(e: any) =>
                updateToolParameter("openrouter:web_fetch", webFetch, {
                  allowed_domains: parseDomainList(e.target.value),
                })
              }
            />
            <theme.Input
              label={tr("blockedDomains", "Blocked domains")}
              placeholder="private.example.com"
              disabled={!webFetch}
              value={serializeDomainList(webFetch?.parameters?.blocked_domains)}
              onChange={(e: any) =>
                updateToolParameter("openrouter:web_fetch", webFetch, {
                  blocked_domains: parseDomainList(e.target.value),
                })
              }
            />
          </div>
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={tr("datetimeServerTool", "Datetime server tool")}
        headerActions={
          <theme.Switch
            id="openrouterDatetime"
            checked={!!datetime}
            onChange={(enabled) =>
              updateTool(
                "openrouter:datetime",
                enabled ? { type: "openrouter:datetime" } : undefined
              )
            }
          />
        }
      >
        <div>
          <theme.Input
            label={tr("timezone", "Timezone")}
            placeholder="Europe/Amsterdam"
            disabled={!datetime}
            value={datetime?.parameters?.timezone ?? ""}
            onChange={(e: any) =>
              updateToolParameter("openrouter:datetime", datetime, {
                timezone: normalizeOptionalString(e.target.value),
              })
            }
          />
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={tr("imageGenerationServerTool", "Image Generation server tool")}
        headerActions={
          <theme.Switch
            id="openrouterImageGeneration"
            checked={!!imageGeneration}
            onChange={(enabled) =>
              updateTool(
                "openrouter:image_generation",
                enabled ? { type: "openrouter:image_generation" } : undefined
              )
            }
          />
        }
      >
        <div style={compactStack}>
          <theme.Input
            label={tr("imageModel", "Image model")}
            placeholder="openai/gpt-image-1"
            disabled={!imageGeneration}
            value={imageGeneration?.parameters?.model ?? ""}
            onChange={(e: any) =>
              updateToolParameter("openrouter:image_generation", imageGeneration, {
                model: normalizeOptionalString(e.target.value),
              })
            }
          />

          <div style={twoColumnGrid}>
            <theme.Select
              label={tr("quality", "Quality")}
              disabled={!imageGeneration}
              values={[imageGeneration?.parameters?.quality ?? ""]}
              valueTitle={selectLabel(imageGeneration?.parameters?.quality, notSetLabel)}
              options={optionItems(QUALITIES, notSetLabel)}
              onChange={(value: string) =>
                updateToolParameter("openrouter:image_generation", imageGeneration, {
                  quality: normalizeOptionalString(value),
                })
              }
            >
              {QUALITIES.map((value) => (
                <option key={value || "unset"} value={value}>{value || notSetLabel}</option>
              ))}
            </theme.Select>
            <theme.Input
              label={tr("size", "Size")}
              placeholder="1024x1024"
              disabled={!imageGeneration}
              value={imageGeneration?.parameters?.size ?? ""}
              onChange={(e: any) =>
                updateToolParameter("openrouter:image_generation", imageGeneration, {
                  size: normalizeOptionalString(e.target.value),
                })
              }
            />
          </div>

          <div style={twoColumnGrid}>
            <theme.Input
              label={tr("aspectRatio", "Aspect ratio")}
              placeholder="16:9"
              disabled={!imageGeneration}
              value={imageGeneration?.parameters?.aspect_ratio ?? ""}
              onChange={(e: any) =>
                updateToolParameter("openrouter:image_generation", imageGeneration, {
                  aspect_ratio: normalizeOptionalString(e.target.value),
                })
              }
            />
            <theme.Select
              label={tr("background", "Background")}
              disabled={!imageGeneration}
              values={[imageGeneration?.parameters?.background ?? ""]}
              valueTitle={selectLabel(imageGeneration?.parameters?.background, notSetLabel)}
              options={optionItems(BACKGROUNDS, notSetLabel)}
              onChange={(value: string) =>
                updateToolParameter("openrouter:image_generation", imageGeneration, {
                  background: normalizeOptionalString(value),
                })
              }
            >
              {BACKGROUNDS.map((value) => (
                <option key={value || "unset"} value={value}>{value || notSetLabel}</option>
              ))}
            </theme.Select>
          </div>

          <div style={twoColumnGrid}>
            <theme.Select
              label={tr("outputFormat", "Output format")}
              disabled={!imageGeneration}
              values={[imageGeneration?.parameters?.output_format ?? ""]}
              valueTitle={selectLabel(imageGeneration?.parameters?.output_format, notSetLabel)}
              options={optionItems(OUTPUT_FORMATS, notSetLabel)}
              onChange={(value: string) =>
                updateToolParameter("openrouter:image_generation", imageGeneration, {
                  output_format: normalizeOptionalString(value),
                })
              }
            >
              {OUTPUT_FORMATS.map((value) => (
                <option key={value || "unset"} value={value}>{value || notSetLabel}</option>
              ))}
            </theme.Select>
            <theme.Input
              label={tr("outputCompression", "Output compression")}
              type="number"
              min={0}
              max={100}
              step={1}
              disabled={!imageGeneration}
              value={imageGeneration?.parameters?.output_compression ?? ""}
              onChange={(e: any) =>
                updateToolParameter("openrouter:image_generation", imageGeneration, {
                  output_compression: parseOptionalNumber(e.target.value),
                })
              }
            />
          </div>

          <theme.Select
            label={tr("moderation", "Moderation")}
            disabled={!imageGeneration}
            values={[imageGeneration?.parameters?.moderation ?? ""]}
            valueTitle={selectLabel(imageGeneration?.parameters?.moderation, notSetLabel)}
            options={optionItems(MODERATION_LEVELS, notSetLabel)}
            onChange={(value: string) =>
              updateToolParameter("openrouter:image_generation", imageGeneration, {
                moderation: normalizeOptionalString(value),
              })
            }
          >
            {MODERATION_LEVELS.map((value) => (
              <option key={value || "unset"} value={value}>{value || notSetLabel}</option>
            ))}
          </theme.Select>
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={tr("responseHealingPlugin", "responseHealingPlugin")}
        headerActions={
          <theme.Switch
            id="openrouterResponseHealing"
            checked={!!responseHealingPlugin}
            onChange={updateResponseHealing}
          />
        }
      >

      </theme.Card>

      <theme.Card
        size="small"
        title={tr("contextCompressionPlugin", "contextCompressionPlugin")}
        headerActions={
          <theme.Switch
            id="openrouterContextCompression"
            checked={!!contextCompressionPlugin}
            onChange={updateContextCompression}
          />
        }
      >

      </theme.Card>

      <theme.Card
        size="small"
        title={tr("pdfInputsPlugin", "PDF Inputs plugin")}
        headerActions={
          <theme.Switch
            id="openrouterPdfInputs"
            checked={!!fileParserPlugin}
            onChange={updateFileParser}
          />
        }
      >
        <div>
          <theme.Select
            label={tr("pdfEngine", "PDF engine")}
            disabled={!fileParserPlugin}
            values={[fileParserPlugin?.pdf?.engine ?? ""]}
            valueTitle={selectLabel(fileParserPlugin?.pdf?.engine, notSetLabel)}
            options={optionItems(PDF_ENGINES, notSetLabel)}
            onChange={updateFileParserEngine}
          >
            {PDF_ENGINES.map((value) => (
              <option key={value || "unset"} value={value}>{value || notSetLabel}</option>
            ))}
          </theme.Select>
        </div>
      </theme.Card>
    </div>
  );
};

