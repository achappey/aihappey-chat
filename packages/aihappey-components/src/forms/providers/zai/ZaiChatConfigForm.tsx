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
const TRANSLATION_SOURCE_LANGUAGE_OPTIONS = [
  "auto",
  "zh-CN",
  "zh-TW",
  "wyw",
  "yue",
  "en",
  "ja",
  "ko",
  "fr",
  "de",
  "es",
  "ru",
  "pt",
  "it",
  "ar",
  "hi",
  "bg",
  "cs",
  "da",
  "el",
  "et",
  "fi",
  "hu",
  "id",
  "lt",
  "lv",
  "nl",
  "no",
  "pl",
  "ro",
  "sk",
  "sl",
  "sv",
  "th",
  "tr",
  "uk",
  "vi",
  "my",
  "ms",
  "Pinyin",
  "IPA",
] as const;
const TRANSLATION_TARGET_LANGUAGE_OPTIONS = [
  "zh-CN",
  "zh-TW",
  "wyw",
  "yue",
  "en",
  "en-GB",
  "en-US",
  "ja",
  "ko",
  "fr",
  "de",
  "es",
  "ru",
  "pt",
  "it",
  "ar",
  "hi",
  "bg",
  "cs",
  "da",
  "el",
  "et",
  "fi",
  "hu",
  "id",
  "lt",
  "lv",
  "nl",
  "no",
  "pl",
  "ro",
  "sk",
  "sl",
  "sv",
  "th",
  "tr",
  "uk",
  "vi",
  "my",
  "ms",
  "Pinyin",
  "IPA",
] as const;
const TRANSLATION_STRATEGY_OPTIONS = [
  "general",
  "paraphrase",
  "two_step",
  "three_step",
  "reflection",
  "cot",
] as const;
const TRANSLATION_REASON_LANGUAGE_OPTIONS = ["from", "to"] as const;
const VIDEO_TEMPLATE_OPTIONS = ["french_kiss", "bodyshake", "sexy_me"] as const;

const TRANSLATION_LANGUAGE_LABELS: Record<
  (typeof TRANSLATION_SOURCE_LANGUAGE_OPTIONS)[number] | (typeof TRANSLATION_TARGET_LANGUAGE_OPTIONS)[number],
  string
> = {
  auto: "Auto Detect",
  "zh-CN": "Simplified Chinese",
  "zh-TW": "Traditional Chinese",
  wyw: "Classical Chinese",
  yue: "Cantonese",
  en: "English",
  "en-GB": "English (British)",
  "en-US": "English (American)",
  ja: "Japanese",
  ko: "Korean",
  fr: "French",
  de: "German",
  es: "Spanish",
  ru: "Russian",
  pt: "Portuguese",
  it: "Italian",
  ar: "Arabic",
  hi: "Hindi",
  bg: "Bulgarian",
  cs: "Czech",
  da: "Danish",
  el: "Greek",
  et: "Estonian",
  fi: "Finnish",
  hu: "Hungarian",
  id: "Indonesian",
  lt: "Lithuanian",
  lv: "Latvian",
  nl: "Dutch",
  no: "Norwegian Bokmål",
  pl: "Polish",
  ro: "Romanian",
  sk: "Slovak",
  sl: "Slovenian",
  sv: "Swedish",
  th: "Thai",
  tr: "Turkish",
  uk: "Ukrainian",
  vi: "Vietnamese",
  my: "Burmese",
  ms: "Malay",
  Pinyin: "Pinyin",
  IPA: "International Phonetic Alphabet",
};

const VIDEO_TEMPLATE_LABELS: Record<(typeof VIDEO_TEMPLATE_OPTIONS)[number], string> = {
  french_kiss: "French Kiss",
  bodyshake: "Body Shake Dance",
  sexy_me: "Sexy Me",
};

type ThinkingType = (typeof THINKING_TYPES)[number];
type SearchEngine = (typeof SEARCH_ENGINE_OPTIONS)[number];
type SearchRecencyFilter = (typeof SEARCH_RECENCY_FILTER_OPTIONS)[number];
type ContentSize = (typeof CONTENT_SIZE_OPTIONS)[number];
type ResultSequence = (typeof RESULT_SEQUENCE_OPTIONS)[number];
type TranslationSourceLanguage = (typeof TRANSLATION_SOURCE_LANGUAGE_OPTIONS)[number];
type TranslationTargetLanguage = (typeof TRANSLATION_TARGET_LANGUAGE_OPTIONS)[number];
type TranslationStrategy = (typeof TRANSLATION_STRATEGY_OPTIONS)[number];
type TranslationReasonLanguage = (typeof TRANSLATION_REASON_LANGUAGE_OPTIONS)[number];
type VideoTemplate = (typeof VIDEO_TEMPLATE_OPTIONS)[number];

