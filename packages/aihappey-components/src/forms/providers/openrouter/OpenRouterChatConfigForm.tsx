import { useMemo } from "react";
import { useTranslation, type TFunction } from "aihappey-i18n";
import { useTheme } from "../../../theme/ThemeContext";
import { OpenRouterDelegationCard } from "./OpenRouterDelegationCard";
import { OpenRouterWebSearchCard } from "./OpenRouterWebSearchCard";
import { OpenRouterListInput, OpenRouterNumberInput, openRouterGrid, openRouterStack } from "./OpenRouterFields";
import {
  canonicalizeOpenRouterConfig,
  getOpenRouterTools,
  optionalString as normalizeOptionalString,
  pruneOpenRouterObject as pruneEmptyObject,
  setOpenRouterTools,
  withOpenRouterParameters as withToolParameters,
} from "./openRouterToolConfig";

const APP_ATTRIBUTION_HEADERS = {
  referer: "HTTP-Referer",
  title: "X-OpenRouter-Title",
  categories: "X-OpenRouter-Categories",
} as const;

const APP_ATTRIBUTION_HEADER_ALIASES = {
  referer: ["HTTP-Referer", "Referer"],
  title: ["X-OpenRouter-Title", "X-Openrouter-Title"],
  categories: ["X-OpenRouter-Categories", "X-Openrouter-Categories"],
} as const;

const APP_ATTRIBUTION_CATEGORIES = "general-chat,personal-agent";
const DEFAULT_APP_TITLE = "AIHappey";

const WEB_FETCH_ENGINES = ["", "auto", "native", "exa", "openrouter", "firecrawl"] as const;
const PDF_ENGINES = ["", "cloudflare-ai", "mistral-ocr", "native"] as const;
const OUTPUT_FORMATS = ["", "png", "jpeg", "webp"] as const;
const BACKGROUNDS = ["", "transparent", "opaque", "auto"] as const;
const QUALITIES = ["", "low", "medium", "high", "auto"] as const;
const MODERATION_LEVELS = ["", "auto", "low"] as const;

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
  Object.values(APP_ATTRIBUTION_HEADER_ALIASES)
    .flat()
    .forEach((header) => {
      delete nextHeaders[header];
    });
  return Object.keys(nextHeaders).length ? nextHeaders : undefined;
};

const optionItems = (values: readonly string[], notSetLabel: string) =>
  values.map((value) => ({ value, label: value || notSetLabel }));

const selectLabel = (value: string | undefined, notSetLabel: string) => value || notSetLabel;

const compactStack = openRouterStack;

const tk = (t: TFunction, key: string, fallback: string) =>
  t(`providers:openrouter.${key}`) ?? fallback;

