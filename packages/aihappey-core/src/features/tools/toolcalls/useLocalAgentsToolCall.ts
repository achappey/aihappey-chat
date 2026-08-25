import { useCallback } from "react";
import { useAppStore } from "aihappey-state";
import { createResponsesProvider } from "aihappey-ai";
import type { ResponseApiCreateRequest, ResponseApiInputContent } from "aihappey-ai";
import type { FilesContextType } from "aihappey-files";
import type { Agent } from "aihappey-types";
import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types";
import { useChatContext } from "../../chat/context/ChatContext";

const ok = (text: string): CallToolResult => ({
  isError: false,
  content: [{ type: "text", text }],
});

const fail = (err: unknown): CallToolResult => ({
  isError: true,
  content: [{ type: "text", text: err instanceof Error ? err.message : String(err) }],
});

/* ============================================================
   Tool definitions (STATIC)
   - no hooks
   - reusable everywhere
============================================================ */

export const localAgentsCreateTool: Tool = {
  name: "local_agents_create",
  title: "Create local Agent",
  description: "Create a new local Agent.",
  inputSchema: {
    type: "object",
    properties: {
      agentName: { type: "string", description: "Name of the agent" },
      agentDescription: { type: "string", description: "Description of the agent" },
      agentInstructions: { type: "string", description: "Agent instructions" },
      modelId: {
        type: "string",
        description: "Model ID to use for the agent. For example: 'openai/gpt-5-mini' or 'openai/gpt-5.2'",
      },
      modelTemperature: { type: "number", description: "Temperature setting for the model" },

      mcpServerUrls: {
        type: "array",
        description: "List of MCP servers attached to this agent",
        items: { type: "string" },
      },

      policyReadOnly: { type: "boolean", description: "Whether the agent is restricted to read-only operations" },
      policyIdempotent: { type: "boolean", description: "Whether the agent is idempotent" },
      policyOpenWorld: { type: "boolean", description: "Whether the agent can query external/unknown resources" },
      policyDestructive: { type: "boolean", description: "Whether the agent can make destructive changes" },
      capabilityElicitation: { type: "boolean", description: "Whether the agent supports elicitation capabilities" },
    },
    required: ["agentName", "agentDescription", "agentInstructions", "modelId", "modelTemperature"],
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
  },
};

export const localAgentsDeleteTool: Tool = {
  name: "local_agents_delete",
  title: "Delete local Agent",
  description: "Delete a local Agent.",
  inputSchema: {
    type: "object",
    properties: {
      agentName: { type: "string", description: "Name of the agent" },
    },
    required: ["agentName"],
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
  },
};

export const localAgentsListTool: Tool = {
  name: "local_agents_list",
  title: "List local Agents",
  description:
    "List the names and descriptions of all local AI Agents available. Local agents are Microsoft Agent Framework agents that the user can run in this chat app.",
  inputSchema: { type: "object", properties: {}, required: [] },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};

