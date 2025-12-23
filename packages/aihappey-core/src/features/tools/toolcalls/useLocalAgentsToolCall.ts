import { useCallback } from "react";
import { useAppStore } from "aihappey-state";
import type { Agent } from "aihappey-types";
import type { Tool } from "@modelcontextprotocol/sdk/types";

type ToolTextResult = {
  isError: boolean;
  content: { type: "text"; text: string }[];
};

function ok(text: string): ToolTextResult {
  return { isError: false, content: [{ type: "text", text }] };
}

function fail(err: unknown): ToolTextResult {
  const message = err instanceof Error ? err.message : String(err);
  return { isError: true, content: [{ type: "text", text: message }] };
}

type LocalAgentsToolName =
  | "local_agents_list"
  | "local_agents_create"
  | "local_agents_delete";

type LocalAgentsToolCall = {
  toolName: LocalAgentsToolName;
  input: any;
};

export function useLocalAgentsToolCall() {
  const allAgents = useAppStore(a => a.agents);
  const setAgents = useAppStore(a => a.setAgents);
  const deleteAgent = useAppStore(a => a.deleteAgent);

  const toServerConfigRecord = useCallback((urls: string[] | undefined) => {
    const safe = Array.isArray(urls) ? urls : [];
    return safe.reduce<Record<string, any>>((acc, url) => {
      acc[url] = { type: "streamable-http", url };
      return acc;
    }, {});
  }, []);

  const handleLocalAgentsToolCall = useCallback(
    async (toolCall: LocalAgentsToolCall): Promise<ToolTextResult> => {
      try {
        switch (toolCall.toolName) {
          case "local_agents_list":
            return ok(JSON.stringify(allAgents));

          case "local_agents_delete": {
            const { agentName } = toolCall.input ?? {};
            if (!agentName) throw new Error("Missing agentName.");
            deleteAgent(agentName);
            return ok(`Deleted local agent: ${agentName}`);
          }

          case "local_agents_create": {
            const input = toolCall.input ?? {};

            const agentName = input.agentName;
            if (!agentName) throw new Error("Missing agentName.");
            if (allAgents.some(a => a.name === agentName)) {
              throw new Error(`Agent with name '${agentName}' already exists.`);
            }

            const newAgent: Agent = {
              name: agentName,
              description: input.agentDescription ?? "",
              instructions: input.agentInstructions ?? "",
              model: {
                id: input.modelId,
                options: {
                  temperature: input.modelTemperature ?? 0,
                },
                providerMetadata: {
                  // keep empty for now; you can parse modelProviderMetadataJson later
                },
              },
              mcpClient: {
                policy: {
                  readOnlyHint: input.policyReadOnly ?? false,
                  idempotentHint: input.policyIdempotent ?? false,
                  openWorldHint: input.policyOpenWorld ?? false,
                  destructiveHint: input.policyDestructive ?? false,
                },
                capabilities: {
                  sampling: input.capabilitySampling ?? false,
                  elicitation: input.capabilityElicitation ?? false,
                },
              },
              mcpServers: toServerConfigRecord(input.mcpServerUrls),
            };

            setAgents([...allAgents, newAgent]);
            return ok(`Local agent created: ${agentName}`);
          }

          default:
            throw new Error(`Unsupported tool: ${toolCall.toolName}`);
        }
      } catch (e) {
        return fail(e);
      }
    },
    [allAgents, deleteAgent, setAgents, toServerConfigRecord]
  );

  return { handleLocalAgentsToolCall };
}




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