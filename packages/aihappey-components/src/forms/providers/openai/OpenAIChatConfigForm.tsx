import { useTheme } from "../../../theme/ThemeContext";

// Default OpenAI config blocks
const DEFAULT_REASONING = {
  effort: "low",
  summary: "auto",
};

const DEFAULT_IMAGE_GENERATION = {
  size: "auto",
  quality: "auto",
  input_fidelity: "low",
  background: "auto",
  partial_images: 3,
};

const DEFAULT_WEB_SEARCH = {
  search_context_size: "medium",
  user_location: {
    country: "",
    region: "",
    city: "",
    timezone: "",
    type: "approximate",
  },
};

const DEFAULT_CODE_INTERPRETER = {
  container: {
    type: "auto",
  },
};

const DEFAULT_FILE_SEARCH = {
  max_num_results: 10,
  vector_store_ids: "",
};

const EFFORTS = ["none", "low", "medium", "high"] as const;
type Effort = (typeof EFFORTS)[number];

const CONTEXT_SIZES = ["low", "medium", "high"] as const;
type ContextSize = (typeof CONTEXT_SIZES)[number];

export type OpenAIChatConfigFormTranslations = {
  reasoning?: string;
  reasoningEffort?: string;
  reasoningSummary?: string;
  encryptedContent?: string;

  webSearch?: string;
  searchContextSize?: string;
  includeSources?: string;

  image_generation?: string;
  model?: string;
  partial_images?: string;
  input_fidelity?: string;
  quality?: string;
  background?: string;
  size?: string;

  code_execution?: string;
  container?: string;
  includeOutputs?: string;

  file_search?: string;
  max_num_results?: string;
  vector_store_ids?: string;
  includeSearchResults?: string;

  nativeMcp?: string;
  parallelToolCalls?: string;

  instructionsLabel?: string;
  instructionsPlaceholder?: string;

  budget?: string;

  // common
  auto?: string;
  concise?: string;
  detailed?: string;

  low?: string;
  medium?: string;
  high?: string;
  none?: string;

  transparent?: string;
  opaque?: string;

  country?: string;
  region?: string;
  city?: string;
  timezone?: string;

  // sizes
  s1024x1024?: string;
  s1024x1536?: string;
  s1536x1024?: string;
};

