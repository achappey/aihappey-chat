import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import {
  buildCanonicalProviderToolsConfig,
  withResolvedProviderTools,
} from "../providerToolConfig";

const EFFORTS = ["low", "medium", "high", "xhigh"] as const;
type Effort = (typeof EFFORTS)[number];

const DEFAULT_REASONING: { effort: Effort } = {
  effort: "high",
};

const DEFAULT_WEB_SEARCH = {
  type: "web_search",
  enable_image_understanding: true,
  enable_image_search: true,
  allowed_domains: [],
  excluded_domains: [],
};

const DEFAULT_X_SEARCH = {
  type: "x_search",
  enable_image_understanding: true,
  enable_video_understanding: true,
  allowed_x_handles: [],
  excluded_x_handles: [],
};

const DEFAULT_CODE_EXECUTION = {
  type: "code_execution",
};

const DEFAULT_IMAGE_GENERATION = {
  type: "image_generation",
  action: "auto",
};

const IMAGE_GENERATION_ACTIONS = ["auto", "generate", "edit"] as const;

const XAI_TOOL_TYPES = [
  "web_search",
  "x_search",
  "code_execution",
  "image_generation",
];

export const XAIChatConfigForm = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const resolvedConfig = withResolvedProviderTools(config, XAI_TOOL_TYPES);
  const submitConfig = (nextConfig: any) => {
    const { instructions: _instructions, ...configWithoutInstructions } =
      nextConfig ?? {};

    updateConfig(
      buildCanonicalProviderToolsConfig(
        configWithoutInstructions,
        XAI_TOOL_TYPES
      )
    );
  };

  const reasoningOn = !!config?.reasoning;
  const reasoningEffort = (config?.reasoning?.effort ??
    DEFAULT_REASONING.effort) as Effort;
  const reasoningEffortOptions = EFFORTS.map((value) => ({
    value,
    label: t(value),
  }));
  const webSearchOn = !!resolvedConfig?.web_search;
  const xSearchOn = !!resolvedConfig?.x_search;
  const codeExecutionOn = !!resolvedConfig?.code_execution;
  const imageGenerationOn = !!resolvedConfig?.image_generation;
  const imageGenerationAction =
    resolvedConfig?.image_generation?.action ?? "auto";
  const imageGenerationActionOptions = IMAGE_GENERATION_ACTIONS.map((value) => ({
    value,
    label:
      value === "auto" ? t("auto") : t(`providers:openai.${value}`),
  }));

  const serviceTierOptions = ["default", "priority"];
  const serviceTierValue = resolvedConfig?.service_tier ?? "default";
  const toggleInclude = (key: string, enabled: boolean) => {
    const current = Array.isArray(config?.include) ? config.include : [];
    const next = enabled
      ? Array.from(new Set([...current, key]))
      : current.filter((value: any) => value !== key);

    submitConfig({
      ...resolvedConfig,
      include: next.length ? next : undefined,
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card
        size="small"
        title={t("reasoning")}
        headerActions={
          <theme.Switch
            id="reasoning"
            checked={reasoningOn}
            onChange={(val) =>
              submitConfig({
                ...resolvedConfig,
                reasoning: val ? { ...DEFAULT_REASONING } : undefined,
              })
            }
          />
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Select
            label={t("reasoningEffort", {
              reasoningEffort: t(reasoningEffort),
            })}
            disabled={!reasoningOn}
            values={[reasoningEffort]}
            valueTitle={
              reasoningEffortOptions.find(
                ({ value }) => value === reasoningEffort
              )?.label ?? t(DEFAULT_REASONING.effort)
            }
            options={reasoningEffortOptions}
            onChange={(value: string) =>
              submitConfig({
                ...resolvedConfig,
                reasoning: {
                  ...(resolvedConfig?.reasoning ?? DEFAULT_REASONING),
                  effort: value as Effort,
                },
              })
            }
          >
            {reasoningEffortOptions.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </theme.Select>

          <theme.Switch
            id="xaiEncryptedContent"
            disabled={!reasoningOn}
            checked={config?.include?.includes("reasoning.encrypted_content")}
            label={t("providers:openai.encryptedContent")}
            onChange={(value) =>
              toggleInclude("reasoning.encrypted_content", !!value)
            }
          />
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={t("webSearch")}
        headerActions={
          <theme.Switch
            id="webSearch"
            checked={webSearchOn}
            onChange={(val) =>
              submitConfig({
                ...resolvedConfig,
                web_search: !val ? undefined : { ...DEFAULT_WEB_SEARCH },
              })
            }
          />
        }
      >
        <div>
          <theme.Input
            label={t("providers:spacexai.allowedDomains")}
            disabled={!webSearchOn}
            value={(resolvedConfig?.web_search?.allowed_domains || []).join(", ")}
            onChange={(e: any) =>
              submitConfig({
                ...resolvedConfig,
                web_search: {
                  ...resolvedConfig.web_search,
                  allowed_domains: e.target.value
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean),
                },
              })
            }
          />

          <theme.Input
            label={t("providers:spacexai.excludedDomains")}
            disabled={!webSearchOn}
            value={(resolvedConfig?.web_search?.excluded_domains || []).join(", ")}
            onChange={(e: any) =>
              submitConfig({
                ...resolvedConfig,
                web_search: {
                  ...resolvedConfig.web_search,
                  excluded_domains: e.target.value
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean),
                },
              })
            }
          />

          <theme.Switch
            id="webImageUnderstanding"
            label={t("providers:spacexai.imageUnderstanding")}
            disabled={!webSearchOn}
            checked={resolvedConfig?.web_search?.enable_image_understanding}
            onChange={(val) =>
              submitConfig({
                ...resolvedConfig,
                web_search: {
                  ...resolvedConfig.web_search,
                  enable_image_understanding: val,
                },
              })
            }
          />

          <theme.Switch
            id="webImageSearch"
            label={t("providers:spacexai.imageSearch")}
            disabled={!webSearchOn}
            checked={resolvedConfig?.web_search?.enable_image_search}
            onChange={(val) =>
              submitConfig({
                ...resolvedConfig,
                web_search: {
                  ...resolvedConfig.web_search,
                  enable_image_search: val,
                },
              })
            }
          />

          <theme.Switch
            id="includeSources"
            disabled={!webSearchOn}
            checked={config?.include?.includes("web_search_call.action.sources")}
            label={t("providers:openai.includeSources")}
            onChange={(value) =>
              toggleInclude("web_search_call.action.sources", !!value)
            }
          />

        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={t("xSearch")}
        headerActions={
          <theme.Switch
            id="xSearch"
            checked={xSearchOn}
            onChange={(val) =>
              submitConfig({
                ...resolvedConfig,
                x_search: !val ? undefined : { ...DEFAULT_X_SEARCH },
              })
            }
          />
        }
      >
        <div>
          <theme.Input
            label={t("providers:spacexai.allowed_x_handles")}
            disabled={!xSearchOn}
            value={(resolvedConfig?.x_search?.allowed_x_handles || []).join(", ")}
            onChange={(e: any) =>
              submitConfig({
                ...resolvedConfig,
                x_search: {
                  ...resolvedConfig.x_search,
                  allowed_x_handles: e.target.value
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean),
                },
              })
            }
          />

          <theme.Input
            label={t("providers:spacexai.excluded_x_handles")}
            disabled={!xSearchOn}
            value={(resolvedConfig?.x_search?.excluded_x_handles || []).join(", ")}
            onChange={(e: any) =>
              submitConfig({
                ...resolvedConfig,
                x_search: {
                  ...resolvedConfig.x_search,
                  excluded_x_handles: e.target.value
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean),
                },
              })
            }
          />

          <theme.Switch
            id="xImageUnderstanding"
            label={t("providers:spacexai.imageUnderstanding")}
            disabled={!xSearchOn}
            checked={resolvedConfig?.x_search?.enable_image_understanding}
            onChange={(val) =>
              submitConfig({
                ...resolvedConfig,
                x_search: {
                  ...resolvedConfig.x_search,
                  enable_image_understanding: val,
                },
              })
            }
          />

          <theme.Switch
            id="xVideoUnderstanding"
            label={t("providers:spacexai.videoUnderstanding")}
            disabled={!xSearchOn}
            checked={resolvedConfig?.x_search?.enable_video_understanding}
            onChange={(val) =>
              submitConfig({
                ...resolvedConfig,
                x_search: {
                  ...resolvedConfig.x_search,
                  enable_video_understanding: val,
                },
              })
            }
          />
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={t("image_generation")}
        headerActions={
          <theme.Switch
            id="imageGeneration"
            checked={imageGenerationOn}
            onChange={(val) =>
              submitConfig({
                ...resolvedConfig,
                image_generation: !val
                  ? undefined
                  : { ...DEFAULT_IMAGE_GENERATION },
              })
            }
          />
        }
      >
        <theme.Select
          label={t("mode")}
          values={[imageGenerationAction]}
          disabled={!imageGenerationOn}
          valueTitle={
            imageGenerationActionOptions.find(
              ({ value }) => value === imageGenerationAction
            )?.label ?? t("auto")
          }
          options={imageGenerationActionOptions}
          onChange={(value: string) =>
            submitConfig({
              ...resolvedConfig,
              image_generation: {
                ...(resolvedConfig.image_generation ?? {
                  ...DEFAULT_IMAGE_GENERATION,
                }),
                action: value,
              },
            })
          }
        >
          {imageGenerationActionOptions.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </theme.Select>
      </theme.Card>

      <theme.Card
        size="small"
        title={t("code_execution")}
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
      >
        <div>
          <theme.Switch
            id="includeOutputs"
            disabled={!codeExecutionOn}
            checked={config?.include?.includes("code_interpreter_call.outputs")}
            label={t("providers:openai.includeOutputs")}
            onChange={(value) =>
              toggleInclude("code_interpreter_call.outputs", !!value)
            }
          />
        </div>
      </theme.Card>

      <theme.Card size="small" title={t("other")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          <theme.Select
            label={t("providers:openai.serviceTier.title")}
            values={[serviceTierValue]}
            valueTitle={t(`providers:openai.serviceTier.${serviceTierValue}`)}
            options={serviceTierOptions.map((value) => ({
              value,
              label: t(`providers:openai.serviceTier.${value}`),
            }))}
            onChange={(value: string) =>
              submitConfig({
                ...config,
                service_tier: String(value ?? "auto"),
              })
            }
          >
            {serviceTierOptions.map((value) => (
              <option key={value} value={value}>
                {t(`providers:openai.serviceTier.${value}`)}
              </option>
            ))}
          </theme.Select>

          <theme.Switch
            id="parallelToolCalls"
            checked={!!config?.parallel_tool_calls}
            label={t("parallelToolCalls")}
            onChange={(value) =>
              submitConfig({
                ...config,
                parallel_tool_calls: value,
              })
            }
          />


        </div>
      </theme.Card>


    </div>
  );
};
