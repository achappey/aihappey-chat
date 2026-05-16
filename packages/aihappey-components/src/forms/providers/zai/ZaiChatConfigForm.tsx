import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import {
  buildCanonicalProviderToolsConfig,
  withResolvedProviderTools,
} from "../providerToolConfig";

const ZAI_TOOL_TYPES = ["web_search"];
const THINKING_TYPES = ["enabled", "disabled"] as const;
const SEARCH_ENGINE_OPTIONS = ["search_pro_jina"] as const;
const SEARCH_RECENCY_FILTER_OPTIONS = [
  "oneDay",
  "oneWeek",
  "oneMonth",
  "oneYear",
  "noLimit",
] as const;
const CONTENT_SIZE_OPTIONS = ["medium", "high"] as const;
const RESULT_SEQUENCE_OPTIONS = ["before", "after"] as const;

type ThinkingType = (typeof THINKING_TYPES)[number];
type SearchEngine = (typeof SEARCH_ENGINE_OPTIONS)[number];
type SearchRecencyFilter = (typeof SEARCH_RECENCY_FILTER_OPTIONS)[number];
type ContentSize = (typeof CONTENT_SIZE_OPTIONS)[number];
type ResultSequence = (typeof RESULT_SEQUENCE_OPTIONS)[number];

export type ZaiChatConfig = {
  thinking?: {
    type?: ThinkingType;
    clear_thinking?: boolean;
  };
  tool_stream?: boolean;
  tools?: Array<{
    type: "web_search";
    web_search: {
      enable?: boolean;
      search_engine: SearchEngine;
      search_query: string;
      count?: number;
      search_domain_filter?: string;
      search_recency_filter?: SearchRecencyFilter;
      content_size?: ContentSize;
      result_sequence?: ResultSequence;
      search_result?: boolean;
      require_search?: boolean;
      search_prompt?: string;
    };
  }>;
};

const DEFAULT_THINKING: Required<NonNullable<ZaiChatConfig["thinking"]>> = {
  type: "enabled",
  clear_thinking: true,
};

const DEFAULT_WEB_SEARCH = {
  type: "web_search" as const,
  web_search: {
    enable: true,
    search_engine: "search_pro_jina" as const,
    search_query: "",
    count: 10,
    search_recency_filter: "noLimit" as const,
    content_size: "medium" as const,
    result_sequence: "after" as const,
    search_result: false,
    require_search: false,
  },
};

const twoColumnGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
  width: "100%",
  alignItems: "end",
} as const;

const fullWidthGridItem = { gridColumn: "1 / -1" } as const;

const normalizeNumberInput = (value: string, min: number, max: number) => {
  const raw = String(value ?? "").trim();
  if (!raw) return undefined;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return undefined;

  return Math.min(max, Math.max(min, Math.trunc(parsed)));
};

const optionalString = (value: string) => {
  const trimmed = String(value ?? "").trim();
  return trimmed ? trimmed : undefined;
};

