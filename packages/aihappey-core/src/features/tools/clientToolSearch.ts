export const CLIENT_TOOL_SEARCH_PLUGIN_ID = "client-tool-search";
export const CLIENT_TOOL_SEARCH_NAME = "client_tool_search";
export const OPENAI_CLIENT_TOOL_SEARCH_NAME = "tool_search";
export const MAX_CLIENT_TOOL_SEARCH_RESULTS = 10;

export type CanonicalToolDefinition = {
  name: string;
  description?: string;
  inputSchema?: unknown;
  outputSchema?: unknown;
  annotations?: unknown;
  source?: unknown;
};

export type ClientToolSearchResult = {
  selectedTools: CanonicalToolDefinition[];
};

export const EMPTY_CLIENT_TOOL_SEARCH_RESULT: ClientToolSearchResult = {
  selectedTools: [],
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

/** Accepts both the neutral result and its standard MCP CallToolResult envelope. */
export const selectedToolsFromClientToolSearchResult = (value: unknown): CanonicalToolDefinition[] | undefined => {
  if (!isRecord(value)) return undefined;
  const payload = isRecord(value.structuredContent)
    ? value.structuredContent
    : isRecord(value.structured_content)
      ? value.structured_content
      : value;
  return Array.isArray(payload.selectedTools)
    ? toCanonicalToolCatalog(payload.selectedTools)
    : undefined;
};

export const toCanonicalToolCatalog = (tools: unknown[]): CanonicalToolDefinition[] => {
  const seen = new Set<string>();
  const result: CanonicalToolDefinition[] = [];

  for (const value of tools ?? []) {
    if (!isRecord(value)) continue;
    const name = typeof value.name === "string" ? value.name.trim() : "";
    if (!name || seen.has(name) || name === CLIENT_TOOL_SEARCH_NAME || name === OPENAI_CLIENT_TOOL_SEARCH_NAME) continue;
    seen.add(name);
    result.push({
      name,
      ...(typeof value.description === "string" ? { description: value.description } : {}),
      ...(value.inputSchema !== undefined ? { inputSchema: value.inputSchema } : {}),
      ...(value.outputSchema !== undefined ? { outputSchema: value.outputSchema } : {}),
      ...(value.annotations !== undefined ? { annotations: value.annotations } : {}),
      ...(value.source !== undefined ? { source: value.source } : {}),
    });
  }

  return result;
};

/** Strictly parses the exact inference contract and resolves names through the supplied allow-list. */
export const parseClientToolSearchSelection = (
  text: unknown,
  catalog: CanonicalToolDefinition[],
): ClientToolSearchResult => {
  if (typeof text !== "string" || !text.trim()) return EMPTY_CLIENT_TOOL_SEARCH_RESULT;

  try {
    const parsed = JSON.parse(text);
    if (!isRecord(parsed) || Object.keys(parsed).length !== 1 || !Array.isArray(parsed.selectedToolNames)) {
      return EMPTY_CLIENT_TOOL_SEARCH_RESULT;
    }

    const byName = new Map(catalog.map((tool) => [tool.name, tool] as const));
    const seen = new Set<string>();
    const selectedTools: CanonicalToolDefinition[] = [];

    for (const value of parsed.selectedToolNames) {
      if (typeof value !== "string" || seen.has(value)) continue;
      const tool = byName.get(value);
      if (!tool) continue;
      seen.add(value);
      selectedTools.push(tool);
      if (selectedTools.length === MAX_CLIENT_TOOL_SEARCH_RESULTS) break;
    }

    return { selectedTools };
  } catch {
    return EMPTY_CLIENT_TOOL_SEARCH_RESULT;
  }
};

export const clientToolSearchGoal = (input: unknown): string => {
  if (typeof input === "string") return input.trim();
  if (!isRecord(input)) return "";
  for (const key of ["goal", "query", "search_query", "description"]) {
    if (typeof input[key] === "string" && input[key].trim()) return input[key].trim();
  }
  return "";
};
