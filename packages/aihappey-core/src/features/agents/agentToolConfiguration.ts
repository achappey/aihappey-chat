import type { AgentTool, AgentToolCaller } from "aihappey-types";

export const AGENT_TOOL_SEARCH_TYPE = "tool_search";
export const AGENT_RESOURCE_SEARCH_TYPE = "resource_search";
export const AGENT_READ_RESOURCE_TYPE = "read_resource";
export const AGENT_FUNCTION_TYPE = "function";

export type AgentToolIdentity =
    | { type: typeof AGENT_FUNCTION_TYPE; name: string }
    | { type: typeof AGENT_TOOL_SEARCH_TYPE | typeof AGENT_RESOURCE_SEARCH_TYPE | typeof AGENT_READ_RESOURCE_TYPE };

export type AgentToolConfiguration = {
    allowed_callers?: AgentToolCaller[];
    defer_loading?: boolean;
};

export const isAgentTool = (tool: AgentTool, identity: AgentToolIdentity) =>
    tool.type === identity.type
    && (identity.type !== AGENT_FUNCTION_TYPE || tool.name === identity.name);

export const findAgentTool = (tools: AgentTool[] | undefined, identity: AgentToolIdentity) =>
    (tools ?? []).find((tool) => isAgentTool(tool, identity));

export const getAgentToolConfiguration = (
    tools: AgentTool[] | undefined,
    identity: AgentToolIdentity
): AgentToolConfiguration => {
    const tool = findAgentTool(tools, identity);
    if (!tool) return {};

    const callers = Array.isArray(tool.allowed_callers)
        ? tool.allowed_callers.filter((caller): caller is AgentToolCaller => caller === "direct" || caller === "programmatic")
        : undefined;

    return {
        ...(callers?.length ? { allowed_callers: callers } : {}),
        ...(typeof tool.defer_loading === "boolean" ? { defer_loading: tool.defer_loading } : {}),
    };
};

const hasConfiguration = (configuration: AgentToolConfiguration) =>
    !!configuration.allowed_callers?.length || typeof configuration.defer_loading === "boolean";

/** Updates only request options and preserves all unrelated/unknown tool fields. */
export const setAgentToolConfiguration = (
    tools: AgentTool[] | undefined,
    identity: AgentToolIdentity,
    configuration: AgentToolConfiguration
): AgentTool[] | undefined => {
    const current = tools ?? [];
    const index = current.findIndex((tool) => isAgentTool(tool, identity));
    const existing = index >= 0 ? current[index] : undefined;
    const base: AgentTool = existing ?? identity;
    const { allowed_callers: _allowedCallers, defer_loading: _deferLoading, ...retained } = base;
    const next: AgentTool = {
        ...retained,
        ...(configuration.allowed_callers?.length ? { allowed_callers: configuration.allowed_callers } : {}),
        ...(typeof configuration.defer_loading === "boolean" ? { defer_loading: configuration.defer_loading } : {}),
    };

    const identityFieldCount = identity.type === AGENT_FUNCTION_TYPE ? 2 : 1;
    const hasUnrelatedFields = Object.keys(retained).length > identityFieldCount;
    const isEnablementEntry = identity.type === AGENT_TOOL_SEARCH_TYPE || identity.type === AGENT_RESOURCE_SEARCH_TYPE;
    const shouldKeep = hasConfiguration(configuration) || hasUnrelatedFields || isEnablementEntry;
    const result = [...current];

    if (index >= 0) {
        if (shouldKeep) result[index] = next;
        else result.splice(index, 1);
    } else if (shouldKeep) {
        result.push(next);
    }

    return result.length ? result : undefined;
};