export const OpenRouterChatConfigForm = ({
  config,
  headers,
  updateConfig,
  updateHeaders,
  appTitle,
}: {
  config: any;
  headers?: Record<string, string>;
  updateConfig: (val: any) => void;
  updateHeaders?: (val: Record<string, string> | undefined) => void;
  appTitle?: string;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const resolvedConfig = canonicalizeOpenRouterConfig(config);
  const submitConfig = (nextConfig: any) =>
    updateConfig(canonicalizeOpenRouterConfig(nextConfig));

  const webSearch = getOpenRouterTools(resolvedConfig, "openrouter:web_search")[0];
  const datetime = getOpenRouterTools(resolvedConfig, "openrouter:datetime")[0];
  const imageGeneration = getOpenRouterTools(resolvedConfig, "openrouter:image_generation")[0];
  const webFetch = getOpenRouterTools(resolvedConfig, "openrouter:web_fetch")[0];
  const searchModels = getOpenRouterTools(resolvedConfig, "openrouter:experimental__search_models")[0];
  const responseHealingPlugin = getPlugin(resolvedConfig, "response-healing");
  const contextCompressionPlugin = getPlugin(resolvedConfig, "context-compression");
  const fileParserPlugin = getPlugin(resolvedConfig, "file-parser");
  const appAttributionHeaders = useMemo(() => getAttributionHeaders(appTitle), [appTitle]);
  const appAttributionOn =
    !!headers?.[APP_ATTRIBUTION_HEADERS.referer] &&
    !!headers?.[APP_ATTRIBUTION_HEADERS.title] &&
    headers?.[APP_ATTRIBUTION_HEADERS.categories] === APP_ATTRIBUTION_CATEGORIES;

  const twoColumnGrid = openRouterGrid;

  const updateTool = (type: string, value: any) =>
    submitConfig(setOpenRouterTools(resolvedConfig, type, value ? [value] : []));

  const updateToolParameter = (type: string, tool: any, patch: Record<string, any>) => {
    if (tool) updateTool(type, withToolParameters(tool, patch));
  };

  const updateAppAttribution = (enabled: boolean) => {
    updateHeaders?.(
      enabled
        ? {
          ...(removeAttributionHeaders(headers) ?? {}),
          ...appAttributionHeaders,
        }
        : removeAttributionHeaders(headers)
    );
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

      <theme.Card size="small" title={tr("serverTools", "Server tools")}>
        <OpenRouterNumberInput label={tr("maxToolCalls", "Max tool calls")}
          value={resolvedConfig.max_tool_calls} max={30}
          onChange={max_tool_calls => {
            const nextConfig = { ...resolvedConfig };
            if (max_tool_calls === undefined) delete nextConfig.max_tool_calls;
            else nextConfig.max_tool_calls = max_tool_calls;
            submitConfig(nextConfig);
          }} />
      </theme.Card>

      <OpenRouterWebSearchCard tool={webSearch} onChange={tool => updateTool("openrouter:web_search", tool)} />

      <OpenRouterDelegationCard kind="advisor" config={resolvedConfig} updateConfig={submitConfig} />
      <OpenRouterDelegationCard kind="subagent" config={resolvedConfig} updateConfig={submitConfig} />

      <theme.Card size="small" title={tr("searchModelsServerTool", "Model search")}
        headerActions={<theme.Switch id="openrouterSearchModels" checked={!!searchModels}
          onChange={enabled => updateTool("openrouter:experimental__search_models",
            enabled ? { type: "openrouter:experimental__search_models" } : undefined)} />}>
        {searchModels && <OpenRouterNumberInput label={tr("maxResults", "Max results")}
          value={searchModels.parameters?.max_results} max={20}
          onChange={max_results => updateToolParameter("openrouter:experimental__search_models", searchModels, { max_results })} />}
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
            <OpenRouterNumberInput
              label={tr("maxUses", "Max uses")}
              disabled={!webFetch}
              value={webFetch?.parameters?.max_uses}
              onChange={(max_uses) =>
                updateToolParameter("openrouter:web_fetch", webFetch, {
                  max_uses,
                })
              }
            />
          </div>

          <OpenRouterNumberInput
            label={tr("maxContentTokens", "Max content tokens")}
            disabled={!webFetch}
            value={webFetch?.parameters?.max_content_tokens}
            onChange={(max_content_tokens) =>
              updateToolParameter("openrouter:web_fetch", webFetch, {
                max_content_tokens,
              })
            }
          />

          <div style={twoColumnGrid}>
            <OpenRouterListInput
              label={tr("allowedDomains", "Allowed domains")}
              placeholder="docs.example.com"
              disabled={!webFetch}
              value={webFetch?.parameters?.allowed_domains}
              onChange={(allowed_domains) =>
                updateToolParameter("openrouter:web_fetch", webFetch, {
                  allowed_domains,
                })
              }
            />
            <OpenRouterListInput
              label={tr("blockedDomains", "Blocked domains")}
              placeholder="private.example.com"
              disabled={!webFetch}
              value={webFetch?.parameters?.blocked_domains}
              onChange={(blocked_domains) =>
                updateToolParameter("openrouter:web_fetch", webFetch, {
                  blocked_domains,
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
            placeholder="openai/gpt-image-2.6-flare"
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
            <OpenRouterNumberInput
              label={tr("outputCompression", "Output compression")}
              min={0}
              max={100}
              integer={false}
              disabled={!imageGeneration}
              value={imageGeneration?.parameters?.output_compression}
              onChange={(output_compression) =>
                updateToolParameter("openrouter:image_generation", imageGeneration, {
                  output_compression,
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

