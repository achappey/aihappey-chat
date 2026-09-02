// GoogleChatConfigForm.tsx

import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../theme/ThemeContext";
import { GoogleEnvironmentCard } from "./GoogleEnvironmentCard";
import {
  GoogleInteractionSpeechCard,
  GoogleInteractionTranscriptionCard,
  normalizeGoogleResponseFormatValue,
  GoogleResponseFormatCard,
  GoogleRetrievalSearchCard,
  type GoogleRetrievalTool,
  type GoogleResponseFormat,
} from "./GoogleInteractionConfigCards";
import {
  buildCanonicalProviderToolsConfig,
  withResolvedProviderTools,
} from "../providerToolConfig";

const DEFAULT_CODE_EXECUTION = { type: "code_execution" };
const DEFAULT_URL_CONTEXT = { type: "url_context" };
const DEFAULT_GOOGLE_MAPS = { type: "google_maps" };
const DEFAULT_GOOGLE_SEARCH = {
  type: "google_search",
  search_types: ["web_search"],
};
const GOOGLE_TOOL_TYPES = [
  "code_execution",
  "url_context",
  "google_maps",
  "google_search",
  "retrieval",
];
const GOOGLE_SEARCH_TYPES = [
  "web_search",
  "image_search",
  "enterprise_web_search",
] as const;
const GOOGLE_IMAGE_ASPECT_RATIO_OPTIONS = [
  "1:1",
  "2:3",
  "3:2",
  "3:4",
  "4:3",
  "4:5",
  "5:4",
  "9:16",
  "16:9",
  "21:9",
  "1:8",
  "8:1",
  "1:4",
  "4:1",
] as const;
const GOOGLE_IMAGE_SIZE_OPTIONS = ["1K", "2K", "4K", "512"] as const;
const GOOGLE_VIDEO_TASK_OPTIONS = [
  "text_to_video",
  "image_to_video",
  "reference_to_video",
  "edit",
  "extend",
] as const;
const GOOGLE_AGENT_TYPE_OPTIONS = ["dynamic", "deep-research"] as const;
const GOOGLE_AGENT_THINKING_SUMMARY_OPTIONS = ["auto", "none"] as const;
const GOOGLE_SERVICE_TIER_OPTIONS = ["flex", "standard", "priority"] as const;
const GOOGLE_SAFETY_METHOD_OPTIONS = ["severity", "probability"] as const;
const GOOGLE_SAFETY_THRESHOLD_OPTIONS = [
  "block_low_and_above",
  "block_medium_and_above",
  "block_only_high",
  "block_none",
  "off",
] as const;
const GOOGLE_HARM_CATEGORY_OPTIONS = [
  "hate_speech",
  "dangerous_content",
  "harassment",
  "sexually_explicit",
  "civic_integrity",
  "image_hate",
  "image_dangerous_content",
  "image_harassment",
  "image_sexually_explicit",
  "jailbreak",
] as const;

type GoogleSafetySetting = {
  type: (typeof GOOGLE_HARM_CATEGORY_OPTIONS)[number];
  method: (typeof GOOGLE_SAFETY_METHOD_OPTIONS)[number];
  threshold: (typeof GOOGLE_SAFETY_THRESHOLD_OPTIONS)[number];
};

const DEFAULT_GOOGLE_SAFETY_SETTING: GoogleSafetySetting = {
  type: "hate_speech",
  method: "probability",
  threshold: "block_medium_and_above",
};

enum BlockingConfidence {
  PhishBlockThresholdUnspecified = "PhishBlockThresholdUnspecified",
  BlockLowAndAbove = "BlockLowAndAbove",
  BlockMediumAndAbove = "BlockMediumAndAbove",
  BlockHighAndAbove = "BlockHighAndAbove",
  BlockHigherAndAbove = "BlockHigherAndAbove",
  BlockVeryHighAndAbove = "BlockVeryHighAndAbove",
  BlockOnlyExtremelyHigh = "BlockOnlyExtremelyHigh",
}

// --- Defaults ---
const DEFAULT_GOOGLE_GENERATION_CONFIG = {
  thinking_level: "minimal",
  thinking_summaries: "auto",
};
const DEFAULT_GOOGLE_IMAGE_CONFIG = {
  aspect_ratio: "1:1",
  image_size: "1K",
};
const DEFAULT_GOOGLE_VIDEO_CONFIG = {};

