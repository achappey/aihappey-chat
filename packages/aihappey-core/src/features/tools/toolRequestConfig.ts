export type ToolRequestOptions = {
  allowed_callers?: Array<"direct" | "programmatic">;
  defer_loading?: boolean;
};

export type ToolRequestConfig = Record<string, ToolRequestOptions>;

/**
 * Adds request-only OpenAI options without mutating the attached tool catalog.
 * Empty/invalid options are omitted rather than serialized as [] or false.
 */
export const decorateToolsWithRequestConfig = (
  tools: unknown,
  config: unknown,
): any[] => {
  if (!Array.isArray(tools)) return [];
  const byName = config && typeof config === "object" && !Array.isArray(config)
    ? config as ToolRequestConfig
    : {};

  return tools.map((tool: any) => {
    const name = typeof tool?.name === "string" ? tool.name : "";
    const sourceOptions = tool?.source?.requestOptions && typeof tool.source.requestOptions === "object"
      ? tool.source.requestOptions as ToolRequestOptions
      : {};
    const options = Object.prototype.hasOwnProperty.call(byName, name) ? byName[name] : sourceOptions;
    const callers = Array.isArray(options.allowed_callers)
      ? options.allowed_callers.filter((caller) => caller === "direct" || caller === "programmatic")
      : [];
    const {
      allowed_callers: _existingAllowedCallers,
      defer_loading: _existingDeferLoading,
      ...baseTool
    } = tool ?? {};

    return {
      ...baseTool,
      ...(callers.length ? { allowed_callers: callers } : {}),
      ...(options.defer_loading ? { defer_loading: true } : {}),
    };
  });
};

/** Anthropic client search requires all searchable candidates to be deferred. */
export const deferClientToolSearchCandidates = (tools: unknown): any[] => {
  if (!Array.isArray(tools)) return [];
  const hasClientSearch = tools.some((tool: any) => tool?.name === "client_tool_search");
  if (!hasClientSearch) return tools;

  return tools.map((tool: any) => tool?.name === "client_tool_search"
    ? (() => {
      const { defer_loading: _deferLoading, ...searchTool } = tool ?? {};
      return searchTool;
    })()
    : { ...tool, defer_loading: true });
};

const sanitizeNamespaceName = (value: unknown, fallback = "tools") => {
  const name = String(value ?? "").trim().toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^[_-]+|[_-]+$/g, "")
    .slice(0, 64);
  return name || fallback;
};

export const namespaceNameForTool = (tool: any) => {
  const source = tool?.source;
  const kind = source?.kind === "mcp" || source?.kind === "plugin" ? source.kind : "local";
  return sanitizeNamespaceName(kind === "local" ? "local" : source?.name ?? source?.id ?? kind);
};

/** Groups decorated tools by MCP server/plugin, with all remaining tools in local. */
export const shapeToolsForRequest = (
  tools: unknown,
  config: unknown,
  useNamespaces: boolean,
): any[] => {
  const decorated = decorateToolsWithRequestConfig(tools, config);
  const hasForcedNamespaces = decorated.some((tool) => tool?.source?.namespace === true);
  if (!useNamespaces && !hasForcedNamespaces) return decorated;

  const groups = new Map<string, { proposedName: string; description: string; tools: any[] }>();
  const ungrouped: any[] = [];
  for (const tool of decorated) {
    const source = tool?.source;
    if (!useNamespaces && source?.namespace !== true) {
      ungrouped.push(tool);
      continue;
    }
    const kind = source?.kind === "mcp" || source?.kind === "plugin" ? source.kind : "local";
    const id = kind === "local" ? "local" : String(source?.id ?? kind);
    const key = `${kind}:${id}`;
    const group: { proposedName: string; description: string; tools: any[] } = groups.get(key) ?? {
      proposedName: kind === "local" ? "local" : String(source?.name ?? id),
      description: source?.description || (kind === "local"
        ? "Locally available application tools."
        : `Tools provided by ${source?.name ?? id}.`),
      tools: [],
    };
    const description = typeof tool?.description === "string" && tool.description.trim()
      ? tool.description.trim()
      : typeof tool?.title === "string" && tool.title.trim()
        ? tool.title.trim()
        : typeof tool?.annotations?.title === "string" && tool.annotations.title.trim()
          ? tool.annotations.title.trim()
          : undefined;
    const parameters = tool?.inputSchema && typeof tool.inputSchema === "object"
      ? tool.inputSchema
      : tool?.parameters && typeof tool.parameters === "object"
        ? tool.parameters
        : { type: "object", properties: {} };
    group.tools.push({
      type: "function",
      name: tool.name,
      ...(description ? { description } : {}),
      parameters,
      ...(Array.isArray(tool.allowed_callers) && tool.allowed_callers.length
        ? { allowed_callers: tool.allowed_callers }
        : {}),
      ...(tool.defer_loading ? { defer_loading: true } : {}),
    });
    groups.set(key, group);
  }

  const used = new Set<string>();
  const namespaces = [...groups.values()].map((group) => {
    const base = sanitizeNamespaceName(group.proposedName);
    let name = base;
    let suffix = 2;
    while (used.has(name)) name = `${base.slice(0, 60)}_${suffix++}`;
    used.add(name);
    return { type: "namespace", name, description: group.description, tools: group.tools };
  });
  return [...ungrouped, ...namespaces];
};
