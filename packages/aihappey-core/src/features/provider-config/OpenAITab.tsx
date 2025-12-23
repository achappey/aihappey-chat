import { useTranslation } from "aihappey-i18n";
import { useTheme } from "aihappey-components";


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
  }
};

const DEFAULT_FILE_SEARCH = {
  max_num_results: 10,
  vector_store_ids: "",
};

const EFFORTS = ["none", "low", "medium", "high"] as const;
type Effort = (typeof EFFORTS)[number];

const CONTEXT_SIZES = ["low", "medium", "high"] as const;
type ContextSize = (typeof CONTEXT_SIZES)[number];

export const OpenAITab = ({
  openai,
  updateOpenAI,
}: {
  openai: any;
  updateOpenAI: (val: any) => void;
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const summaryOptions = [
    { value: "auto", label: t("auto") },
    { value: "concise", label: t("concise") },
    { value: "detailed", label: t("detailed") },
  ];

  const modelOptions = [
    { value: "gpt-image-1", label: "gpt-image-1" },
    { value: "gpt-image-1-mini", label: "gpt-image-1-mini" }
  ];

  const qualityOptions = [
    { value: "auto", label: t("auto") },
    { value: "low", label: t("low") },
    { value: "medium", label: t("medium") },
    { value: "high", label: t("high") },
  ];

  const backgroundOptions = [
    { value: "auto", label: t("auto") },
    { value: "transparent", label: t("transparent") },
    { value: "opaque", label: t("opaque") }
  ];

  const sizeOptions = [
    { value: "auto", label: t("auto") },
    { value: "1024x1024", label: t("1024x1024") },
    { value: "1024x1536", label: t("1024x1536") },
    { value: "1536x1024", label: t("1536x1024") },
  ];

  const fidelityOptions = [
    { value: "low", label: t("low") },
    { value: "high", label: t("high") }
  ];

  // Reasoning block on/off
  const reasoningOn = !!openai.reasoning;
  const imageGenerationOn = !!openai.image_generation;
  // Web search block on/off
  const webSearchOn = !!openai.web_search;
  const fileSearchOn = !!openai.file_search;
  const codeInterpreterOn = !!openai.code_interpreter;
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
        title={t("reasoning")}
        headerActions={
          <theme.Switch
            id="reasoning"
            checked={reasoningOn}
            onChange={() => {
              updateOpenAI({
                ...openai,
                reasoning: reasoningOn ? undefined : { ...DEFAULT_REASONING },
              });
            }}
          />
        }
      >
        <div>

          <div
            style={{
              display: "flex",
              flexDirection: "row",
            }}
          >
            <theme.Slider
              label={`${t("reasoningEffort")} (${t(
                openai.reasoning?.effort ?? "none"
              )})`}
              disabled={!reasoningOn}
              min={0}
              max={EFFORTS.length - 1}
              step={1}
              style={{ flex: "1 1 0" }}
              value={effortToIndex(openai.reasoning?.effort as Effort)}
              onChange={(i: number) =>
                updateOpenAI({
                  ...openai,
                  reasoning: {
                    ...openai.reasoning,
                    effort: indexToEffort(i),
                  },
                })
              }
            />

            <theme.Select
              label={t("reasoningSummary")}
              style={{ flex: "1 1 0" }}
              values={[openai.reasoning?.summary || ""]}
              disabled={!reasoningOn}
              valueTitle={
                summaryOptions.find((a) => a.value === openai.reasoning?.summary)
                  ?.label
              }
              options={summaryOptions}
              onChange={(val: string) =>
                updateOpenAI({
                  ...openai,
                  reasoning: {
                    ...openai.reasoning,
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
            checked={openai?.include?.includes("reasoning.encrypted_content")}
            label={t("providers:openai.encryptedContent")}
            onChange={(value) => {
              updateOpenAI({
                ...openai,
                include: value ? [...openai.include ?? [], "reasoning.encrypted_content"]
                  : openai.include?.filter((a: any) => a != "reasoning.encrypted_content")
              });
            }}
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
            onChange={() => {
              updateOpenAI({
                ...openai,
                web_search: webSearchOn
                  ? undefined
                  : { ...DEFAULT_WEB_SEARCH },
              });
            }}
          />
        }
      >
        <div>
          <theme.Slider
            label={`${t("searchContextSize")} (${t(
              openai.web_search?.search_context_size ?? "medium"
            )})`}
            disabled={!webSearchOn}
            min={0}
            max={CONTEXT_SIZES.length - 1}
            step={1}
            value={sizeToIndex(
              openai.web_search?.search_context_size as ContextSize
            )}
            onChange={(i: number) =>
              updateOpenAI({
                ...openai,
                web_search: {
                  ...(openai.web_search ?? {}),
                  search_context_size: indexToSize(i), // <-- slaat 'low'/'medium'/'high' op
                  user_location: openai.web_search?.user_location ?? {
                    ...DEFAULT_WEB_SEARCH.user_location,
                  },
                },
              })
            }
          />
          <div style={{ display: "flex", gap: 12 }}>
            <theme.Input
              label={t("country")}
              placeholder="NL"
              disabled={!webSearchOn}
              value={openai.web_search?.user_location?.country || ""}
              style={{ minWidth: 70 }}
              onChange={(e: any) =>
                updateOpenAI({
                  ...openai,
                  web_search: {
                    ...openai.web_search,
                    user_location: {
                      ...openai.web_search.user_location,
                      country: e.target.value,
                    },
                  },
                })
              }
            />
            <theme.Input
              label={t("region")}
              placeholder="Noord-Holland"
              disabled={!webSearchOn}
              value={openai.web_search?.user_location?.region || ""}
              style={{ minWidth: 110 }}
              onChange={(e: any) =>
                updateOpenAI({
                  ...openai,
                  web_search: {
                    ...openai.web_search,
                    user_location: {
                      ...openai.web_search.user_location,
                      region: e.target.value,
                    },
                  },
                })
              }
            />
            <theme.Input
              label={t("city")}
              placeholder="Amsterdam"
              disabled={!webSearchOn}
              value={openai.web_search?.user_location?.city || ""}
              style={{ minWidth: 110 }}
              onChange={(e: any) =>
                updateOpenAI({
                  ...openai,
                  web_search: {
                    ...openai.web_search,
                    user_location: {
                      ...openai.web_search.user_location,
                      city: e.target.value,
                    },
                  },
                })
              }
            />

            <theme.Input
              label={t("timezone")}
              placeholder="Europe/Amsterdam"
              disabled={!webSearchOn}
              value={openai.web_search?.user_location?.timezone || ""}
              style={{ minWidth: 140 }}
              onChange={(e: any) =>
                updateOpenAI({
                  ...openai,
                  web_search: {
                    ...openai.web_search,
                    user_location: {
                      ...openai.web_search.user_location,
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
            checked={openai?.include?.includes("web_search_call.action.sources")}
            label={t("openai.includeSources")}
            onChange={(value) => {
              updateOpenAI({
                ...openai,
                include: value ? [...openai.include ?? [], "web_search_call.action.sources"]
                  : openai.include?.filter((a: any) => a != "web_search_call.action.sources")
              });
            }}
          />

        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={t("image_generation")}
        headerActions={
          <theme.Switch
            id="image_generation"
            checked={imageGenerationOn}
            onChange={() => {
              updateOpenAI({
                ...openai,
                image_generation: imageGenerationOn ? undefined : { ...DEFAULT_IMAGE_GENERATION },
              });
            }}
          />
        }
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
          }}
        >
          <theme.Select
            label={t("model")}
            style={{ flex: "1 1 0" }}
            values={[openai.image_generation?.model ?? "gpt-image-1"]}
            disabled={!imageGenerationOn}
            valueTitle={openai.image_generation?.model ?? "gpt-image-1"}
            options={modelOptions}
            onChange={(val: string) =>
              updateOpenAI({
                ...openai,
                image_generation: {
                  ...openai.image_generation,
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
            label={`${t("partial_images")} (${openai.image_generation?.partial_images ?? 0})`}
            disabled={!imageGenerationOn}
            min={0}
            max={3}
            step={1}
            style={{ flex: "1 1 0" }}
            value={openai.image_generation?.partial_images ?? 0}
            onChange={(i: number) =>
              updateOpenAI({
                ...openai,
                image_generation: {
                  ...openai.image_generation,
                  partial_images: i,
                },
              })
            }
          />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
          }}
        >

          <theme.Select
            label={t("input_fidelity")}
            style={{ flex: "1 1 0" }}
            values={[openai.image_generation?.input_fidelity || ""]}
            disabled={!imageGenerationOn}
            valueTitle={
              fidelityOptions.find((a) => a.value === openai.image_generation?.input_fidelity)
                ?.label
            }
            options={fidelityOptions}
            onChange={(val: string) =>
              updateOpenAI({
                ...openai,
                image_generation: {
                  ...openai.image_generation,
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
            label={t("quality")}
            style={{ flex: "1 1 0" }}
            values={[openai.image_generation?.quality || ""]}
            disabled={!imageGenerationOn}
            valueTitle={
              qualityOptions.find((a) => a.value === openai.image_generation?.quality)
                ?.label
            }
            options={qualityOptions}
            onChange={(val: string) =>
              updateOpenAI({
                ...openai,
                image_generation: {
                  ...openai.image_generation,
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


        <div
          style={{
            display: "flex",
            flexDirection: "row",
          }}
        >
          <theme.Select
            label={t("background")}
            style={{ flex: "1 1 0" }}
            values={[openai.image_generation?.background || ""]}
            disabled={!imageGenerationOn}
            valueTitle={
              backgroundOptions.find((a) => a.value === openai.image_generation?.background)
                ?.label
            }
            options={backgroundOptions}
            onChange={(val: string) =>
              updateOpenAI({
                ...openai,
                image_generation: {
                  ...openai.image_generation,
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
            label={t("size")}
            style={{ flex: "1 1 0" }}
            values={[openai.image_generation?.size || ""]}
            disabled={!imageGenerationOn}
            valueTitle={
              sizeOptions.find((a) => a.value === openai.image_generation?.size)
                ?.label
            }
            options={sizeOptions}
            onChange={(val: string) =>
              updateOpenAI({
                ...openai,
                image_generation: {
                  ...openai.image_generation,
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

      </theme.Card>



      <theme.Card
        size="small"
        title={t("code_execution")}
        headerActions={
          <theme.Switch
            id="codeInterpreter"
            checked={codeInterpreterOn}
            onChange={(val) =>
              updateOpenAI({
                ...openai,
                code_interpreter: !val
                  ? undefined
                  : {
                    ...DEFAULT_CODE_INTERPRETER,
                  },
              })
            }
          />
        }
      >
        <div>
          <theme.Input
            label={t("providers:openai.container")}
            placeholder="cntr_xxx or cntr_zzz"
            disabled={!codeInterpreterOn}
            value={(openai.code_interpreter?.container && typeof openai.code_interpreter?.container === 'string')
              ? openai.code_interpreter?.container : ""}
            onChange={(e: any) =>
              updateOpenAI({
                ...openai,
                code_interpreter:
                  e.target.value.trim() && e.target.value.trim().length > 0 ? {
                    container: e.target.value.trim()
                  } : {
                    ...DEFAULT_CODE_INTERPRETER
                  }
              })
            }
          />

          <theme.Switch
            id="includeOutputs"
            disabled={!codeInterpreterOn}
            checked={openai?.include?.includes("code_interpreter_call.outputs")}
            label={t("providers:openai.includeOutputs")}
            onChange={(value) => {
              updateOpenAI({
                ...openai,
                include: value ? [...openai.include ?? [], "code_interpreter_call.outputs"]
                  : openai.include?.filter((a: any) => a != "code_interpreter_call.outputs")
              });
            }}
          />
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={t("providers:openai.file_search")}
        headerActions={
          <theme.Switch
            id="fileSearch"
            checked={fileSearchOn}
            onChange={(val) =>
              updateOpenAI({
                ...openai,
                file_search: !val ? undefined : { ...DEFAULT_FILE_SEARCH },
              })
            }
          />
        }
      >
        <div>
          <theme.Slider
            label={
              openai.file_search?.max_num_results
                ? t("providers:openai.max_num_results") +
                ` (${openai.file_search?.max_num_results})`
                : t("providers:openai.max_num_results")
            }
            disabled={!fileSearchOn}
            min={1}
            max={50}
            value={openai.file_search?.max_num_results ?? 10}
            onChange={(e) =>
              updateOpenAI({
                ...openai,
                file_search: {
                  ...openai.file_search,
                  max_num_results: e,
                },
              })
            }
          />
          <theme.Input
            label={t("providers:openai.vector_store_ids")}
            placeholder="vs_xxx, vs_zzz"
            disabled={!fileSearchOn}
            value={(openai.file_search?.vector_store_ids || []).join(", ")}
            onChange={(e: any) =>
              updateOpenAI({
                ...openai,
                file_search: {
                  ...openai.file_search,
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
            checked={openai?.include?.includes("file_search_call.results")}
            disabled={!fileSearchOn}
            label={t("providers:openai.includeSearchResults")}
            onChange={(value) => {
              updateOpenAI({
                ...openai,
                include: value ? [...openai.include ?? [], "file_search_call.results"]
                  : openai.include?.filter((a: any) => a != "file_search_call.results")
              });
            }}
          />
        </div>
      </theme.Card>

      <theme.Card
        size="small"
        title={t("nativeMcp")}
        headerActions={
          <theme.Switch
            id="nativeMcp"
            checked={!!openai?.native_mcp}
            onChange={(val) =>
              updateOpenAI({
                ...openai,
                native_mcp: val,
              })
            }
          />
        }
      ></theme.Card>

      <theme.Switch
        id="parallelToolCalls"
        checked={openai?.parallel_tool_calls}
        label={t("parallelToolCalls")}
        onChange={(value) => {
          updateOpenAI({
            ...openai,
            parallel_tool_calls: value,
          });
        }}
      />

      <theme.TextArea
        label={t("providers:openai.instructions")}
        placeholder={t("providers:openai.instructionsPlaceholder")}
        rows={5}
        value={openai?.instructions}
        onChange={(value) => {
          updateOpenAI({
            ...openai,
            instructions: value,
          });
        }}></theme.TextArea>

    </div>
  );
};
