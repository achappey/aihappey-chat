import { useTheme } from "../../../theme/ThemeContext";
import { useTranslation } from "aihappey-i18n";
import {
  buildCanonicalProviderToolsConfig,
  withResolvedProviderTools,
} from "../providerToolConfig";

const DEFAULT_WEB_SEARCH = { type: "web_search" };
const DEFAULT_WEB_SEARCH_PREMIUM = { type: "web_search_premium" };
const DEFAULT_IMAGE_GENERATION = { type: "image_generation" };
const DEFAULT_CODE_EXECUTION = { type: "code_interpreter" };
const DEFAULT_DOCUMENT_LIBRARY = { type: "document_library", library_ids: [] };
const DEFAULT_REASONING_EFFORT = "high";
const REASONING_EFFORTS = ["high", "none"] as const;
const MISTRAL_TOOL_TYPES = [
  "web_search",
  "web_search_premium",
  "image_generation",
  "code_interpreter",
  "document_library",
];

type ReasoningEffort = (typeof REASONING_EFFORTS)[number];

const withCompletionArgs = (config: any) => {
  const completion_args = Object.fromEntries(
    Object.entries({
      ...(config?.completion_args ?? {}),
      reasoning_effort:
        config?.completion_args?.reasoning_effort ?? config?.reasoning_effort,
      random_seed: config?.completion_args?.random_seed ?? config?.random_seed,
      top_p: config?.completion_args?.top_p ?? config?.top_p,
      presence_penalty:
        config?.completion_args?.presence_penalty ?? config?.presence_penalty,
      frequency_penalty:
        config?.completion_args?.frequency_penalty ?? config?.frequency_penalty,
    }).filter(([, value]) => value !== undefined)
  );

  return Object.keys(completion_args).length ? completion_args : undefined;
};