export const ZaiChatConfigForm = ({
  config,
  updateConfig,
}: {
  config: ZaiChatConfig;
  updateConfig: (val: ZaiChatConfig) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const resolvedConfig = withResolvedProviderTools(config, ZAI_TOOL_TYPES);
  const submitConfig = (nextConfig: any) =>
    updateConfig(buildCanonicalProviderToolsConfig(nextConfig, ZAI_TOOL_TYPES));

  const thinkingOn = !!resolvedConfig?.thinking;
  const webSearchOn = !!resolvedConfig?.web_search;
  const webSearch = {
    ...DEFAULT_WEB_SEARCH.web_search,
    ...(resolvedConfig?.web_search?.web_search ?? {}),
    enable: true,
  };
  const thinkingType = (resolvedConfig?.thinking?.type ?? DEFAULT_THINKING.type) as ThinkingType;

  const updateThinking = (patch: Partial<NonNullable<ZaiChatConfig["thinking"]>>) =>
    submitConfig({
      ...resolvedConfig,
      thinking: {
        ...(resolvedConfig?.thinking ?? DEFAULT_THINKING),
        ...patch,
      },
    });

  const updateWebSearch = (patch: Record<string, any>) =>
    submitConfig({
      ...resolvedConfig,
      web_search: {
        ...(resolvedConfig?.web_search ?? DEFAULT_WEB_SEARCH),
        type: "web_search",
        web_search: {
          ...(resolvedConfig?.web_search?.web_search ?? DEFAULT_WEB_SEARCH.web_search),
          ...patch,
          enable: true,
          search_engine:
            patch.search_engine ??
            resolvedConfig?.web_search?.web_search?.search_engine ??
            DEFAULT_WEB_SEARCH.web_search.search_engine,
        },
      },
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card
        size="small"
        title={t("reasoning")}
        headerActions={
          <theme.Switch
            id="zaiThinking"
            checked={thinkingOn}
            onChange={(value) =>
              submitConfig({
                ...resolvedConfig,
                thinking: value ? { ...DEFAULT_THINKING } : undefined,
              })
            }
          />
        }
      >
        <div style={twoColumnGrid}>
          <theme.Select
            label={t("type") ?? "Type"}
            disabled={!thinkingOn}
            values={[thinkingType]}
            valueTitle={t(`providers:zai.thinkingTypes.${thinkingType}`, thinkingType)}
            options={THINKING_TYPES.map((value) => ({
              value,
              label: t(`providers:zai.thinkingTypes.${value}`, value),
            }))}
            onChange={(value: string) => updateThinking({ type: value as ThinkingType })}
          >
            {THINKING_TYPES.map((value) => (
              <option key={value} value={value}>
                {t(`providers:zai.thinkingTypes.${value}`, value)}
              </option>
            ))}
          </theme.Select>

          <theme.Switch
            id="zaiClearThinking"
            disabled={!thinkingOn}
            checked={resolvedConfig?.thinking?.clear_thinking !== false}
            label={t("providers:zai.clearThinking")}
            onChange={(value) => updateThinking({ clear_thinking: !!value })}
          />
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={t("webSearch")}
        headerActions={
          <theme.Switch
            id="zaiWebSearch"
            checked={webSearchOn}
            onChange={(value) =>
              submitConfig({
                ...resolvedConfig,
                web_search: value
                  ? {
                      ...DEFAULT_WEB_SEARCH,
                      web_search: {
                        ...DEFAULT_WEB_SEARCH.web_search,
                        enable: true,
                      },
                    }
                  : undefined,
              })
            }
          />
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={twoColumnGrid}>
            <theme.Input
              id="zaiWebSearchQuery"
              required
              disabled={!webSearchOn}
              label={t("providers:zai.searchQuery")}
              placeholder={t("providers:zai.searchQueryPlaceholder")}
              value={webSearch?.search_query ?? ""}
              onChange={(e: any) => updateWebSearch({ search_query: String(e?.target?.value ?? "") })}
            />

            <theme.Select
              label={t("providers:zai.searchEngine")}
              disabled={!webSearchOn}
              values={[webSearch?.search_engine ?? DEFAULT_WEB_SEARCH.web_search.search_engine]}
              valueTitle={t(
                `providers:zai.searchEngines.${
                  webSearch?.search_engine ?? DEFAULT_WEB_SEARCH.web_search.search_engine
                }`,
                webSearch?.search_engine ?? DEFAULT_WEB_SEARCH.web_search.search_engine
              )}
              options={SEARCH_ENGINE_OPTIONS.map((value) => ({
                value,
                label: t(`providers:zai.searchEngines.${value}`, value),
              }))}
              onChange={(value: string) => updateWebSearch({ search_engine: value })}
            >
              {SEARCH_ENGINE_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {t(`providers:zai.searchEngines.${value}`, value)}
                </option>
              ))}
            </theme.Select>

            <theme.Input
              type="number"
              min={1}
              max={50}
              step={1}
              label={t("providers:zai.resultCount")}
              disabled={!webSearchOn}
              value={webSearch?.count ?? ""}
              onChange={(e: any) =>
                updateWebSearch({
                  count: normalizeNumberInput(e?.target?.value, 1, 50),
                })
              }
            />

            <theme.Select
              label={t("providers:zai.recencyFilter")}
              disabled={!webSearchOn}
              values={[webSearch?.search_recency_filter ?? "noLimit"]}
              valueTitle={t(
                `providers:zai.recencyFilters.${webSearch?.search_recency_filter ?? "noLimit"}`,
                webSearch?.search_recency_filter ?? "noLimit"
              )}
              options={SEARCH_RECENCY_FILTER_OPTIONS.map((value) => ({
                value,
                label: t(`providers:zai.recencyFilters.${value}`, value),
              }))}
              onChange={(value: string) =>
                updateWebSearch({ search_recency_filter: value as SearchRecencyFilter })
              }
            >
              {SEARCH_RECENCY_FILTER_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {t(`providers:zai.recencyFilters.${value}`, value)}
                </option>
              ))}
            </theme.Select>

            <theme.Select
              label={t("providers:zai.contentSize")}
              disabled={!webSearchOn}
              values={[webSearch?.content_size ?? "medium"]}
              valueTitle={t(
                `providers:zai.contentSizes.${webSearch?.content_size ?? "medium"}`,
                webSearch?.content_size ?? "medium"
              )}
              options={CONTENT_SIZE_OPTIONS.map((value) => ({
                value,
                label: t(`providers:zai.contentSizes.${value}`, value),
              }))}
              onChange={(value: string) => updateWebSearch({ content_size: value as ContentSize })}
            >
              {CONTENT_SIZE_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {t(`providers:zai.contentSizes.${value}`, value)}
                </option>
              ))}
            </theme.Select>

            <theme.Select
              label={t("providers:zai.resultSequence")}
              disabled={!webSearchOn}
              values={[webSearch?.result_sequence ?? "after"]}
              valueTitle={t(
                `providers:zai.resultSequences.${webSearch?.result_sequence ?? "after"}`,
                webSearch?.result_sequence ?? "after"
              )}
              options={RESULT_SEQUENCE_OPTIONS.map((value) => ({
                value,
                label: t(`providers:zai.resultSequences.${value}`, value),
              }))}
              onChange={(value: string) =>
                updateWebSearch({ result_sequence: value as ResultSequence })
              }
            >
              {RESULT_SEQUENCE_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {t(`providers:zai.resultSequences.${value}`, value)}
                </option>
              ))}
            </theme.Select>

            <theme.Input
              label={t("providers:zai.domainFilter")}
              placeholder="www.example.com"
              disabled={!webSearchOn}
              value={webSearch?.search_domain_filter ?? ""}
              onChange={(e: any) =>
                updateWebSearch({ search_domain_filter: optionalString(e?.target?.value) })
              }
            />

            <theme.Switch
              id="zaiSearchResult"
              disabled={!webSearchOn}
              checked={!!webSearch?.search_result}
              label={t("providers:zai.returnSearchResults")}
              onChange={(value) => updateWebSearch({ search_result: !!value })}
            />

            <theme.Switch
              id="zaiRequireSearch"
              disabled={!webSearchOn}
              checked={!!webSearch?.require_search}
              label={t("providers:zai.requireSearchGrounding")}
              onChange={(value) => updateWebSearch({ require_search: !!value })}
            />

            <div style={fullWidthGridItem}>
              <theme.TextArea
                label={t("providers:zai.searchPrompt")}
                placeholder={t("providers:zai.searchPromptPlaceholder")}
                rows={5}
                value={webSearch?.search_prompt ?? ""}
                onChange={(value) => updateWebSearch({ search_prompt: optionalString(value) })}
              />
            </div>
          </div>
        </div>
      </theme.Card>

      <theme.Card size="small" title={t("other")}>
        <theme.Switch
          id="zaiToolStream"
          checked={!!resolvedConfig?.tool_stream}
          label={t("providers:zai.toolStream")}
          onChange={(value) =>
            submitConfig({
              ...resolvedConfig,
              tool_stream: !!value,
            })
          }
        />
      </theme.Card>
    </div>
  );
};

