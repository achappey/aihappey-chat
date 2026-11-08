import { useEffect, useState } from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../theme/ThemeContext";
import { OpenRouterNumberInput, openRouterGrid, openRouterStack } from "./OpenRouterFields";
import {
  getOpenRouterTools,
  isOpenRouterNameAvailable,
  optionalString,
  pruneOpenRouterObject,
  setOpenRouterTools,
  withOpenRouterParameters,
  type OpenRouterTool,
} from "./openRouterToolConfig";

const WORKER_TOOLS = [
  ["openrouter:web_search", "webSearchServerTool"],
  ["openrouter:web_fetch", "webFetchServerTool"],
  ["openrouter:datetime", "datetimeServerTool"],
  ["openrouter:image_generation", "imageGenerationServerTool"],
  ["openrouter:experimental__search_models", "searchModelsServerTool"],
] as const;

const DelegationNameInput = ({ name, validName, onChange, disabled }: {
  name?: string;
  validName: (name: string) => boolean;
  onChange: (name: string | undefined) => void;
  disabled?: boolean;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [draft, setDraft] = useState(name ?? "");
  useEffect(() => setDraft(name ?? ""), [name]);
  const valid = validName(draft);
  return <theme.Input label={t("providers:openrouter.name")} value={draft} maxLength={64} disabled={disabled}
    aria-invalid={!valid} hint={valid ? undefined : t("providers:openrouter.invalidName")}
    onChange={event => {
      setDraft(event.target.value);
      if (validName(event.target.value)) onChange(optionalString(event.target.value));
    }} />;
};

export const OpenRouterDelegationCard = ({ config, updateConfig, kind }: {
  config: any;
  updateConfig: (config: any) => void;
  kind: "advisor" | "subagent";
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const tr = (key: string) => t(`providers:openrouter.${key}`);
  const type = `openrouter:${kind}`;
  const tools = getOpenRouterTools(config, type);
  const enabled = tools.length > 0;
  const updateTools = (next: OpenRouterTool[]) => updateConfig(setOpenRouterTools(config, type, next));
  const patchTool = (index: number, patch: Record<string, any>) =>
    updateTools(tools.map((tool, current) => current === index ? withOpenRouterParameters(tool, patch) : tool));
  const addTool = () => {
    let index = tools.length + 1;
    while (tools.some(tool => tool.parameters?.name === `${kind}-${index}`)) index++;
    updateTools([...tools, { type, parameters: { name: `${kind}-${index}` } }]);
  };

  return <theme.Card size="small" title={tr(`${kind}ServerTool`)} headerActions={
    <theme.Switch id={`openrouter-${kind}`} checked={enabled}
      onChange={checked => updateTools(checked ? [{ type }] : [])} />
  }>
    {enabled && <div style={openRouterStack}>
      {tools.map((tool, index) => {
        const parameters = tool.parameters ?? {};
        const patch = (value: Record<string, any>) => patchTool(index, value);
        const patchReasoning = (value: Record<string, any>) => patch({
          reasoning: pruneOpenRouterObject({ ...parameters.reasoning, ...value }),
        });
        return <div key={index} style={openRouterStack}>
          <div style={openRouterGrid}>
            <DelegationNameInput name={parameters.name}
              validName={name => isOpenRouterNameAvailable(tools, index, name)}
              onChange={name => patch({ name })} />
            <theme.Input label={tr("model")} value={parameters.model ?? ""}
              placeholder={kind === "advisor" ? "~anthropic/claude-opus-latest" : "~anthropic/claude-haiku-latest"}
              onChange={event => patch({ model: optionalString(event.target.value) })} />
          </div>
          <theme.TextArea label={tr("instructions")} value={parameters.instructions ?? ""}
            onChange={value => patch({ instructions: optionalString(value) })} />
          <div style={openRouterGrid}>
            <OpenRouterNumberInput label={tr("maxCompletionTokens")} value={parameters.max_completion_tokens}
              onChange={max_completion_tokens => patch({ max_completion_tokens })} />
            <OpenRouterNumberInput label={tr("temperature")} value={parameters.temperature}
              min={0} max={2} integer={false} onChange={temperature => patch({ temperature })} />
            <theme.Input label={tr("reasoningEffort")} value={parameters.reasoning?.effort ?? ""}
              placeholder="high" onChange={event => patchReasoning({ effort: optionalString(event.target.value) })} />
            <OpenRouterNumberInput label={tr("reasoningMaxTokens")} value={parameters.reasoning?.max_tokens}
              onChange={max_tokens => patchReasoning({ max_tokens })} />
          </div>
          {kind === "advisor" ? <theme.Switch id={`openrouter-advisor-transcript-${index}`}
            label={tr("forwardTranscript")} checked={!!parameters.forward_transcript}
            onChange={forward_transcript => patch({ forward_transcript })} /> : <>
            <OpenRouterNumberInput label={tr("maxToolCalls")} value={parameters.max_tool_calls} max={25}
              onChange={max_tool_calls => patch({ max_tool_calls })} />
            <div style={openRouterGrid}>
              {WORKER_TOOLS.map(([workerType, label]) => {
                const workerTools: OpenRouterTool[] = Array.isArray(parameters.tools) ? parameters.tools : [];
                return <theme.Switch key={workerType} id={`openrouter-subagent-${index}-${workerType}`}
                  label={tr(label)} checked={workerTools.some(entry => entry.type === workerType)}
                  onChange={checked => patch({
                    tools: checked ? [...workerTools, { type: workerType }]
                      : workerTools.filter(entry => entry.type !== workerType).length
                        ? workerTools.filter(entry => entry.type !== workerType) : undefined,
                  })} />;
              })}
            </div>
          </>}
          {tools.length > 1 && <theme.Button size="small" variant="transparent"
            onClick={() => updateTools(tools.filter((_, current) => current !== index))}>
            {tr("remove")}
          </theme.Button>}
        </div>;
      })}
      <theme.Button size="small" variant="transparent" onClick={addTool}>{tr("add")}</theme.Button>
    </div>}
  </theme.Card>;
};