export const MistralChatConfigForm = ({
  config,
  updateConfig,
}: {
  config: any;
  updateConfig: (val: any) => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const resolvedConfig = withResolvedProviderTools(config, MISTRAL_TOOL_TYPES);
  const completionArgs = withCompletionArgs(resolvedConfig);
  const reasoningEffort = completionArgs?.reasoning_effort as
    | ReasoningEffort
    | undefined;
  const randomSeed =
    typeof completionArgs?.random_seed === "number"
      ? completionArgs.random_seed
      : undefined;
  const topP =
    typeof completionArgs?.top_p === "number"
      ? completionArgs.top_p
      : undefined;
  const presencePenalty =
    typeof completionArgs?.presence_penalty === "number"
      ? completionArgs.presence_penalty
      : undefined;
  const frequencyPenalty =
    typeof completionArgs?.frequency_penalty === "number"
      ? completionArgs.frequency_penalty
      : undefined;
  const reasoningOn = reasoningEffort !== undefined;
  const reasoningOptions = REASONING_EFFORTS.map((value) => ({
    value,
    label: t(value),
  }));
  const submitConfig = (nextConfig: any) =>
    updateConfig(
      buildCanonicalProviderToolsConfig(
        {
          ...(nextConfig ?? {}),
          completion_args: withCompletionArgs(nextConfig),
          reasoning_effort: undefined,
          random_seed: undefined,
          top_p: undefined,
          presence_penalty: undefined,
          frequency_penalty: undefined,
        },
        MISTRAL_TOOL_TYPES
      )
    );

  const fileSearchOn = !!resolvedConfig?.document_library;
  const codeExecutionOn = !!resolvedConfig?.code_interpreter;
  const imageGenerationOn = !!resolvedConfig?.image_generation;
  const webSearchOn =
    !!resolvedConfig?.web_search || !!resolvedConfig?.web_search_premium;
  const webSearchPremiumOn = !!resolvedConfig?.web_search_premium;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
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
                web_search_premium: undefined,
                web_search: !val ? undefined : { ...DEFAULT_WEB_SEARCH },
              })
            }
          />
        }
      >
        <theme.Switch
          id="webSearchPremium"
          label={t("providers:mistral.webSearchPremium")}
          checked={webSearchPremiumOn}
          disabled={!webSearchOn}
          onChange={(val) =>
            submitConfig({
              ...resolvedConfig,
              web_search: !val ? { ...DEFAULT_WEB_SEARCH } : undefined,
              web_search_premium: !val
                ? undefined
                : { ...DEFAULT_WEB_SEARCH_PREMIUM },
            })
          }
        />
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
      />

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
                code_interpreter: !val
                  ? undefined
                  : { ...DEFAULT_CODE_EXECUTION },
              })
            }
          />
        }
      />

      <theme.Card
        size="small"
        title={t("providers:openai.file_search")}
        headerActions={
          <theme.Switch
            id="fileSearch"
            checked={fileSearchOn}
            onChange={(val) =>
              submitConfig({
                ...resolvedConfig,
                document_library: !val
                  ? undefined
                  : { ...DEFAULT_DOCUMENT_LIBRARY },
              })
            }
          />
        }
      >
        <div>
          <theme.Input
            label={t("providers:openai.vector_store_ids")}
            placeholder="xxx, zzz"
            disabled={!fileSearchOn}
            value={(resolvedConfig?.document_library?.library_ids || []).join(", ")}
            onChange={(e: any) =>
              submitConfig({
                ...resolvedConfig,
                document_library: {
                  ...resolvedConfig.document_library,
                  library_ids: e.target.value
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean),
                },
              })
            }
          />
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={t("reasoning")}
        headerActions={
          <theme.Switch
            id="mistral_reasoning_effort"
            checked={reasoningOn}
            onChange={(value) =>
              submitConfig({
                ...resolvedConfig,
                completion_args: {
                  ...(completionArgs ?? {}),
                  reasoning_effort: value ? DEFAULT_REASONING_EFFORT : undefined,
                },
              })
            }
          />
        }
      >
        <div>
          <theme.Select
            label={t("reasoningEffort", {
              reasoningEffort: t(reasoningEffort ?? "none"),
            })}
            disabled={!reasoningOn}
            values={[reasoningEffort ?? DEFAULT_REASONING_EFFORT]}
            valueTitle={
              reasoningOptions.find((option) => option.value === reasoningEffort)
                ?.label ?? t(DEFAULT_REASONING_EFFORT)
            }
            options={reasoningOptions}
            onChange={(value: string) =>
              submitConfig({
                ...resolvedConfig,
                completion_args: {
                  ...(completionArgs ?? {}),
                  reasoning_effort: value as ReasoningEffort,
                },
              })
            }
          >
            {reasoningOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </theme.Select>
        </div>
      </theme.Card>

      <theme.Card size="small" title={t("other")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <theme.Input
            id="mistral_random_seed"
            type="number"
            step={1}
            label="Seed"
            value={randomSeed === undefined ? "" : String(randomSeed)}
            onChange={(e: any) => {
              const raw = e?.target?.value?.trim() ?? "";

              if (!raw) {
                submitConfig({
                  ...resolvedConfig,
                  completion_args: {
                    ...(completionArgs ?? {}),
                    random_seed: undefined,
                  },
                });
                return;
              }

              const parsed = Number(raw);

              submitConfig({
                ...resolvedConfig,
                completion_args: {
                  ...(completionArgs ?? {}),
                  random_seed: Number.isFinite(parsed)
                    ? Math.trunc(parsed)
                    : undefined,
                },
              });
            }}
          />

          <theme.Input
            type="number"
            min={-2}
            max={2}
            step={0.1}
            label="Presence penalty"
            value={presencePenalty ?? ""}
            onChange={(e: any) => {
              const raw = e?.target?.value?.trim() ?? "";
              const parsed = Number(raw);

              submitConfig({
                ...resolvedConfig,
                completion_args: {
                  ...(completionArgs ?? {}),
                  presence_penalty:
                    raw.length && Number.isFinite(parsed) ? parsed : undefined,
                },
              });
            }}
          />

          <theme.Input
            type="number"
            min={-2}
            max={2}
            step={0.1}
            label="Frequency penalty"
            value={frequencyPenalty ?? ""}
            onChange={(e: any) => {
              const raw = e?.target?.value?.trim() ?? "";
              const parsed = Number(raw);

              submitConfig({
                ...resolvedConfig,
                completion_args: {
                  ...(completionArgs ?? {}),
                  frequency_penalty:
                    raw.length && Number.isFinite(parsed) ? parsed : undefined,
                },
              });
            }}
          />
        </div>
      </theme.Card>
    </div>
  );
};
