import { useState } from "react";
import { useTranslation } from "aihappey-i18n";
import { useTheme } from "../../../../theme/ThemeContext";
import { optionalLines, optionalString, selectAgentTools, updateAgentTool, updateSessionConfig, AGENT_TOOL_TYPES } from "./managedSessionConfig";

const EFFORTS = ["none", "minimal", "low", "medium", "high", "xhigh", "max"];
const SUMMARIES = ["concise", "detailed", "auto"];
const TIERS = ["auto", "default", "flex", "priority", "fast", "ultrafast"];
const VERBOSITIES = ["low", "medium", "high"];

const twoColumnGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  columnGap: 0,
  rowGap: 12,
  width: "100%",
  alignItems: "end",
} as const;

export const OpenAIAgentSessionCard = ({ config, updateConfig }: { config: any; updateConfig: (value: any) => void }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const tr = (key: string) => t(`providers:openai.sessionAgent.${key}`);
  const agent = config?.agent;
  const enabled = agent != null;
  const tools = selectAgentTools(agent?.tools);
  const webSearch = tools.find((tool) => tool.type === "web_search");
  const computerUse = tools.find((tool) => tool.type === "computer_use");
  const programmatic = tools.find((tool) => tool.type === "programmatic_tool_calling");
  const [schemaDraft, setSchemaDraft] = useState<string | undefined>();
  const format = agent?.text?.format;
  const schemaValue = schemaDraft ?? JSON.stringify(format?.schema ?? {}, null, 2);
  let validSchema = false;
  try {
    const parsed = JSON.parse(schemaValue);
    validSchema = !!parsed && typeof parsed === "object" && !Array.isArray(parsed);
  } catch { /* Keep the uncommitted draft visible until it is valid. */ }

  const save = (next: any) => updateConfig(updateSessionConfig(config, "agent", next));
  const patch = (next: any) => save({ ...agent, ...next });
  const patchTool = (type: typeof AGENT_TOOL_TYPES[number], next: any) =>
    patch({ tools: tools.map((tool) => tool.type === type ? { ...tool, ...next } : tool) });
  const toggleTool = (type: typeof AGENT_TOOL_TYPES[number], on: boolean) =>
    patch({ tools: updateAgentTool(tools, type, on) });

  const select = (label: string, value: string, options: string[], onChange: (value: string) => void) => (
    <theme.Select label={label} values={[value]} valueTitle={value || tr("inherit")} disabled={!enabled} onChange={onChange}>
      <option value="">{tr("inherit")}</option>
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </theme.Select>
  );

  return <theme.Card size="small" title={tr("title")} headerActions={
    <theme.Switch id="openai-session-agent-enabled" checked={enabled} onChange={(on: boolean) =>
      save(on ? { ...(agent ?? {}) , tools: selectAgentTools(agent?.tools) } : undefined)} />
  }>
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <theme.Input label={tr("model")} disabled={!enabled} value={agent?.model ?? ""}
        onChange={(e: any) => patch({ model: optionalString(e.target.value) })} />
      <theme.TextArea label={tr("instructions")} rows={3} value={agent?.instructions ?? ""}
        onChange={(e: any) => patch({ instructions: optionalString(e.target.value) })} />
      <div style={twoColumnGrid}>
        {select(tr("effort"), agent?.reasoning?.effort ?? "", EFFORTS,
          (effort) => patch({ reasoning: { ...agent?.reasoning, effort: effort || undefined } }))}
        {select(tr("summary"), agent?.reasoning?.summary ?? "", SUMMARIES,
          (summary) => patch({ reasoning: { ...agent?.reasoning, summary: summary || undefined } }))}
      </div>
      {select(tr("serviceTier"), agent?.service_tier ?? "", TIERS,
        (service_tier) => patch({ service_tier: service_tier || undefined }))}
      <div style={twoColumnGrid}>
        {select(tr("verbosity"), agent?.text?.verbosity ?? "", VERBOSITIES,
          (verbosity) => patch({ text: { ...agent?.text, verbosity: verbosity || undefined } }))}
        {select(tr("format"), format?.type ?? "", ["text", "json_schema"], (type) => {
          setSchemaDraft(undefined);
          patch({ text: { ...agent?.text, format: type === "json_schema" ? { type, schema: {} } : type === "text" ? { type } : undefined } });
        })}
      </div>
      {format?.type === "json_schema" && <theme.TextArea label={tr("schema")} rows={5}
        value={schemaValue} onChange={(e: any) => {
          const raw = String(e.target.value);
          setSchemaDraft(raw);
          try {
            const schema = JSON.parse(raw);
            if (schema && typeof schema === "object" && !Array.isArray(schema)) {
              patch({ text: { ...agent?.text, format: { type: "json_schema", schema } } });
            }
          } catch { /* Do not persist invalid JSON. */ }
        }} />}
      {format?.type === "json_schema" && !validSchema && <div style={{ fontSize: 12 }}>{tr("invalidSchema")}</div>}
      <theme.Switch id="openai-session-subagents" label={tr("multiAgent")} disabled={!enabled}
        checked={!!agent?.multi_agent?.enabled} onChange={(on: boolean) =>
          patch({ multi_agent: on ? { enabled: true } : undefined })} />
      {!!agent?.multi_agent?.enabled && <theme.Input label={tr("maxSubagents")} type="number" min={1} step={1} disabled={!enabled}
        value={agent.multi_agent.max_concurrent_subagents ?? ""} onChange={(e: any) => {
          const value = String(e.target.value);
          if (value && (!Number.isInteger(Number(value)) || Number(value) < 1)) return;
          patch({ multi_agent: { ...agent.multi_agent, max_concurrent_subagents: value ? Number(value) : undefined } });
        }} />}
      <div style={{ fontWeight: 600 }}>{tr("tools")}</div>
      {AGENT_TOOL_TYPES.map((type) => <theme.Switch key={type} id={`openai-session-${type}`}
        label={tr(type)} disabled={!enabled} checked={tools.some((tool) => tool.type === type)}
        onChange={(on: boolean) => toggleTool(type, on)} />)}
      {computerUse && <theme.Switch id="openai-session-screenshots" label={tr("screenshots")} disabled={!enabled}
        checked={!!computerUse.include_screenshots} onChange={(on: boolean) => patchTool("computer_use", { include_screenshots: on })} />}
      {programmatic && <theme.Switch id="openai-session-programmatic-enabled" label={tr("programmaticEnabled")}
        disabled={!enabled} checked={programmatic.enabled !== false}
        onChange={(on: boolean) => patchTool("programmatic_tool_calling", { enabled: on })} />}
      {webSearch && <>
        <div style={twoColumnGrid}>
          {select(tr("searchMode"), webSearch.mode ?? "", ["disabled", "cached", "live"],
            (mode) => patchTool("web_search", { mode: mode || undefined }))}
          {select(tr("searchContext"), webSearch.context_size ?? "", ["low", "medium", "high"],
            (context_size) => patchTool("web_search", { context_size: context_size || undefined }))}
        </div>
        <theme.TextArea label={tr("allowedDomains")} rows={2}
          value={(webSearch.allowed_domains ?? []).join("\n")}
          onChange={(e: any) => patchTool("web_search", { allowed_domains: optionalLines(e.target.value).length ? optionalLines(e.target.value) : undefined })} />
        <div style={{ display: "flex", gap: 12 }}>
          {(["country", "region", "city", "timezone"] as const).map((key) => <theme.Input key={key} label={tr(key)} disabled={!enabled}
            style={{ minWidth: key === "country" ? 70 : key === "timezone" ? 140 : 110 }}
            value={webSearch.location?.[key] ?? ""} onChange={(e: any) =>
              patchTool("web_search", { location: { ...webSearch.location, [key]: optionalString(e.target.value) } })} />)}
        </div>
      </>}
    </div>
  </theme.Card>;
};
