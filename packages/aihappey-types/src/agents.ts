
export type Agent = {
    name: string;
    model: AiModel;
    description: string;
    instructions: string;
    argumentHint?: string;
    outputSchema?: OutputSchema;
    mcpServers?: Record<string, McpServer>
    mcpClient?: McpClient
    skills?: Skill[]
};


export type Skill = {
    type: string;
    name: string;
    description: string
    source: SkillSource
};

export type SkillSource = {
    type: string;
    media_type: string;
    data: string
};


export type OutputSchema = {
    properties?: Record<string, Property>;
};

export type Property = {
    type: string;
    required?: boolean;
    description?: string
};

export type AiModel = {
    id: string;
    options?: AiModelOptions;
    providerMetadata?: Record<string, any>;
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
    headers?: Record<string, any>;
};

export type McpClientCapabilities = {
    sampling?: any;
    elicitation?: any;
};

export type McpPolicy = {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    openWorldHint?: boolean;
    IdempotentHint?: boolean;
};
