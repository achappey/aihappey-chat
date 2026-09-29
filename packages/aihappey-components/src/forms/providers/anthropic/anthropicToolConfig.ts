// These names are temporary UI aliases; the Messages API accepts them only inside tools.
export const ANTHROPIC_TOOL_TYPES = [
  "advisor", "bash", "code_execution", "memory", "text_editor",
  "web_fetch", "web_search", "tool_search_tool_bm25", "tool_search_tool_regex",
] as const;

const managedName = (tool: any) => ANTHROPIC_TOOL_TYPES.find((name) =>
  tool?.type === name ||
  (typeof tool?.type === "string" && new RegExp(`^${name}_\\d{8}$`).test(tool.type)) ||
  tool?.name === name
);

const cleanTool = (tool: any) => {
  if (!tool || typeof tool !== "object" || Array.isArray(tool)) return undefined;
  const cleaned = Object.fromEntries(Object.entries(tool).filter(([, value]) => value !== undefined));
  if (typeof cleaned.type === "string" &&
      (cleaned.type.startsWith("web_fetch_") || cleaned.type.startsWith("web_search_"))) {
    if (cleaned.allowed_domains == null) delete cleaned.allowed_domains;
    if (cleaned.blocked_domains == null) delete cleaned.blocked_domains;
    if (cleaned.type.startsWith("web_search_") && cleaned.user_location == null) {
      delete cleaned.user_location;
    }
  }
  if (cleaned.type !== "web_fetch_20260318" && cleaned.type !== "web_search_20260318") {
    delete cleaned.response_inclusion;
  }
  if (cleaned.type !== "web_fetch_20260318" && cleaned.type !== "web_fetch_20260309") {
    delete cleaned.use_cache;
  }
  return cleaned;
};

/** Canonicalize legacy root aliases without changing unrelated Anthropic options. */
export const canonicalizeAnthropicTools = (config: any, preferRoot = false) => {
  const next = { ...(config ?? {}) };
  const tools = Array.isArray(next.tools) ? next.tools.filter(Boolean) : [];
  const seen = new Set<string>();
  const canonicalTools: any[] = [];
  for (const tool of tools) {
    const name = managedName(tool);
    if (name) {
      if (seen.has(name)) continue;
      // UI edits explicitly set the alias to undefined when a tool is disabled.
      if (preferRoot && Object.prototype.hasOwnProperty.call(next, name)) {
        if (next[name]) canonicalTools.push(cleanTool(next[name]));
      } else {
        canonicalTools.push(cleanTool(tool));
      }
      seen.add(name);
    } else {
      canonicalTools.push(tool);
    }
  }
  for (const name of ANTHROPIC_TOOL_TYPES) {
    if (!seen.has(name) && next[name]) canonicalTools.push(cleanTool(next[name]));
    delete next[name];
  }
  next.tools = canonicalTools.length ? canonicalTools : undefined;
  return next;
};
