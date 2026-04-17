// GoogleChatConfigForm.tsx

import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../theme/ThemeContext";
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
];
const GOOGLE_SEARCH_TYPES = [
  "web_search",
  "image_search",
  "enterprise_web_search",
] as const;
const GOOGLE_RESPONSE_MODALITIES = [
  "text",
  "image",
  "audio",
  "video",
  "document",
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
const GOOGLE_AGENT_TYPE_OPTIONS = ["dynamic", "deep-research"] as const;
const GOOGLE_AGENT_THINKING_SUMMARY_OPTIONS = ["auto", "none"] as const;
const GOOGLE_SERVICE_TIER_OPTIONS = ["flex", "standard", "priority"] as const;

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

export type GoogleChatConfigFormTranslations = {
  reasoning?: string;
  reasoningEffort?: string;
  budget?: string;
  webSearch?: string;
  responseModalities?: string;
  code_execution?: string;
  web_search?: string;
  image_search?: string;
  enterprise_web_search?: string;
  text?: string;
  image?: string;
  audio?: string;
  video?: string;
  document?: string;
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
    updateConfig(buildCanonicalProviderToolsConfig(nextConfig, GOOGLE_TOOL_TYPES));
  const generationConfig = {
    ...DEFAULT_GOOGLE_GENERATION_CONFIG,
    ...(resolvedConfig?.generation_config ?? {}),
  };
  const imageConfig = resolvedConfig?.generation_config?.image_config;
  const agentConfig = resolvedConfig?.agent_config;
  const agentThinkingSummariesEnabled = agentConfig?.type === "deep-research";

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
  const agentOn = !!agentConfig;
  const codeExecutionOn = !!resolvedConfig?.code_execution;
  const urlContextOn = !!resolvedConfig?.url_context;
  const googleMapsOn = !!resolvedConfig?.google_maps;
  const googleSearchTypes = Array.isArray(resolvedConfig?.google_search?.search_types)
    ? resolvedConfig.google_search.search_types
    : [];
  const responseModalities = Array.isArray(resolvedConfig?.response_modalities)
    ? resolvedConfig.response_modalities
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

  const toggleResponseModality = (
    modality: (typeof GOOGLE_RESPONSE_MODALITIES)[number],
    enabled: boolean
  ) => {
    const currentModalities = Array.isArray(resolvedConfig?.response_modalities)
      ? resolvedConfig.response_modalities
      : [];
    const nextModalities = enabled
      ? Array.from(new Set([...currentModalities, modality]))
      : currentModalities.filter((value: string) => value !== modality);

    submitConfig({
      ...resolvedConfig,
      response_modalities: nextModalities,
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
    label: value,
  }));

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
        title={t("providers:google.image.title")}
        headerActions={
          <theme.Switch
            id="googleImageConfig"
            checked={imageOn}
            onChange={(val) =>
              submitConfig({
                ...resolvedConfig,
                generation_config: {
                  ...generationConfig,
                  image_config: !val ? undefined : { ...DEFAULT_GOOGLE_IMAGE_CONFIG },
                },
              })
            }
          />
        }
      >
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <theme.Select
            label={t("providers:google.image.aspect_ratio")}
            style={{ flex: "1 1 0", maxWidth: "100%" }}
            values={imageConfig?.aspect_ratio ? [imageConfig.aspect_ratio] : []}
            disabled={!imageOn}
            valueTitle={imageConfig?.aspect_ratio}
            options={imageAspectRatioOptions}
            onChange={(val: string) =>
              submitConfig({
                ...resolvedConfig,
                generation_config: {
                  ...generationConfig,
                  image_config: {
                    ...(imageConfig ?? {}),
                    aspect_ratio: val || undefined,
                  },
                },
              })
            }
          >
            {imageAspectRatioOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>

          <theme.Select
            label={t("providers:google.image.image_size")}
            style={{ flex: "1 1 0", maxWidth: "100%" }}
            values={imageConfig?.image_size ? [imageConfig.image_size] : []}
            disabled={!imageOn}
            valueTitle={imageConfig?.image_size}
            options={imageSizeOptions}
            onChange={(val: string) =>
              submitConfig({
                ...resolvedConfig,
                generation_config: {
                  ...generationConfig,
                  image_config: {
                    ...(imageConfig ?? {}),
                    image_size: val || undefined,
                  },
                },
              })
            }
          >
            {imageSizeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </theme.Select>
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

      <theme.Card
        size="small"
        title={t("providers:google.responseModalities")}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          }}
        >
          {GOOGLE_RESPONSE_MODALITIES.map((modality) => (
            <theme.Switch
              key={modality}
              id={`googleResponseModality_${modality}`}
              size="small"
              checked={responseModalities.includes(modality)}
              label={t(`providers:google.modalities.${modality}`)}
              onChange={(value) => toggleResponseModality(modality, !!value)}
            />
          ))}
        </div>
      </theme.Card>

      <theme.Select
        label={t("providers:google.service_tier")}
        values={resolvedConfig?.service_tier ? [resolvedConfig.service_tier] : []}
        valueTitle={resolvedConfig?.service_tier}
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
    </div>
  );
};
