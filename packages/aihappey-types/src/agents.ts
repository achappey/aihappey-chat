import { Icon } from "@modelcontextprotocol/sdk/types";

export type Agent = {
    name: string;
    model: AiModel;
    description: string;
    instructions: string;
    argumentHint?: string;
    responseFormat?: ResponseFormat;
    mcpServers?: Record<string, McpServer>
    mcpClient?: McpClient
    skills?: Skill[]
    plugins?: AgentPluginFile[];
    tools?: AgentTool[];
    icons?: Icon[];
    evaluations?: AgentEvaluations;
};

/** Optional runtime checks evaluated after an agent response completes. */
export type AgentEvaluations = {
    localEvaluator?: AgentLocalEvaluator;
};

export type AgentLocalEvaluator = {
    nonEmpty?: AgentNonEmptyCheck;
    keywordCheck?: AgentKeywordCheck;
    toolCallsPresent?: true;
    toolCalledCheck?: AgentToolCalledCheck;
    hasImageContent?: true;
};

export type AgentNonEmptyCheck = {
    minLength?: number;
};

export type AgentKeywordCheck = {
    keywords: string[];
    caseSensitive?: boolean;
};

export type AgentToolCalledCheck = {
    toolNames: string[];
    mode?: "All" | "Any";
};

/** Portable Agent Plugin package embedded as an immutable archive snapshot. */
export type AgentPluginFile = {
    data: string;
    media_type: "application/zip";
    type: "base64";
};

export type AgentToolCaller = "direct" | "programmatic";

/** Request options supported by provider-neutral agent tools. */
export type AgentToolRequestOptions = {
    allowed_callers?: AgentToolCaller[];
    defer_loading?: boolean;
};

/**
 * Provider-neutral tools that are executed by the agent runtime.
 *
 * MCP functions are addressed by `{ type: "function", name }`. Runtime-owned
 * tools such as tool/resource search and read_resource use their type as their
 * identity and intentionally do not need a name.
 */
export type AgentTool = AgentToolRequestOptions & {
    type: string;
    name?: string;
    [key: string]: unknown;
};

export type RemoteAgentModel = {
    id: string;
    name?: string;
    description?: string;
    created?: number;
    owned_by?: string;
    tags?: string[];
    source: "remote";
    agent?: Agent;
};

export const LOCAL_AGENT_SELECTION_PREFIX = "local:";
export const REMOTE_AGENT_SELECTION_PREFIX = "remote:";

export const toLocalAgentSelectionKey = (name: string) =>
    `${LOCAL_AGENT_SELECTION_PREFIX}${name}`;

export const toRemoteAgentSelectionKey = (id: string) =>
    `${REMOTE_AGENT_SELECTION_PREFIX}${id}`;

export const isLocalAgentSelectionKey = (value: string) =>
    value.startsWith(LOCAL_AGENT_SELECTION_PREFIX);

export const isRemoteAgentSelectionKey = (value: string) =>
    value.startsWith(REMOTE_AGENT_SELECTION_PREFIX);

export const normalizeAgentSelectionValue = (
    value: string,
    localAgentNames: string[],
    remoteAgentIds: string[]
) => {
    if (!value) return value;
    if (isLocalAgentSelectionKey(value) || isRemoteAgentSelectionKey(value)) {
        return value;
    }

    if (localAgentNames.includes(value)) {
        return toLocalAgentSelectionKey(value);
    }

    if (remoteAgentIds.includes(value)) {
        return toRemoteAgentSelectionKey(value);
    }

    return value;
};


export type InlineSkill = {
    type: "inline";
    name: string;
    description: string
    source: SkillSource
};

export type SkillReference = {
    type: "skill_reference";
    /** Exact catalog identifier returned by the skills gateway, including its provider prefix. */
    skill_id: string;
    /** Omitted means the gateway default version; "latest" tracks latest; other values pin a version. */
    version?: string;
};

export type Skill = InlineSkill | SkillReference;

export type SkillSource = {
    type: string;
    media_type: string;
    data: string
};


export type ResponseFormat = {
    type: "json_schema";
    json_schema: {
        name: string;
        description?: string;
        schema: Record<string, unknown>;
        strict?: boolean;
    };
};

export type AiModel = {
    id: string;
    options?: AiModelOptions;
    providerMetadata?: Record<string, any>;
    providerHeaders?: Record<string, string>;
};

export type AiModelOptions = {
    temperature?: number;
};

export type McpClient = {
    capabilities?: McpClientCapabilities;
    policy?: any;
};

export type McpServer = {
    type: "http";
    url: string;
    disabled?: boolean;
    defer_loading?: boolean;
    namespace?: boolean;
    allowed_callers?: Array<"direct" | "programmatic">;
    headers?: Record<string, any>;
};

/** Extensible agent-scoped MCP capabilities. Elicitation is configured globally. */
export type McpClientCapabilities = Record<string, unknown>;

export type McpPolicy = {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    openWorldHint?: boolean;
    IdempotentHint?: boolean;
};