export type GoogleChatConfigFormTranslations = {
  reasoning?: string;
  reasoningEffort?: string;
  budget?: string;
  webSearch?: string;
  code_execution?: string;
  web_search?: string;
  image_search?: string;
  enterprise_web_search?: string;
  low?: string;
  medium?: string;
  high?: string;

  unspecified?: string;

  includeThoughts?: string;

  intervalStart?: string;
  intervalEnd?: string;

  googleMaps?: string;
  enable_widget?: string;
  latitude?: string;
  longitude?: string;
  url_context?: string;
  videoConfig?: string;
  videoConfigTask?: string;
  videoConfigProviderDefault?: string;
  videoTask_text_to_video?: string;
  videoTask_image_to_video?: string;
  videoTask_reference_to_video?: string;
  videoTask_edit?: string;
  videoTask_extend?: string;

  // blockingConfidence (used in options list, even though select is currently false-gated)
  blockingConfidence_unspecified?: string;
  blockingConfidence_lowAndAbove?: string;
  blockingConfidence_mediumAndAbove?: string;
  blockingConfidence_highAndAbove?: string;
  blockingConfidence_higherAndAbove?: string;
  blockingConfidence_veryHighAndAbove?: string;
  blockingConfidence_onlyExtremelyHigh?: string;
  blockingConfidence_label?: string;
};

