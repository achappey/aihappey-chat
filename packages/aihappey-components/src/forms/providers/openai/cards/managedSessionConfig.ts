export const AGENT_TOOL_TYPES = ["computer_use", "web_search", "programmatic_tool_calling", "tool_search"] as const;

export const optionalString = (value: unknown) =>
  typeof value === "string" ? value.trim() || undefined : undefined;

export const optionalLines = (value: string) =>
  [...new Set(value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean))];

export const updateSessionConfig = (config: any, key: "agent" | "environment", value?: any) => {
  const { [key]: _previous, ...rest } = config ?? {};
  return value === undefined ? rest : { ...rest, [key]: value };
};

export const selectAgentTools = (tools: unknown): any[] =>
  Array.isArray(tools)
    ? tools.filter((tool) => AGENT_TOOL_TYPES.includes(tool?.type))
    : [];

export const updateAgentTool = (tools: unknown, type: typeof AGENT_TOOL_TYPES[number], enabled: boolean) => {
  const remaining = selectAgentTools(tools).filter((tool) => tool.type !== type);
  return enabled ? [...remaining, { type }] : remaining;
};

export const changeEnvironmentType = (environment: any, type: "none" | "openai_hosted" | "self_hosted") => {
  if (environment?.type === type) return environment;
  if (type === "self_hosted") return { type, workspace_directory: "/workspace" };
  return { type };
};

export const updateNetwork = (network: any, access: "enabled" | "disabled" | "restricted") => {
  if (access !== "restricted") return { access };
  return { access, ...(network?.access === "restricted" ? {
    ...(network.allowed_domains?.length ? { allowed_domains: network.allowed_domains } : {}),
    ...(network.blocked_domains?.length ? { blocked_domains: network.blocked_domains } : {}),
  } : {}) };
};
