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
};

/** Portable Agent Plugin package embedded as an immutable archive snapshot. */
export type AgentPluginFile = {
    data: string;
    media_type: "application/zip";
    type: "base64";
};

/** Provider-neutral tools that are executed by the agent runtime. */
export type AgentTool = {
    type: string;
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

export type McpClientCapabilities = {
    elicitation?: any;
};

export type McpPolicy = {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    openWorldHint?: boolean;
    IdempotentHint?: boolean;
};