type ZaiTranslationCustomVariables = {
  source_lang?: TranslationSourceLanguage;
  target_lang?: TranslationTargetLanguage;
  glossary?: string;
  strategy?: TranslationStrategy;
  strategy_config?: {
    general?: {
      suggestion?: string;
    };
    cot?: {
      reason_lang?: TranslationReasonLanguage;
    };
  };
};

type ZaiVideoTemplateCustomVariables = {
  template?: VideoTemplate;
};

type ZaiAgentCustomVariables = ZaiTranslationCustomVariables | ZaiVideoTemplateCustomVariables;

export type ZaiChatConfig = {
  thinking?: {
    type?: ThinkingType;
    clear_thinking?: boolean;
  };
  custom_variables?: ZaiAgentCustomVariables;
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

const DEFAULT_TRANSLATION_CUSTOM_VARIABLES: Required<
  Pick<ZaiTranslationCustomVariables, "source_lang" | "target_lang" | "strategy">
> = {
  source_lang: "auto",
  target_lang: "en",
  strategy: "general",
};

const DEFAULT_VIDEO_TEMPLATE_CUSTOM_VARIABLES: Required<ZaiVideoTemplateCustomVariables> = {
  template: "french_kiss",
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

const isVideoTemplateCustomVariables = (
  customVariables?: ZaiAgentCustomVariables
): customVariables is ZaiVideoTemplateCustomVariables => !!customVariables && "template" in customVariables;

const isVideoTemplate = (value?: string): value is VideoTemplate =>
  VIDEO_TEMPLATE_OPTIONS.includes(value as VideoTemplate);

const normalizeTranslationCustomVariables = (
  customVariables?: ZaiTranslationCustomVariables
): ZaiTranslationCustomVariables => {
  const strategy = customVariables?.strategy ?? DEFAULT_TRANSLATION_CUSTOM_VARIABLES.strategy;
  const glossary = optionalString(customVariables?.glossary ?? "");
  const suggestion = optionalString(customVariables?.strategy_config?.general?.suggestion ?? "");
  const strategyConfig: NonNullable<ZaiTranslationCustomVariables["strategy_config"]> = {};

  if (strategy === "general" && suggestion) {
    strategyConfig.general = { suggestion };
  }

  if (strategy === "cot") {
    strategyConfig.cot = {
      reason_lang: customVariables?.strategy_config?.cot?.reason_lang ?? "to",
    };
  }

  return {
    source_lang: customVariables?.source_lang ?? DEFAULT_TRANSLATION_CUSTOM_VARIABLES.source_lang,
    target_lang: customVariables?.target_lang ?? DEFAULT_TRANSLATION_CUSTOM_VARIABLES.target_lang,
    ...(glossary ? { glossary } : {}),
    strategy,
    ...(Object.keys(strategyConfig).length ? { strategy_config: strategyConfig } : {}),
  };
};

const normalizeVideoTemplateCustomVariables = (
  customVariables?: ZaiVideoTemplateCustomVariables
): Required<ZaiVideoTemplateCustomVariables> => ({
  template: isVideoTemplate(customVariables?.template)
    ? customVariables.template
    : DEFAULT_VIDEO_TEMPLATE_CUSTOM_VARIABLES.template,
});

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
  const submitConfig = (nextConfig: any) => {
    const canonicalConfig = buildCanonicalProviderToolsConfig(nextConfig, ZAI_TOOL_TYPES);

    if (canonicalConfig.custom_variables === undefined) {
      delete canonicalConfig.custom_variables;
    }

    updateConfig(canonicalConfig);
  };

  const thinkingOn = !!resolvedConfig?.thinking;
  const webSearchOn = !!resolvedConfig?.web_search;
  const videoTemplateOn = isVideoTemplateCustomVariables(resolvedConfig?.custom_variables);
  const translationOn = !!resolvedConfig?.custom_variables && !videoTemplateOn;
  const webSearch = {
    ...DEFAULT_WEB_SEARCH.web_search,
    ...(resolvedConfig?.web_search?.web_search ?? {}),
    enable: true,
  };
  const translationCustomVariables = normalizeTranslationCustomVariables(
    resolvedConfig?.custom_variables ?? DEFAULT_TRANSLATION_CUSTOM_VARIABLES
  );
  const videoTemplateCustomVariables = normalizeVideoTemplateCustomVariables(
    isVideoTemplateCustomVariables(resolvedConfig?.custom_variables)
      ? resolvedConfig.custom_variables
      : DEFAULT_VIDEO_TEMPLATE_CUSTOM_VARIABLES
  );
  const thinkingType = (resolvedConfig?.thinking?.type ?? DEFAULT_THINKING.type) as ThinkingType;

  const translationLanguageLabel = (value: string) =>
    t(
      `providers:zai.translationLanguages.${value}`,
      TRANSLATION_LANGUAGE_LABELS[value as keyof typeof TRANSLATION_LANGUAGE_LABELS] ?? value
    );

  const videoTemplateLabel = (value: string) =>
    t(
      `providers:zai.videoTemplates.${value}`,
      VIDEO_TEMPLATE_LABELS[value as keyof typeof VIDEO_TEMPLATE_LABELS] ?? value
    );

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

  const updateTranslationCustomVariables = (patch: ZaiTranslationCustomVariables) =>
    submitConfig({
      ...resolvedConfig,
      custom_variables: normalizeTranslationCustomVariables({
        ...translationCustomVariables,
        ...patch,
        strategy_config: {
          ...(translationCustomVariables.strategy_config ?? {}),
          ...(patch.strategy_config ?? {}),
        },
      }),
    });

  const updateVideoTemplateCustomVariables = (patch: ZaiVideoTemplateCustomVariables) =>
    submitConfig({
      ...resolvedConfig,
      custom_variables: normalizeVideoTemplateCustomVariables({
        ...videoTemplateCustomVariables,
        ...patch,
      }),
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
                `providers:zai.searchEngines.${webSearch?.search_engine ?? DEFAULT_WEB_SEARCH.web_search.search_engine
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

      <theme.Card
        size="small"
        title={t("providers:zai.generalTranslation")}
        headerActions={
          <theme.Switch
            id="zaiGeneralTranslation"
            checked={translationOn}
            onChange={(value) =>
              submitConfig({
                ...resolvedConfig,
                custom_variables: value ? { ...DEFAULT_TRANSLATION_CUSTOM_VARIABLES } : undefined,
              })
            }
          />
        }
      >
        <div style={twoColumnGrid}>
          <theme.Select
            label={t("providers:zai.sourceLanguage")}
            disabled={!translationOn}
            values={[translationCustomVariables.source_lang ?? DEFAULT_TRANSLATION_CUSTOM_VARIABLES.source_lang]}
            valueTitle={translationLanguageLabel(
              translationCustomVariables.source_lang ?? DEFAULT_TRANSLATION_CUSTOM_VARIABLES.source_lang
            )}
            options={TRANSLATION_SOURCE_LANGUAGE_OPTIONS.map((value) => ({
              value,
              label: translationLanguageLabel(value),
            }))}
            onChange={(value: string) =>
              updateTranslationCustomVariables({ source_lang: value as TranslationSourceLanguage })
            }
          >
            {TRANSLATION_SOURCE_LANGUAGE_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {translationLanguageLabel(value)}
              </option>
            ))}
          </theme.Select>

          <theme.Select
            label={t("providers:zai.targetLanguage")}
            disabled={!translationOn}
            values={[translationCustomVariables.target_lang ?? DEFAULT_TRANSLATION_CUSTOM_VARIABLES.target_lang]}
            valueTitle={translationLanguageLabel(
              translationCustomVariables.target_lang ?? DEFAULT_TRANSLATION_CUSTOM_VARIABLES.target_lang
            )}
            options={TRANSLATION_TARGET_LANGUAGE_OPTIONS.map((value) => ({
              value,
              label: translationLanguageLabel(value),
            }))}
            onChange={(value: string) =>
              updateTranslationCustomVariables({ target_lang: value as TranslationTargetLanguage })
            }
          >
            {TRANSLATION_TARGET_LANGUAGE_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {translationLanguageLabel(value)}
              </option>
            ))}
          </theme.Select>

          <theme.Select
            label={t("providers:zai.translationStrategy")}
            disabled={!translationOn}
            values={[translationCustomVariables.strategy ?? DEFAULT_TRANSLATION_CUSTOM_VARIABLES.strategy]}
            valueTitle={t(
              `providers:zai.translationStrategies.${translationCustomVariables.strategy ?? DEFAULT_TRANSLATION_CUSTOM_VARIABLES.strategy
              }`,
              translationCustomVariables.strategy ?? DEFAULT_TRANSLATION_CUSTOM_VARIABLES.strategy
            )}
            options={TRANSLATION_STRATEGY_OPTIONS.map((value) => ({
              value,
              label: t(`providers:zai.translationStrategies.${value}`, value),
            }))}
            onChange={(value: string) =>
              updateTranslationCustomVariables({ strategy: value as TranslationStrategy })
            }
          >
            {TRANSLATION_STRATEGY_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {t(`providers:zai.translationStrategies.${value}`, value)}
              </option>
            ))}
          </theme.Select>

          <theme.Input
            label={t("providers:zai.glossary")}
            placeholder={t("providers:zai.glossaryPlaceholder")}
            disabled={!translationOn}
            value={translationCustomVariables.glossary ?? ""}
            onChange={(e: any) => updateTranslationCustomVariables({ glossary: optionalString(e?.target?.value) })}
          />

          {translationCustomVariables.strategy === "cot" ? (
            <theme.Select
              label={t("providers:zai.reasonLanguage")}
              disabled={!translationOn}
              values={[translationCustomVariables.strategy_config?.cot?.reason_lang ?? "to"]}
              valueTitle={t(
                `providers:zai.reasonLanguages.${translationCustomVariables.strategy_config?.cot?.reason_lang ?? "to"}`,
                translationCustomVariables.strategy_config?.cot?.reason_lang ?? "to"
              )}
              options={TRANSLATION_REASON_LANGUAGE_OPTIONS.map((value) => ({
                value,
                label: t(`providers:zai.reasonLanguages.${value}`, value),
              }))}
              onChange={(value: string) =>
                updateTranslationCustomVariables({
                  strategy_config: {
                    cot: { reason_lang: value as TranslationReasonLanguage },
                  },
                })
              }
            >
              {TRANSLATION_REASON_LANGUAGE_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {t(`providers:zai.reasonLanguages.${value}`, value)}
                </option>
              ))}
            </theme.Select>
          ) : null}

          {translationCustomVariables.strategy === "general" ? (
            <div style={fullWidthGridItem}>
              <theme.TextArea
                label={t("providers:zai.translationSuggestion")}
                placeholder={t("providers:zai.translationSuggestionPlaceholder")}
                rows={4}
                value={translationCustomVariables.strategy_config?.general?.suggestion ?? ""}
                onChange={(value) =>
                  updateTranslationCustomVariables({
                    strategy_config: {
                      general: { suggestion: optionalString(value) },
                    },
                  })
                }
              />
            </div>
          ) : null}
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={t("providers:zai.popularSpecialEffectsVideos")}
        headerActions={
          <theme.Switch
            id="zaiPopularSpecialEffectsVideos"
            checked={videoTemplateOn}
            onChange={(value) =>
              submitConfig({
                ...resolvedConfig,
                custom_variables: value ? { ...DEFAULT_VIDEO_TEMPLATE_CUSTOM_VARIABLES } : undefined,
              })
            }
          />
        }
      >
        <div style={twoColumnGrid}>
          <theme.Select
            label={t("providers:zai.videoTemplate")}
            disabled={!videoTemplateOn}
            values={[videoTemplateCustomVariables.template]}
            valueTitle={videoTemplateLabel(videoTemplateCustomVariables.template)}
            options={VIDEO_TEMPLATE_OPTIONS.map((value) => ({
              value,
              label: videoTemplateLabel(value),
            }))}
            onChange={(value: string) => updateVideoTemplateCustomVariables({ template: value as VideoTemplate })}
          >
            {VIDEO_TEMPLATE_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {videoTemplateLabel(value)}
              </option>
            ))}
          </theme.Select>
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

