import { Tool } from "aihappey-mcp";

export const resourceTool: Tool = {
    name: "read_resource",
    title: "Read an MCP resource",
    description:
        "Reads a resource by URI from a MCP server. Use this to read MCP resources. The serverUrl and the resource uri can be from completely different domains. If the resource has a markdown (text/markdown) mime type, do not include its full content in your response; users can already view markdown files in the Canvas tab.",
    inputSchema: {
        type: "object",
        properties: {
            serverUrl: {
                type: "string",
                description: "URL of the MCP server. Make sure this is always the url of a connected MCP server. NOT the uri of the resource."
            },
            uri: {
                type: "string",
                description: "URI of the resource to read. Make sure this is always the uri of the requested resource."
            },
        },
        required: ["uri", "serverUrl"],
    },
    annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
    }
};

export const localAgentsListTool: Tool = {
    name: "local_agents_list",
    title: "List local Agents",
    description:
        "List all local AI Agents available. Local agents are Microsoft Agent Framework agents that the user can run in this chat app.",
    inputSchema: {
        type: "object",
        properties: {
        },
        required: [],
    },
    annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
    }
};

export const localAgentsCreateTool: Tool = {
    name: "local_agents_create",
    title: "Create local Agent",
    description: "Create a new local Agent.",
    inputSchema: {
        type: "object",
        properties: {
            agentName: {
                type: "string",
                description: "Name of the agent"
            },

            agentDescription: {
                type: "string",
                description: "Description of the agent"
            },

            agentInstructions: {
                type: "string",
                description: "Agent instructions"
            },

            modelId: {
                type: "string",
                description: "Model ID to use for the agent. For example: 'openai/gpt-5-mini' or 'openai/gpt-5.2'"
            },

            modelTemperature: {
                type: "number",
                description: "Temperature setting for the model"
            },

            /*            modelProviderMetadataJson: {
                            type: "string",
                            description: "Provider-specific metadata JSON (raw string)"
                        },*/

            mcpServerUrls: {
                type: "array",
                description: "List of MCP servers attached to this agent",
                items: { type: "string" }
            },

            policyReadOnly: {
                type: "boolean",
                description: "Whether the agent is restricted to read-only operations"
            },

            policyIdempotent: {
                type: "boolean",
                description: "Whether the agent is idempotent"
            },

            policyOpenWorld: {
                type: "boolean",
                description: "Whether the agent can query external/unknown resources"
            },

            policyDestructive: {
                type: "boolean",
                description: "Whether the agent can make destructive changes"
            },

            capabilitySampling: {
                type: "boolean",
                description: "Whether the agent supports sampling capabilities"
            },

            capabilityElicitation: {
                type: "boolean",
                description: "Whether the agent supports elicitation capabilities"
            }
        },
        required: [
            "agentName",
            "agentDescription",
            "agentInstructions",
            "modelId",
            "modelTemperature"
        ]
    },
    annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false
    }
};

export const localAgentsDeleteTool: Tool = {
    name: "local_agents_delete",
    title: "Delete local Agent",
    description: "Delete a local Agent.",
    inputSchema: {
        type: "object",
        properties: {
            agentName: {
                type: "string",
                description: "Name of the agent"
            },
        },
        required: [
            "agentName"
        ]
    },
    annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false
    }
};

export const localConversationsListTool: Tool = {
    name: "local_conversations_list_all",
    title: "List local conversations",
    description: "List all local conversations.",
    inputSchema: {
        type: "object",
        properties: {
        },

        required: [
        ]
    },
    annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false
    }
};

export const localConversationsGetTool: Tool = {
    name: "local_conversations_get_conversation",
    title: "Get local conversation by id",
    description: "Get local conversation by id.",
    inputSchema: {
        type: "object",
        properties: {
            conversationId: {
                type: "string",
                description: "Id of the conversation"
            },
        },

        required: [
            "conversationId"
        ]
    },
    annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false
    }
};

export const localSettingsGetTool: Tool = {
    name: "local_settings_get",
    title: "Get local settings",
    description: "Returns all local user settings such as enableUserLocation and MCP timeout settings.",
    inputSchema: {
        type: "object",
        properties: {},
        required: []
    },
    annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
    }
};

export const localSettingsSetTool: Tool = {
    name: "local_settings_set",
    title: "Update local settings",
    description:
        "Updates local user settings such as enableUserLocation and MCP timeout configuration.",
    inputSchema: {
        type: "object",
        properties: {
            enableUserLocation: {
                type: "boolean",
                description: "Enable or disable access to the user's location."
            },
            temperature: {
                type: "number",
                description: "AI temperature."
            },
            throttle: {
                type: "number",
                description: "Custom throttle wait in ms for the chat messages and data updates."
            },
            mcpToolTimeout: {
                type: "number",
                description: "Timeout (in milliseconds) applied to all MCP tool calls."
            },
            mcpResetTimeoutOnProgress: {
                type: "boolean",
                description: "Whether the MCP tool timeout resets when progress events arrive."
            }
        },
        required: []
    },
    annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false
    }
};