export const localAgentsGetTool: Tool = {
  name: "local_agents_get",
  title: "Get local Agent",
  description: "Get the complete configuration of one local AI Agent by its exact name.",
  inputSchema: {
    type: "object",
    properties: {
      agentName: { type: "string", description: "Exact name of the agent" },
    },
    required: ["agentName"],
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};

/* ============================================================
   Plugin DEFINITION (STATIC)
============================================================ */

export const localAgentsEditorPluginDef = {
  name: "local-agents-editor",
  match: (toolName: string) =>
    ["local_agents_create", "local_agents_delete", "local_agents_list", "local_agents_get"].includes(toolName),
  tools: [localAgentsCreateTool, localAgentsDeleteTool, localAgentsListTool, localAgentsGetTool],
};

export const localAgentsRunTool: Tool = {
  name: "local_agents_run",
  title: "Run Agent Framework agent",
  description: "Call a local or remote Agent Framework agent through the OpenAI-compatible Responses API.",
  inputSchema: {
    type: "object",
    properties: {
      agentId: { type: "string", description: "Local agent name or remote agent model ID." },
      prompt: { type: "string", description: "Prompt to send to the agent." },
      filename: { type: "string", description: "Optional exact name of a file in local file storage to attach." },
      background: { type: "boolean", description: "Run asynchronously and return the background response object." },
    },
    required: ["agentId", "prompt"],
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
};

export const localAgentsRuntimePluginDef = {
  name: "local-agents-runtime",
  match: (toolName: string) => toolName === localAgentsRunTool.name,
  tools: [localAgentsRunTool],
};

/* ============================================================
   Runtime types/helpers
============================================================ */

type LocalAgentsToolCall = {
  toolName: "local_agents_list" | "local_agents_get" | "local_agents_create" | "local_agents_delete";
  input?: any;
};

function toServerConfigRecord(urls: string[] | undefined) {
  const safe = Array.isArray(urls) ? urls : [];
  return safe.reduce<Record<string, any>>((acc, url) => {
    acc[url] = { type: "streamable-http", url };
    return acc;
  }, {});
}

/* ============================================================
   Plugin RUNTIME (execution only)
============================================================ */

export function useLocalAgentsEditorRuntime() {
  const allAgents = useAppStore(a => a.agents);
  const setAgents = useAppStore(a => a.setAgents);
  const deleteAgent = useAppStore(a => a.deleteAgent);

  const handle = useCallback(
    async (toolCall: LocalAgentsToolCall): Promise<CallToolResult> => {
      try {
        switch (toolCall.toolName) {
          case "local_agents_list":
            return {
              structuredContent: {
                agents: allAgents.map(({ name, description }) => ({ name, description }))
              },
              content: []
            };

          case "local_agents_get": {
            const { agentName } = toolCall.input ?? {};
            if (!agentName) throw new Error("Missing agentName.");

            const agent = allAgents.find(a => a.name === agentName);
            if (!agent) throw new Error(`Agent with name '${agentName}' not found.`);

            return {
              structuredContent: { agent },
              content: []
            };
          }

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
                options: { temperature: input.modelTemperature ?? 0 },
                providerMetadata: {},
              },
              mcpClient: {
                policy: {
                  readOnlyHint: input.policyReadOnly ?? false,
                  idempotentHint: input.policyIdempotent ?? false,
                  openWorldHint: input.policyOpenWorld ?? false,
                  destructiveHint: input.policyDestructive ?? false,
                },
                capabilities: {
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
    [allAgents, deleteAgent, setAgents]
  );

  return {
    name: localAgentsEditorPluginDef.name,
    handle,
  };
}

const blobToDataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(reader.error ?? new Error("Could not read local file."));
  reader.readAsDataURL(blob);
});

type LocalAgentsRunToolCall = {
  toolName: "local_agents_run";
  input?: {
    agentId?: string;
    prompt?: string;
    filename?: string;
    background?: boolean;
  };
};

export function useLocalAgentsRuntime(files?: FilesContextType | null) {
  const { config } = useChatContext();
  const localAgents = useAppStore(a => a.agents);
  const remoteAgentModels = useAppStore(a => a.remoteAgentModels);
  const customHeaders = useAppStore(a => a.customHeaders);

  const handle = useCallback(async (toolCall: LocalAgentsRunToolCall): Promise<CallToolResult> => {
    try {
      const agentId = toolCall.input?.agentId?.trim();
      const prompt = toolCall.input?.prompt?.trim();
      const filename = toolCall.input?.filename?.trim();
      const background = toolCall.input?.background ?? false;
      if (!agentId) throw new Error("Missing agentId.");
      if (!prompt) throw new Error("Missing prompt.");

      // Deliberately prefer a local agent when a remote model has the same bare ID.
      const localAgent = localAgents.find(agent => agent.name === agentId);
      const remoteAgent = localAgent ? undefined : remoteAgentModels.find(agent => agent.id === agentId);
      if (!localAgent && !remoteAgent) throw new Error(`Agent '${agentId}' not found.`);

      const content: ResponseApiInputContent[] = [{ type: "input_text", text: prompt }];
      if (filename) {
        if (!files) throw new Error("Files context not available.");
        const file = files.items.find(item => item.name === filename);
        if (!file) throw new Error(`Local file '${filename}' not found.`);
        const stored = await files.read(file.id);
        if (!stored) throw new Error(`Local file '${filename}' not found.`);
        content.push({
          type: "input_file",
          file_data: await blobToDataUrl(stored.data),
          filename: file.name,
        });
      }

      const headers = { ...(config.headers ?? {}), ...(customHeaders ?? {}) };
      const getAccessToken = config.agentEndpoint
        ? (config.getAgentAccessToken ?? config.getAccessToken)
        : config.getAccessToken;
      if (getAccessToken) headers.Authorization = `Bearer ${await getAccessToken()}`;

      const request: ResponseApiCreateRequest = {
        input: [{ role: "user", content }],
        background,
        store: background,
        stream: false,
        ...(localAgent ? { metadata: { agents: [localAgent] } } : { model: remoteAgent!.id }),
      };
      const client = createResponsesProvider({
        baseUrl: (config.agentEndpoint ?? config.baseUrl) + config.endpoints.responses,
        headers,
        fetch: config.fetch,
      });
      const response = await client.create(request);
      return { isError: false, content: [], structuredContent: response };
    } catch (error) {
      return fail(error);
    }
  }, [config, customHeaders, files, localAgents, remoteAgentModels]);

  return { name: localAgentsRuntimePluginDef.name, handle };
}