export const OpenAIChatConfigForm = ({
  config,
  updateConfig,
  translations,
}: {
  config: any;
  updateConfig: (val: any) => void;
  translations?: OpenAIChatConfigFormTranslations;
}) => {
  const theme = useTheme();

  const summaryOptions = [
    { value: "auto", label: translations?.auto ?? "auto" },
    { value: "concise", label: translations?.concise ?? "concise" },
    { value: "detailed", label: translations?.detailed ?? "detailed" },
  ];

  const modelOptions = [
    { value: "gpt-image-1", label: "gpt-image-1" },
    { value: "gpt-image-1-mini", label: "gpt-image-1-mini" },
  ];

  const qualityOptions = [
    { value: "auto", label: translations?.auto ?? "auto" },
    { value: "low", label: translations?.low ?? "low" },
    { value: "medium", label: translations?.medium ?? "medium" },
    { value: "high", label: translations?.high ?? "high" },
  ];

  const backgroundOptions = [
    { value: "auto", label: translations?.auto ?? "auto" },
    { value: "transparent", label: translations?.transparent ?? "transparent" },
    { value: "opaque", label: translations?.opaque ?? "opaque" },
  ];

  // keep exact underlying values, but map labels to translation keys
  const sizeOptions = [
    { value: "auto", label: translations?.auto ?? "auto" },
    { value: "1024x1024", label: translations?.s1024x1024 ?? "1024x1024" },
    { value: "1024x1536", label: translations?.s1024x1536 ?? "1024x1536" },
    { value: "1536x1024", label: translations?.s1536x1024 ?? "1536x1024" },
  ];

  const fidelityOptions = [
    { value: "low", label: translations?.low ?? "low" },
    { value: "high", label: translations?.high ?? "high" },
  ];

  const reasoningOn = !!config?.reasoning;
  const imageGenerationOn = !!config?.image_generation;
  const webSearchOn = !!config?.web_search;
  const fileSearchOn = !!config?.file_search;
  const codeInterpreterOn = !!config?.code_interpreter;

  const effortToIndex = (e?: Effort) =>
    Math.max(0, EFFORTS.indexOf((e ?? "none") as Effort));

  const indexToEffort = (i: number): Effort =>
    EFFORTS[Math.min(EFFORTS.length - 1, Math.max(0, i))];

  const sizeToIndex = (s?: ContextSize) =>
    Math.max(0, CONTEXT_SIZES.indexOf((s ?? "medium") as ContextSize));

  const indexToSize = (i: number): ContextSize =>
    CONTEXT_SIZES[Math.min(CONTEXT_SIZES.length - 1, Math.max(0, i))];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <theme.Card
        size="small"
        title={translations?.reasoning ?? "reasoning"}
        headerActions={
          <theme.Switch
            id="reasoning"
            checked={reasoningOn}
            onChange={() => {
              updateConfig({
                ...config,
                reasoning: reasoningOn ? undefined : { ...DEFAULT_REASONING },
              });
            }}
          />
        }
      >
        <div>
          <div style={{ display: "flex", flexDirection: "row" }}>
            <theme.Slider
              label={`${translations?.reasoningEffort ?? "reasoningEffort"} (${(translations as any)?.[
                config?.reasoning?.effort ?? "none"
              ] ?? (config?.reasoning?.effort ?? "none")})`}
              disabled={!reasoningOn}
              min={0}
              max={EFFORTS.length - 1}
              step={1}
              style={{ flex: "1 1 0" }}
              value={effortToIndex(config?.reasoning?.effort as Effort)}
              onChange={(i: number) =>
                updateConfig({
                  ...config,
                  reasoning: {
                    ...config.reasoning,
                    effort: indexToEffort(i),
                  },
                })
              }
            />

            <theme.Select
              label={translations?.reasoningSummary ?? "reasoningSummary"}
              style={{ flex: "1 1 0" }}
              values={[config?.reasoning?.summary || ""]}
              disabled={!reasoningOn}
              valueTitle={
                summaryOptions.find((a) => a.value === config?.reasoning?.summary)
                  ?.label
              }
              options={summaryOptions}
              onChange={(val: string) =>
                updateConfig({
                  ...config,
                  reasoning: {
                    ...config.reasoning,
                    summary: val,
                  },
                })
              }
            >
              {summaryOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </theme.Select>
          </div>

          <theme.Switch
            id="encryptedContent"
            disabled={!reasoningOn}
            checked={config?.include?.includes("reasoning.encrypted_content")}
            label={translations?.encryptedContent ?? "encryptedContent"}
            onChange={(value) => {
              updateConfig({
                ...config,
                include: value
                  ? [...(config.include ?? []), "reasoning.encrypted_content"]
                  : config.include?.filter(
                      (a: any) => a != "reasoning.encrypted_content"
                    ),
              });
            }}
          />
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={translations?.webSearch ?? "webSearch"}
        headerActions={
          <theme.Switch
            id="webSearch"
            checked={webSearchOn}
            onChange={() => {
              updateConfig({
                ...config,
                web_search: webSearchOn ? undefined : { ...DEFAULT_WEB_SEARCH },
              });
            }}
          />
        }
      >
        <div>
          <theme.Slider
            label={`${translations?.searchContextSize ?? "searchContextSize"} (${(translations as any)?.[
              config?.web_search?.search_context_size ?? "medium"
            ] ?? (config?.web_search?.search_context_size ?? "medium")})`}
            disabled={!webSearchOn}
            min={0}
            max={CONTEXT_SIZES.length - 1}
            step={1}
            value={sizeToIndex(config?.web_search?.search_context_size as ContextSize)}
            onChange={(i: number) =>
              updateConfig({
                ...config,
                web_search: {
                  ...(config.web_search ?? {}),
                  search_context_size: indexToSize(i),
                  user_location:
                    config.web_search?.user_location ?? { ...DEFAULT_WEB_SEARCH.user_location },
                },
              })
            }
          />

          <div style={{ display: "flex", gap: 12 }}>
            <theme.Input
              label={translations?.country ?? "country"}
              placeholder="NL"
              disabled={!webSearchOn}
              value={config?.web_search?.user_location?.country || ""}
              style={{ minWidth: 70 }}
              onChange={(e: any) =>
                updateConfig({
                  ...config,
                  web_search: {
                    ...config.web_search,
                    user_location: {
                      ...config.web_search.user_location,
                      country: e.target.value,
                    },
                  },
                })
              }
            />
            <theme.Input
              label={translations?.region ?? "region"}
              placeholder="Noord-Holland"
              disabled={!webSearchOn}
              value={config?.web_search?.user_location?.region || ""}
              style={{ minWidth: 110 }}
              onChange={(e: any) =>
                updateConfig({
                  ...config,
                  web_search: {
                    ...config.web_search,
                    user_location: {
                      ...config.web_search.user_location,
                      region: e.target.value,
                    },
                  },
                })
              }
            />
            <theme.Input
              label={translations?.city ?? "city"}
              placeholder="Amsterdam"
              disabled={!webSearchOn}
              value={config?.web_search?.user_location?.city || ""}
              style={{ minWidth: 110 }}
              onChange={(e: any) =>
                updateConfig({
                  ...config,
                  web_search: {
                    ...config.web_search,
                    user_location: {
                      ...config.web_search.user_location,
                      city: e.target.value,
                    },
                  },
                })
              }
            />
            <theme.Input
              label={translations?.timezone ?? "timezone"}
              placeholder="Europe/Amsterdam"
              disabled={!webSearchOn}
              value={config?.web_search?.user_location?.timezone || ""}
              style={{ minWidth: 140 }}
              onChange={(e: any) =>
                updateConfig({
                  ...config,
                  web_search: {
                    ...config.web_search,
                    user_location: {
                      ...config.web_search.user_location,
                      timezone: e.target.value,
                    },
                  },
                })
              }
            />
          </div>

          <theme.Switch
            id="includeSources"
            disabled={!webSearchOn}
            checked={config?.include?.includes("web_search_call.action.sources")}
            label={translations?.includeSources ?? "includeSources"}
            onChange={(value) => {
              updateConfig({
                ...config,
                include: value
                  ? [...(config.include ?? []), "web_search_call.action.sources"]
                  : config.include?.filter(
                      (a: any) => a != "web_search_call.action.sources"
                    ),
              });
            }}
          />
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={translations?.image_generation ?? "image_generation"}
        headerActions={
          <theme.Switch
            id="image_generation"
            checked={imageGenerationOn}
            onChange={() => {
              updateConfig({
                ...config,
                image_generation: imageGenerationOn
                  ? undefined
                  : { ...DEFAULT_IMAGE_GENERATION },
              });
            }}
          />
        }
      >
        <div>
          <div style={{ display: "flex", flexDirection: "row" }}>
            <theme.Select
              label={translations?.model ?? "model"}
              style={{ flex: "1 1 0" }}
              values={[config?.image_generation?.model ?? "gpt-image-1"]}
              disabled={!imageGenerationOn}
              valueTitle={config?.image_generation?.model ?? "gpt-image-1"}
              options={modelOptions}
              onChange={(val: string) =>
                updateConfig({
                  ...config,
                  image_generation: {
                    ...config.image_generation,
                    model: val,
                  },
                })
              }
            >
              {modelOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </theme.Select>

            <theme.Slider
              label={`${translations?.partial_images ?? "partial_images"} (${
                config?.image_generation?.partial_images ?? 0
              })`}
              disabled={!imageGenerationOn}
              min={0}
              max={3}
              step={1}
              style={{ flex: "1 1 0" }}
              value={config?.image_generation?.partial_images ?? 0}
              onChange={(i: number) =>
                updateConfig({
                  ...config,
                  image_generation: {
                    ...config.image_generation,
                    partial_images: i,
                  },
                })
              }
            />
          </div>

          <div style={{ display: "flex", flexDirection: "row" }}>
            <theme.Select
              label={translations?.input_fidelity ?? "input_fidelity"}
              style={{ flex: "1 1 0" }}
              values={[config?.image_generation?.input_fidelity || ""]}
              disabled={!imageGenerationOn}
              valueTitle={
                fidelityOptions.find(
                  (a) => a.value === config?.image_generation?.input_fidelity
                )?.label
              }
              options={fidelityOptions}
              onChange={(val: string) =>
                updateConfig({
                  ...config,
                  image_generation: {
                    ...config.image_generation,
                    input_fidelity: val,
                  },
                })
              }
            >
              {fidelityOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </theme.Select>

            <theme.Select
              label={translations?.quality ?? "quality"}
              style={{ flex: "1 1 0" }}
              values={[config?.image_generation?.quality || ""]}
              disabled={!imageGenerationOn}
              valueTitle={
                qualityOptions.find(
                  (a) => a.value === config?.image_generation?.quality
                )?.label
              }
              options={qualityOptions}
              onChange={(val: string) =>
                updateConfig({
                  ...config,
                  image_generation: {
                    ...config.image_generation,
                    quality: val,
                  },
                })
              }
            >
              {qualityOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </theme.Select>
          </div>

          <div style={{ display: "flex", flexDirection: "row" }}>
            <theme.Select
              label={translations?.background ?? "background"}
              style={{ flex: "1 1 0" }}
              values={[config?.image_generation?.background || ""]}
              disabled={!imageGenerationOn}
              valueTitle={
                backgroundOptions.find(
                  (a) => a.value === config?.image_generation?.background
                )?.label
              }
              options={backgroundOptions}
              onChange={(val: string) =>
                updateConfig({
                  ...config,
                  image_generation: {
                    ...config.image_generation,
                    background: val,
                  },
                })
              }
            >
              {backgroundOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </theme.Select>

            <theme.Select
              label={translations?.size ?? "size"}
              style={{ flex: "1 1 0" }}
              values={[config?.image_generation?.size || ""]}
              disabled={!imageGenerationOn}
              valueTitle={
                sizeOptions.find((a) => a.value === config?.image_generation?.size)
                  ?.label
              }
              options={sizeOptions}
              onChange={(val: string) =>
                updateConfig({
                  ...config,
                  image_generation: {
                    ...config.image_generation,
                    size: val,
                  },
                })
              }
            >
              {sizeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </theme.Select>
          </div>
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={translations?.code_execution ?? "code_execution"}
        headerActions={
          <theme.Switch
            id="codeInterpreter"
            checked={codeInterpreterOn}
            onChange={(val) =>
              updateConfig({
                ...config,
                code_interpreter: !val ? undefined : { ...DEFAULT_CODE_INTERPRETER },
              })
            }
          />
        }
      >
        <div>
          <theme.Input
            label={translations?.container ?? "container"}
            placeholder="cntr_xxx or cntr_zzz"
            disabled={!codeInterpreterOn}
            value={
              config?.code_interpreter?.container &&
              typeof config?.code_interpreter?.container === "string"
                ? config?.code_interpreter?.container
                : ""
            }
            onChange={(e: any) =>
              updateConfig({
                ...config,
                code_interpreter:
                  e.target.value.trim() && e.target.value.trim().length > 0
                    ? { container: e.target.value.trim() }
                    : { ...DEFAULT_CODE_INTERPRETER },
              })
            }
          />

          <theme.Switch
            id="includeOutputs"
            disabled={!codeInterpreterOn}
            checked={config?.include?.includes("code_interpreter_call.outputs")}
            label={translations?.includeOutputs ?? "includeOutputs"}
            onChange={(value) => {
              updateConfig({
                ...config,
                include: value
                  ? [...(config.include ?? []), "code_interpreter_call.outputs"]
                  : config.include?.filter(
                      (a: any) => a != "code_interpreter_call.outputs"
                    ),
              });
            }}
          />
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={translations?.file_search ?? "file_search"}
        headerActions={
          <theme.Switch
            id="fileSearch"
            checked={fileSearchOn}
            onChange={(val) =>
              updateConfig({
                ...config,
                file_search: !val ? undefined : { ...DEFAULT_FILE_SEARCH },
              })
            }
          />
        }
      >
        <div>
          <theme.Slider
            label={
              config?.file_search?.max_num_results
                ? (translations?.max_num_results ?? "max_num_results") +
                  ` (${config?.file_search?.max_num_results})`
                : translations?.max_num_results ?? "max_num_results"
            }
            disabled={!fileSearchOn}
            min={1}
            max={50}
            value={config?.file_search?.max_num_results ?? 10}
            onChange={(e) =>
              updateConfig({
                ...config,
                file_search: {
                  ...config.file_search,
                  max_num_results: e,
                },
              })
            }
          />

          <theme.Input
            label={translations?.vector_store_ids ?? "vector_store_ids"}
            placeholder="vs_xxx, vs_zzz"
            disabled={!fileSearchOn}
            value={(config?.file_search?.vector_store_ids || []).join(", ")}
            onChange={(e: any) =>
              updateConfig({
                ...config,
                file_search: {
                  ...config.file_search,
                  vector_store_ids: e.target.value
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean),
                },
              })
            }
          />

          <theme.Switch
            id="includeSearchResults"
            checked={config?.include?.includes("file_search_call.results")}
            disabled={!fileSearchOn}
            label={translations?.includeSearchResults ?? "includeSearchResults"}
            onChange={(value) => {
              updateConfig({
                ...config,
                include: value
                  ? [...(config.include ?? []), "file_search_call.results"]
                  : config.include?.filter(
                      (a: any) => a != "file_search_call.results"
                    ),
              });
            }}
          />
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={translations?.nativeMcp ?? "nativeMcp"}
        headerActions={
          <theme.Switch
            id="nativeMcp"
            checked={!!config?.native_mcp}
            onChange={(val) =>
              updateConfig({
                ...config,
                native_mcp: val,
              })
            }
          />
        }
      />

      <theme.Switch
        id="parallelToolCalls"
        checked={config?.parallel_tool_calls}
        label={translations?.parallelToolCalls ?? "parallelToolCalls"}
        onChange={(value) =>
          updateConfig({
            ...config,
            parallel_tool_calls: value,
          })
        }
      />

      <theme.TextArea
        label={translations?.instructionsLabel ?? "instructions"}
        placeholder={translations?.instructionsPlaceholder ?? "instructions"}
        rows={5}
        value={config?.instructions}
        onChange={(value) =>
          updateConfig({
            ...config,
            instructions: value,
          })
        }
      />
    </div>
  );
};