export const GoogleChatConfigForm = ({
  config,
  updateConfig,
  translations,
}: {
  config: any;
  updateConfig: (val: any) => void;
  translations?: GoogleChatConfigFormTranslations;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const resolvedConfig = withResolvedProviderTools(config, GOOGLE_TOOL_TYPES);
  const submitConfig = (nextConfig: any) =>
    updateConfig(
      buildCanonicalProviderToolsConfig(
        nextConfig?.response_format === undefined
          ? nextConfig
          : {
              ...nextConfig,
              response_format: normalizeGoogleResponseFormatValue(nextConfig.response_format),
            },
        GOOGLE_TOOL_TYPES,
      ),
    );
  const generationConfig = {
    ...DEFAULT_GOOGLE_GENERATION_CONFIG,
    ...(resolvedConfig?.generation_config ?? {}),
  };
  const imageConfig = resolvedConfig?.generation_config?.image_config;
  const videoConfig = resolvedConfig?.generation_config?.video_config;
  const speechConfig = resolvedConfig?.generation_config?.speech_config;
  const transcriptionConfig = resolvedConfig?.generation_config?.transcription_config;
  const responseFormat = resolvedConfig?.response_format as
    | GoogleResponseFormat
    | GoogleResponseFormat[]
    | undefined;
  const retrieval = resolvedConfig?.retrieval as GoogleRetrievalTool | undefined;
  const agentConfig = resolvedConfig?.agent_config;
  const agentThinkingSummariesEnabled = agentConfig?.type === "deep-research";
  const safetySettingsOn = Array.isArray(resolvedConfig?.safety_settings);
  const safetySettings: GoogleSafetySetting[] = safetySettingsOn
    ? resolvedConfig.safety_settings
    : [];

  const blockingConfidenceOptions = [
    {
      value: BlockingConfidence.PhishBlockThresholdUnspecified,
      label: translations?.blockingConfidence_unspecified ?? "unspecified",
    },
    {
      value: BlockingConfidence.BlockLowAndAbove,
      label: translations?.blockingConfidence_lowAndAbove ?? "lowAndAbove",
    },
    {
      value: BlockingConfidence.BlockMediumAndAbove,
      label: translations?.blockingConfidence_mediumAndAbove ?? "mediumAndAbove",
    },
    {
      value: BlockingConfidence.BlockHighAndAbove,
      label: translations?.blockingConfidence_highAndAbove ?? "highAndAbove",
    },
    {
      value: BlockingConfidence.BlockHigherAndAbove,
      label: translations?.blockingConfidence_higherAndAbove ?? "higherAndAbove",
    },
    {
      value: BlockingConfidence.BlockVeryHighAndAbove,
      label: translations?.blockingConfidence_veryHighAndAbove ?? "veryHighAndAbove",
    },
    {
      value: BlockingConfidence.BlockOnlyExtremelyHigh,
      label: translations?.blockingConfidence_onlyExtremelyHigh ?? "onlyExtremelyHigh",
    },
  ];

  const searchOn = !!resolvedConfig?.google_search;
  const thinkingOn = true;
  const imageOn = !!imageConfig;
  const videoOn = !!videoConfig;
  const agentOn = !!agentConfig;
  const codeExecutionOn = !!resolvedConfig?.code_execution;
  const urlContextOn = !!resolvedConfig?.url_context;
  const googleMapsOn = !!resolvedConfig?.google_maps;
  const googleSearchTypes = Array.isArray(resolvedConfig?.google_search?.search_types)
    ? resolvedConfig.google_search.search_types
    : [];

  const toggleGoogleSearchType = (
    searchType: (typeof GOOGLE_SEARCH_TYPES)[number],
    enabled: boolean
  ) => {
    const currentTypes = Array.isArray(resolvedConfig?.google_search?.search_types)
      ? resolvedConfig.google_search.search_types
      : [];
    const nextSearchTypes = enabled
      ? Array.from(new Set([...currentTypes, searchType]))
      : currentTypes.filter((value: string) => value !== searchType);

    submitConfig({
      ...resolvedConfig,
      google_search: {
        ...(resolvedConfig?.google_search ?? { ...DEFAULT_GOOGLE_SEARCH }),
        search_types: nextSearchTypes.length ? nextSearchTypes : undefined,
      },
    });
  };

  const updateRetrievalSearch = (
    provider: "exa" | "parallel",
    enabled: boolean,
    apiKey?: string
  ) => {
    const retrievalType = provider === "exa" ? "exa_ai_search" : "parallel_ai_search";
    const configKey =
      provider === "exa" ? "exa_ai_search_config" : "parallel_ai_search_config";
    const currentRetrieval = retrieval ?? { type: "retrieval" };
    const currentTypes = Array.isArray(currentRetrieval.retrieval_types)
      ? currentRetrieval.retrieval_types
      : [];
    const nextTypes = enabled
      ? Array.from(new Set([...currentTypes, retrievalType]))
      : currentTypes.filter((type) => type !== retrievalType);
    const nextProviderConfig = enabled
      ? {
        ...(currentRetrieval[configKey] ?? {}),
        api_key: apiKey?.trim() || undefined,
      }
      : undefined;
    const nextRetrieval: GoogleRetrievalTool = {
      ...currentRetrieval,
      type: currentRetrieval.type ?? "retrieval",
      retrieval_types: nextTypes.length ? nextTypes : undefined,
      [configKey]: nextProviderConfig,
    };
    const hasRemainingConfig = Object.entries(nextRetrieval).some(
      ([key, value]) => key !== "type" && value !== undefined
    );

    submitConfig({
      ...resolvedConfig,
      retrieval: hasRemainingConfig ? nextRetrieval : undefined,
    });
  };

  const thinkingLevelOptions = [
    {
      value: "minimal",
      label: t("minimal"),
    },
    { value: "low", label: translations?.low ?? t("low") },
    { value: "medium", label: translations?.medium ?? t("medium") },
    { value: "high", label: translations?.high ?? t("high") },
  ];

  const thinkingSummaryOptions = [
    { value: "auto", label: t("auto") },
    { value: "none", label: t("none") },
  ];
  const imageAspectRatioOptions = GOOGLE_IMAGE_ASPECT_RATIO_OPTIONS.map((value) => ({
    value,
    label: value,
  }));
  const imageSizeOptions = GOOGLE_IMAGE_SIZE_OPTIONS.map((value) => ({
    value,
    label: value,
  }));
  const videoProviderDefaultLabel =
    translations?.videoConfigProviderDefault ??
    t("providers:google.videoConfig.providerDefault");
  const videoTaskOptions = [
    {
      value: "",
      label: videoProviderDefaultLabel,
    },
    ...GOOGLE_VIDEO_TASK_OPTIONS.map((value) => ({
      value,
      label:
        translations?.[`videoTask_${value}`] ??
        t(`providers:google.videoConfig.tasks.${value}`),
    })),
  ];
  const agentTypeOptions = GOOGLE_AGENT_TYPE_OPTIONS.map((value) => ({
    value,
    label: value,
  }));
  const agentThinkingSummaryOptions = GOOGLE_AGENT_THINKING_SUMMARY_OPTIONS.map((value) => ({
    value,
    label: t(value),
  }));
  const serviceTierOptions = GOOGLE_SERVICE_TIER_OPTIONS.map((value) => ({
    value,
    label: t(`providers:google.serviceTiers.${value}`),
  }));
  const safetyMethodOptions = GOOGLE_SAFETY_METHOD_OPTIONS.map((value) => ({
    value,
    label: t(`providers:google.safetySettings.methods.${value}`),
  }));
  const safetyThresholdOptions = GOOGLE_SAFETY_THRESHOLD_OPTIONS.map((value) => ({
    value,
    label: t(`providers:google.safetySettings.thresholds.${value}`),
  }));
  const harmCategoryOptions = GOOGLE_HARM_CATEGORY_OPTIONS.map((value) => ({
    value,
    label: t(`providers:google.safetySettings.categories.${value}`),
  }));

  const updateSafetySettings = (nextSafetySettings: GoogleSafetySetting[]) =>
    submitConfig({
      ...resolvedConfig,
      safety_settings: nextSafetySettings,
    });

  const selectedThinkingLevel = generationConfig.thinking_level;
  const selectedThinkingLevelLabel =
    thinkingLevelOptions.find((option) => option.value === selectedThinkingLevel)?.label ??
    selectedThinkingLevel;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card size="small" title={translations?.reasoning ?? t("reasoning")}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <theme.Select
            label={t("reasoningEffort", {
              reasoningEffort: selectedThinkingLevelLabel,
            })}
            style={{ flex: "1 1 0", maxWidth: "100%" }}
            values={[selectedThinkingLevel]}
            disabled={!thinkingOn}
            valueTitle={
              thinkingLevelOptions.find((option) => option.value === selectedThinkingLevel)
                ?.label
            }
            options={thinkingLevelOptions}
            onChange={(val: string) =>
              submitConfig({
                ...resolvedConfig,
                generation_config: {
                  ...generationConfig,
                  thinking_level: val,
                },
              })
            }
          >
            {thinkingLevelOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>

          <theme.Select
            label={t("reasoningSummary")}
            style={{ flex: "1 1 0", maxWidth: "100%" }}
            values={[generationConfig.thinking_summaries]}
            disabled={!thinkingOn}
            valueTitle={
              thinkingSummaryOptions.find(
                (option) => option.value === generationConfig.thinking_summaries
              )?.label
            }
            options={thinkingSummaryOptions}
            onChange={(val: string) =>
              submitConfig({
                ...resolvedConfig,
                generation_config: {
                  ...generationConfig,
                  thinking_summaries: val,
                },
              })
            }
          >
            {thinkingSummaryOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={translations?.webSearch ?? "webSearch"}
        headerActions={
          <theme.Switch
            id="googleSearch"
            checked={searchOn}
            onChange={(val) =>
              submitConfig({
                ...resolvedConfig,
                google_search: !val ? undefined : { ...DEFAULT_GOOGLE_SEARCH },
              })
            }
          />
        }
      >
        <div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {GOOGLE_SEARCH_TYPES.map((searchType) => (
              <theme.Switch
                key={searchType}
                id={`googleSearchType_${searchType}`}
                disabled={!searchOn}
                checked={googleSearchTypes.includes(searchType)}
                label={translations?.[searchType] ?? t(`providers:google.${searchType}`)}
                onChange={(value) => toggleGoogleSearchType(searchType, !!value)}
              />
            ))}
          </div>

          {false && (
            <theme.Select
              label={translations?.blockingConfidence_label ?? "blockingConfidence"}
              value={resolvedConfig.google_search?.blockingConfidence || ""}
              disabled={!searchOn}
              valueTitle={
                blockingConfidenceOptions.find(
                  (a) => a.value === resolvedConfig.google_search?.blockingConfidence
                )?.label
              }
              options={blockingConfidenceOptions}
              onChange={(val: string) =>
                submitConfig({
                  ...resolvedConfig,
                  google_search: {
                    ...resolvedConfig.google_search,
                    blockingConfidence: val,
                  },
                })
              }
            >
              {blockingConfidenceOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </theme.Select>
          )}
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={translations?.googleMaps ?? "googleMaps"}
        headerActions={
          <theme.Switch
            id="googleMaps"
            checked={googleMapsOn}
            onChange={(val) =>
              submitConfig({
                ...resolvedConfig,
                google_maps: !val ? undefined : { ...DEFAULT_GOOGLE_MAPS },
              })
            }
          />
        }
      >
        <div>
          <theme.Switch
            id="googleMapsEnableWidget"
            label={translations?.enable_widget ?? t("providers:google.enable_widget")}
            disabled={!googleMapsOn}
            checked={!!resolvedConfig?.google_maps?.enable_widget}
            onChange={(value) =>
              submitConfig({
                ...resolvedConfig,
                google_maps: {
                  ...(resolvedConfig?.google_maps ?? { ...DEFAULT_GOOGLE_MAPS }),
                  enable_widget: !!value,
                },
              })
            }
          />

          <div style={{ display: "flex", gap: 12 }}>
            <theme.Input
              type="number"
              label={translations?.latitude ?? t("latitude")}
              disabled={!googleMapsOn}
              value={resolvedConfig?.google_maps?.latitude ?? ""}
              onChange={(e: any) => {
                const raw = e.target.value;
                submitConfig({
                  ...resolvedConfig,
                  google_maps: {
                    ...(resolvedConfig?.google_maps ?? { ...DEFAULT_GOOGLE_MAPS }),
                    latitude: raw === "" ? undefined : Number(raw),
                  },
                });
              }}
            />

            <theme.Input
              type="number"
              label={translations?.longitude ?? t("longitude")}
              disabled={!googleMapsOn}
              value={resolvedConfig?.google_maps?.longitude ?? ""}
              onChange={(e: any) => {
                const raw = e.target.value;
                submitConfig({
                  ...resolvedConfig,
                  google_maps: {
                    ...(resolvedConfig?.google_maps ?? { ...DEFAULT_GOOGLE_MAPS }),
                    longitude: raw === "" ? undefined : Number(raw),
                  },
                });
              }}
            />
          </div>
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={translations?.url_context ?? "url_context"}
        headerActions={
          <theme.Switch
            id="urlContext"
            checked={urlContextOn}
            onChange={(val) =>
              submitConfig({
                ...resolvedConfig,
                url_context: !val ? undefined : { ...DEFAULT_URL_CONTEXT },
              })
            }
          />
        }
      />

      <theme.Card
        size="small"
        title={translations?.code_execution ?? "code_execution"}
        headerActions={
          <theme.Switch
            id="codeExecution"
            checked={codeExecutionOn}
            onChange={(val) =>
              submitConfig({
                ...resolvedConfig,
                code_execution: !val ? undefined : { ...DEFAULT_CODE_EXECUTION },
              })
            }
          />
        }
      />



      <GoogleResponseFormatCard
        value={responseFormat}
        onChange={(response_format) =>
          submitConfig({
            ...resolvedConfig,
            response_format,
          })
        }
      />

      <GoogleInteractionSpeechCard
        value={Array.isArray(speechConfig) ? speechConfig : undefined}
        onChange={(speech_config) =>
          submitConfig({
            ...resolvedConfig,
            generation_config: {
              ...generationConfig,
              speech_config,
            },
          })
        }
      />

      <GoogleInteractionTranscriptionCard
        value={transcriptionConfig}
        onChange={(transcription_config) =>
          submitConfig({
            ...resolvedConfig,
            generation_config: {
              ...generationConfig,
              transcription_config,
            },
          })
        }
      />

      <theme.Card
        size="small"
        title={translations?.videoConfig ?? t("providers:google.videoConfig.title")}
        headerActions={
          <theme.Switch
            id="googleVideoConfig"
            checked={videoOn}
            onChange={(val) =>
              submitConfig({
                ...resolvedConfig,
                generation_config: {
                  ...generationConfig,
                  video_config: !val
                    ? undefined
                    : { ...DEFAULT_GOOGLE_VIDEO_CONFIG },
                },
              })
            }
          />
        }
      >
        <theme.Select
          label={translations?.videoConfigTask ?? t("providers:google.videoConfig.task")}
          values={[videoConfig?.task ?? ""]}
          disabled={!videoOn}
          valueTitle={
            videoTaskOptions.find((option) => option.value === (videoConfig?.task ?? ""))
              ?.label
          }
          options={videoTaskOptions}
          onChange={(val: string) =>
            submitConfig({
              ...resolvedConfig,
              generation_config: {
                ...generationConfig,
                video_config: {
                  ...(videoConfig ?? DEFAULT_GOOGLE_VIDEO_CONFIG),
                  task: val || undefined,
                },
              },
            })
          }
        >
          {videoTaskOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </theme.Select>
      </theme.Card>


      <GoogleRetrievalSearchCard
        provider="parallel"
        value={retrieval}
        onChange={(enabled, apiKey) =>
          updateRetrievalSearch("parallel", enabled, apiKey)
        }
      />

      <GoogleRetrievalSearchCard
        provider="exa"
        value={retrieval}
        onChange={(enabled, apiKey) => updateRetrievalSearch("exa", enabled, apiKey)}
      />






      <GoogleEnvironmentCard config={resolvedConfig} updateConfig={submitConfig} />

      <theme.Card
        size="small"
        title={t("providers:google.safetySettings.title")}
        headerActions={
          <theme.Switch
            id="googleSafetySettings"
            checked={safetySettingsOn}
            onChange={(checked: boolean) =>
              submitConfig({
                ...resolvedConfig,
                safety_settings: checked
                  ? [{ ...DEFAULT_GOOGLE_SAFETY_SETTING }]
                  : undefined,
              })
            }
          />
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <theme.Button
              type="button"
              icon="add"
              size="small"
              variant="subtle"
              title={t("providers:google.safetySettings.add")}
              disabled={!safetySettingsOn}
              onClick={() =>
                updateSafetySettings([
                  ...safetySettings,
                  { ...DEFAULT_GOOGLE_SAFETY_SETTING },
                ])
              }
            >
              {t("providers:google.safetySettings.add")}
            </theme.Button>
          </div>

          {safetySettings.map((setting, index) => (
            <div
              key={`google-safety-setting-${index}`}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 10,
                padding: 10,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 12,
                }}
              >
                <theme.Select
                  label={t("providers:google.safetySettings.type")}
                  disabled={!safetySettingsOn}
                  values={[setting.type]}
                  valueTitle={
                    harmCategoryOptions.find((option) => option.value === setting.type)?.label
                  }
                  options={harmCategoryOptions}
                  onChange={(value: string) => {
                    const nextSettings = [...safetySettings];
                    nextSettings[index] = {
                      ...setting,
                      type: value as GoogleSafetySetting["type"],
                    };
                    updateSafetySettings(nextSettings);
                  }}
                >
                  {harmCategoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </theme.Select>

                <theme.Select
                  label={t("providers:google.safetySettings.method")}
                  disabled={!safetySettingsOn}
                  values={[setting.method]}
                  valueTitle={
                    safetyMethodOptions.find((option) => option.value === setting.method)?.label
                  }
                  options={safetyMethodOptions}
                  onChange={(value: string) => {
                    const nextSettings = [...safetySettings];
                    nextSettings[index] = {
                      ...setting,
                      method: value as GoogleSafetySetting["method"],
                    };
                    updateSafetySettings(nextSettings);
                  }}
                >
                  {safetyMethodOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </theme.Select>

                <theme.Select
                  label={t("providers:google.safetySettings.threshold")}
                  disabled={!safetySettingsOn}
                  values={[setting.threshold]}
                  valueTitle={
                    safetyThresholdOptions.find(
                      (option) => option.value === setting.threshold
                    )?.label
                  }
                  options={safetyThresholdOptions}
                  onChange={(value: string) => {
                    const nextSettings = [...safetySettings];
                    nextSettings[index] = {
                      ...setting,
                      threshold: value as GoogleSafetySetting["threshold"],
                    };
                    updateSafetySettings(nextSettings);
                  }}
                >
                  {safetyThresholdOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </theme.Select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <theme.Button
                  type="button"
                  icon="delete"
                  size="small"
                  variant="danger"
                  title={t("delete")}
                  disabled={!safetySettingsOn}
                  onClick={() =>
                    updateSafetySettings(
                      safetySettings.filter((_, settingIndex) => settingIndex !== index)
                    )
                  }
                >
                  {t("delete")}
                </theme.Button>
              </div>
            </div>
          ))}
        </div>
      </theme.Card>

      <theme.Card size="small" title={t("other")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Select
            label={t("providers:google.service_tier")}
            values={resolvedConfig?.service_tier ? [resolvedConfig.service_tier] : []}
            valueTitle={
              serviceTierOptions.find(
                (option) => option.value === resolvedConfig?.service_tier
              )?.label
            }
            options={serviceTierOptions}
            onChange={(val: string) =>
              submitConfig({
                ...resolvedConfig,
                service_tier: val || undefined,
              })
            }
          >
            {serviceTierOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>

          <theme.Input
            id="googleInteractionSeed"
            type="number"
            step={1}
            label={t("providers:google.interactions.other.seed")}
            value={generationConfig.seed ?? ""}
            onChange={(event: any) => {
              const raw = String(event?.target?.value ?? "").trim();
              submitConfig({
                ...resolvedConfig,
                generation_config: {
                  ...generationConfig,
                  seed: raw ? Number(raw) : undefined,
                },
              });
            }}
          />
        </div>
      </theme.Card>
    </div>
  );
};
