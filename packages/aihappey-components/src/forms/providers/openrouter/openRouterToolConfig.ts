export type OpenRouterTool = {
  type: string;
  parameters?: Record<string, any>;
  [key: string]: any;
};

export const OPENROUTER_TOOL_TYPES = [
  "openrouter:web_search",
  "openrouter:datetime",
  "openrouter:image_generation",
  "openrouter:web_fetch",
  "openrouter:advisor",
  "openrouter:subagent",
  "openrouter:experimental__search_models",
] as const;

export const getOpenRouterTools = (config: any, type: string): OpenRouterTool[] => {
  const tools = Array.isArray(config?.tools)
    ? config.tools.filter((tool: OpenRouterTool) => tool?.type === type)
    : [];
  if (tools.length) return tools;
  const legacy = config?.[type];
  return legacy ? (Array.isArray(legacy) ? legacy : [legacy]).map(tool => ({ ...tool, type })) : [];
};

// Only migrate this form's old keyed entries. In particular, never regroup tools:
// advisor/subagent identity is positional and multiple entries are valid.
export const canonicalizeOpenRouterConfig = (config: any) => {
  const { headers: _headers, ...next } = config ?? {};
  const tools: OpenRouterTool[] = Array.isArray(next.tools) ? [...next.tools] : [];
  for (const type of OPENROUTER_TOOL_TYPES) {
    if (!tools.some(tool => tool?.type === type)) tools.push(...getOpenRouterTools(next, type));
    delete next[type];
  }
  delete next.tools;
  return tools.length ? { ...next, tools } : next;
};

export const setOpenRouterTools = (config: any, type: string, replacements: OpenRouterTool[]) => {
  const next = canonicalizeOpenRouterConfig(config);
  const tools: OpenRouterTool[] = next.tools ?? [];
  const lastIndex = tools.reduce((last, tool, index) => tool?.type === type ? index : last, -1);
  let index = 0;
  const updated = tools.flatMap((tool, position) => {
    if (tool?.type !== type) return [tool];
    const replacement = replacements[index++];
    const result = replacement ? [replacement] : [];
    if (position === lastIndex) result.push(...replacements.slice(index));
    return result;
  });
  if (lastIndex < 0) updated.push(...replacements);
  const { tools: _tools, ...rest } = next;
  return updated.length ? { ...rest, tools: updated } : rest;
};

export const optionalString = (value: unknown) => {
  const trimmed = String(value ?? "").trim();
  return trimmed || undefined;
};

export const parseOpenRouterList = (value: unknown): string[] | undefined => {
  const items = (Array.isArray(value) ? value : String(value ?? "").split(/[\n,]+/))
    .map(optionalString).filter((item): item is string => !!item);
  return items.length ? [...new Set(items)] : undefined;
};

export const serializeOpenRouterList = (value: unknown) =>
  Array.isArray(value) ? value.join(", ") : "";

// Empty arrays can explicitly override workspace defaults, and x_search: {} is
// the documented opt-in. Do not recursively discard either (or false / zero).
export const pruneOpenRouterObject = (value: Record<string, any>) => {
  const entries = Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== "");
  return entries.length ? Object.fromEntries(entries) : undefined;
};

export const withOpenRouterParameters = (tool: OpenRouterTool, patch: Record<string, any>): OpenRouterTool => {
  const { parameters: previous, ...rest } = tool;
  const parameters = pruneOpenRouterObject({ ...previous, ...patch });
  return parameters ? { ...rest, parameters } : rest;
};

export const isOpenRouterNumber = (value: number, min: number, max = Infinity, integer = true) =>
  Number.isFinite(value) && value >= min && value <= max && (!integer || Number.isInteger(value));

export const isOpenRouterNameAvailable = (tools: OpenRouterTool[], index: number, value: string) => {
  const name = optionalString(value);
  return (!name || /^[a-zA-Z0-9 _-]{1,64}$/.test(name)) &&
    !tools.some((tool, other) => other !== index && optionalString(tool.parameters?.name) === name);
};

export const WEB_SEARCH_MODES: Record<string, readonly string[]> = {
  exa: ["instant", "fast", "auto", "deep-lite", "deep", "deep-reasoning"],
  parallel: ["turbo", "fast", "basic", "advanced"],
};

export const hasExclusiveSearchDomains = (engine?: string) =>
  ["parallel", "firecrawl", "perplexity", "native"].includes(engine ?? "");

export const searchEnginePatch = (parameters: Record<string, any>, engine?: string) => ({
  engine,
  mode: WEB_SEARCH_MODES[engine ?? ""]?.includes(parameters.mode) ? parameters.mode : undefined,
  max_results: engine === "perplexity" && parameters.max_results > 20 ? 20 : parameters.max_results,
  // The explicit allowlist wins when moving from an engine that accepts both.
  excluded_domains: hasExclusiveSearchDomains(engine) && parameters.allowed_domains?.length
    ? undefined : parameters.excluded_domains,
});
