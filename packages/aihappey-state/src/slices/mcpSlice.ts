import type { StateCreator } from "zustand";
import {
  CreateMessageRequest, CreateMessageResult,
  type ReadResourceResult,
  type ServerCapabilities, type LoggingMessageNotification,
  ProgressNotification, type ElicitRequest, type Tool,
  Resource, ResourceTemplate, type ElicitResult,
  type LoggingLevel,
  type Task,
  CallToolResultSchema,
} from "aihappey-mcp";
import { connectServerPersistent, mcpRuntime } from "./uiSlice";
import { AGENT_RESOURCE_TYPE, AGENTS_RESOURCE_TYPE, CONVERSATION_RESOURCE_TYPE, CONVERSATIONS_RESOURCE_TYPE } from "aihappey-types";

const DEFAULT_TASK_CREATED_TEXT = "Task started. Use MCP task tools to inspect status or fetch the result.";

const asTaskCreatedToolResult = (task: Task) => ({
  isError: false,
  content: [{
    type: "text",
    text: task.statusMessage || DEFAULT_TASK_CREATED_TEXT,
  }],
  task,
});

const supportsTaskedToolCalls = (capabilities: ServerCapabilities | undefined, tool: Tool | undefined) => {
  const taskSupport = tool?.execution?.taskSupport;
  return !!capabilities?.tasks?.requests?.tools?.call && !!taskSupport && taskSupport !== "forbidden";
};

export type McpContents = {
  tools: Tool[];
  instructions?: string
  resources: Resource[];
  resourceTemplates: ResourceTemplate[];
  capabilities: ServerCapabilities;
  version: {
    version: string;
    name: string;
    websiteUrl?: string | undefined;
    icons?: {
      src: string;
      mimeType?: string | undefined;
      sizes?: string[] | undefined;
    }[] | undefined;
    title?: string | undefined;
  } | undefined;
};


type McpConnectOpts = {
  token?: string;
  headers?: Record<string, string>;
  onSample?: (server: string, req: CreateMessageRequest) => Promise<CreateMessageResult>;
  onElicit?: (server: string, req: ElicitRequest) => Promise<ElicitResult>;
  onLogging?: (notif: LoggingMessageNotification) => Promise<void>;
  onProgress?: (notif: ProgressNotification) => Promise<void>;
};

export type ResourceResult = { uri: string; data: ReadResourceResult };
export type SamplingRequest = [string, string, CreateMessageRequest, CreateMessageResult];
export type ElicitRequestItem = [string, ElicitRequest, ElicitResult];

export type McpSlice = {
  mcpErrors: Record<string, string | null>;
  logLevel: LoggingLevel;
  toolTimeout: number
  safeHosts: string[]
  setSafeHosts: (safeHosts: string[]) => void;
  resetTimeoutOnProgress: boolean
  sampling: Record<string, SamplingRequest>;
  addSampling: (id: string, createdAt: string, server: string, request: CreateMessageRequest, result?: CreateMessageResult) => void;
  clearSampling: () => void;

  tokens: Record<string, string>;
  mcpServerContent: Record<string, McpContents>;
  setToken: (url: string, token: string) => void;
  clearToken: (url: string) => void;
  callTool: (toolCallId: string | undefined, name: string, parameters: any, locale?: string, signal?: AbortSignal)
    => Promise<any | undefined>;
  getMcpTask: (serverName: string, taskId: string, signal?: AbortSignal) => Promise<Task>;
  getMcpTaskResult: (serverName: string, taskId: string, signal?: AbortSignal) => Promise<any>;
  listMcpTasks: (serverName: string, cursor?: string, signal?: AbortSignal) => Promise<{ tasks: Task[]; nextCursor?: string }>;
  cancelMcpTask: (serverName: string, taskId: string, signal?: AbortSignal) => Promise<Task>;
  clearMcpContent: (name: string) => void;

  setLogLevel: (logLevel: LoggingLevel) => Promise<void>;
  setMcpTimeout: (timeout: number, resetTimeoutOnProgress: boolean) => void;
  connectMcpServer: (name: string, url: string, opts: any, conversationImport?: any) => Promise<any>;
};

export const createMcpSlice: StateCreator<
  any,
  [],
  [],
  McpSlice
> = (set, get, store) => ({
  mcpErrors: {},
  prompts: {},
  mcpServerContent: {},
  safeHosts: [],
  logLevel: "info",
  toolTimeout: 300000,
  resetTimeoutOnProgress: true,
  sampling: {},
  progress: [],
  setSafeHosts: async (hosts) => {
    set((state: any) => ({
      safeHosts: hosts
    }))
  },
  clearMcpContent: async (name) => {
    const { mcpServerContent } = get();
    const newClients = { ...mcpServerContent };

    if (newClients[name.toLowerCase()])
      delete newClients[name.toLowerCase()];

    set((state: any) => ({
      mcpServerContent: {
        ...newClients,
      }
    }))
  },

  connectMcpServer: async (name, url, opts, conversationImport) => {
    const { safeHosts, enableAgentImport, enableConversationImport } = get()

    var result = await connectServerPersistent(name.toLowerCase(), url, {
      ...opts,
      clientName: opts.clientName,
      clientVersion: opts.clientVersion
    });

    const client = mcpRuntime.get(name.toLowerCase());

    if (!client) {
      throw new Error("ChatApp MCP is not connected");
    }

    var capabilities = client.getServerCapabilities();
    var version = client.getServerVersion();
    var instructions = client.getInstructions();

    const tools = capabilities?.tools
      ? ((await client.listTools())?.tools ?? []).map(t => ({ ...t }))
      : [];

    const resources = capabilities?.resources
      ? ((await client.listResources())?.resources ?? []).map(r => ({
        ...r,
        annotations: r.annotations ? { ...(r.annotations as any) } : undefined,
      }))
      : [];

    const resourceTemplates = capabilities?.resources
      ? ((await client.listResourceTemplates())?.resourceTemplates ?? []).map(rt => ({ ...rt }))
      : [];

    const discoveredConversations: any[] = [];

    if (enableConversationImport && conversationImport && safeHosts?.includes(new URL(url).host)) {
      const agentResources =
        resources?.filter(r =>
          r.mimeType === CONVERSATION_RESOURCE_TYPE ||
          r.mimeType === CONVERSATIONS_RESOURCE_TYPE
        ) ?? [];

      for (const res of agentResources) {
        const result = await client.readResource({ uri: res.uri });

        for (const c of result.contents) {
          // CASE 1: single agent entries
          if (c.mimeType === CONVERSATION_RESOURCE_TYPE
            || (c.mimeType === "application/json"
              && res.mimeType === CONVERSATION_RESOURCE_TYPE)
          ) {
            discoveredConversations.push(JSON.parse((c as any).text));
            continue;
          }

          // CASE 2: list of agents
          if (
            c.mimeType === CONVERSATIONS_RESOURCE_TYPE
            || (c.mimeType === "application/json" &&
              res.mimeType === CONVERSATIONS_RESOURCE_TYPE
            )
          ) {
            const parsed = JSON.parse((c as any).text ?? "[]");

            if (Array.isArray(parsed)) {
              discoveredConversations.push(...parsed);
              continue;
            }
          }
        }
      }

      for (const item of discoveredConversations) {
        await conversationImport(item)
      }
    }

    const discoveredAgents: any[] = [];

    if (enableAgentImport
      && safeHosts?.includes(new URL(url).host)) {
      //  try {
      const agentResources =
        resources?.filter(r =>
          r.mimeType === AGENT_RESOURCE_TYPE ||
          r.mimeType === AGENTS_RESOURCE_TYPE
        ) ?? [];

      for (const res of agentResources) {
        const result = await client.readResource({ uri: res.uri });

        for (const c of result.contents) {
          // CASE 1: single agent entries
          if (c.mimeType === AGENT_RESOURCE_TYPE
            || (c.mimeType === "application/json"
              && res.mimeType === AGENT_RESOURCE_TYPE)
          ) {
            discoveredAgents.push(JSON.parse((c as any).text));
            continue;
          }

          // CASE 2: list of agents
          if (
            c.mimeType === AGENTS_RESOURCE_TYPE
            || (c.mimeType === "application/json" &&
              res.mimeType === AGENTS_RESOURCE_TYPE
            )
          ) {
            const parsed = JSON.parse((c as any).text ?? "[]");

            if (Array.isArray(parsed)) {
              discoveredAgents.push(...parsed);
              continue;
            }
          }
        }
      }
    }

    set((state: any) => ({
      agents: [...state.agents
        .filter((a: any) => !discoveredAgents.some(d => d.name === a.name)),
      ...discoveredAgents],
      mcpServerContent: {
        ...state.mcpServerContent,
        [name.toLowerCase()]: {
          capabilities,
          version,
          instructions,
          tools: [...tools],
          resources: [...resources],
          resourceTemplates: [...resourceTemplates],
        }
      }
    }))

    return result;
  },
  addSampling: (id, createdAt, server, notif, result) =>
    set((state: any) => ({
      sampling: {
        ...state.sampling,
        [id]: [createdAt, server, notif, result]
      }
    })),
  clearSampling: () =>
    set((state: any) => ({
      sampling: {}
    })),
  tokens: {},
  setToken: (url, token) => {
    set((state: any) => ({
      tokens: { ...state.tokens, [url]: token }
    }));
  },
  clearToken: (url) => {
    set((state: any) => {
      const newTokens = { ...state.tokens };
      delete newTokens[url];
      return { tokens: newTokens };
    });
  },
  setMcpTimeout: async (timeout: number, resetTimeoutOnProgress: boolean) => {

    set((state: any) => ({
      toolTimeout: timeout,
      resetTimeoutOnProgress: resetTimeoutOnProgress
    }));

  },
  setLogLevel: async (logLevel: string) => {
    set((state: any) => ({
      logLevel: logLevel
    }));
  },
  getMcpTask: async (serverName: string, taskId: string, signal?: AbortSignal) => {
    const { toolTimeout, resetTimeoutOnProgress } = get();
    const client = mcpRuntime.get(serverName);

    if (!client)
      throw new Error("Client not connected");

    const taskClient = (client as any)?.experimental?.tasks;
    if (!taskClient?.getTask)
      throw new Error(`Server ${serverName} does not expose MCP tasks/get`);

    return await taskClient.getTask(taskId, {
      signal,
      timeout: toolTimeout,
      resetTimeoutOnProgress,
    });
  },
  getMcpTaskResult: async (serverName: string, taskId: string, signal?: AbortSignal) => {
    const { toolTimeout, resetTimeoutOnProgress } = get();
    const client = mcpRuntime.get(serverName);

    if (!client)
      throw new Error("Client not connected");

    const taskClient = (client as any)?.experimental?.tasks;
    if (!taskClient?.getTaskResult)
      throw new Error(`Server ${serverName} does not expose MCP tasks/result`);

    return await taskClient.getTaskResult(taskId, CallToolResultSchema, {
      signal,
      timeout: toolTimeout,
      resetTimeoutOnProgress,
    });
  },
  listMcpTasks: async (serverName: string, cursor?: string, signal?: AbortSignal) => {
    const { toolTimeout, resetTimeoutOnProgress } = get();
    const client = mcpRuntime.get(serverName);

    if (!client)
      throw new Error("Client not connected");

    const taskClient = (client as any)?.experimental?.tasks;
    if (!taskClient?.listTasks)
      throw new Error(`Server ${serverName} does not expose MCP tasks/list`);

    return await taskClient.listTasks(cursor, {
      signal,
      timeout: toolTimeout,
      resetTimeoutOnProgress,
    });
  },
  cancelMcpTask: async (serverName: string, taskId: string, signal?: AbortSignal) => {
    const { toolTimeout, resetTimeoutOnProgress } = get();
    const client = mcpRuntime.get(serverName);

    if (!client)
      throw new Error("Client not connected");

    const taskClient = (client as any)?.experimental?.tasks;
    if (!taskClient?.cancelTask)
      throw new Error(`Server ${serverName} does not expose MCP tasks/cancel`);

    return await taskClient.cancelTask(taskId, {
      signal,
      timeout: toolTimeout,
      resetTimeoutOnProgress,
    });
  },
  callTool: async (toolCallId: string | undefined, name: string,
    parameters: any,
    locale?: string,
    signal?: AbortSignal) => {
    // Find the server URL that owns this resource
    const { toolTimeout, resetTimeoutOnProgress, mcpServerContent } = get();
    const serverName = Object.keys(mcpServerContent)
      .find(z => mcpServerContent[z].tools.find((a: Tool) => a.name == name) != undefined)

    if (!serverName || !mcpRuntime.has(serverName))
      throw new Error("Server not found or not connected")

    const client = mcpRuntime.get(serverName);
    //if (!client?.callTool) return;
    if (!client)
      throw new Error("Client not connected")

    const tool = mcpServerContent[serverName]?.tools.find((a: Tool) => a.name == name)

    const meta: Record<string, any> = {};
    if (locale) meta["chat/locale"] = locale;
    if (toolCallId) meta.progressToken = toolCallId;

    if (supportsTaskedToolCalls(mcpServerContent[serverName]?.capabilities, tool)) {
      const taskClient = (client as any)?.experimental?.tasks;

      if (!taskClient?.callToolStream) {
        throw new Error(`Server ${serverName} advertises MCP task support but the connected runtime does not expose task streaming APIs`)
      }

      const stream = taskClient.callToolStream({
        name: name,
        arguments: parameters,
        ...(Object.keys(meta).length > 0 ? { _meta: meta } : {}),
      }, undefined, {
        signal,
        timeout: toolTimeout,
        resetTimeoutOnProgress,
        task: {},
      });

      for await (const message of stream) {
        if (message.type === "taskCreated") {
          return asTaskCreatedToolResult(message.task);
        }

        if (message.type === "result") {
          return message.result;
        }

        if (message.type === "error") {
          throw message.error;
        }
      }

      throw new Error(`Task-enabled tool ${name} did not return a task or a final result`)
    }

    return await client.callTool({
      name: name,
      arguments: parameters,
      ...(Object.keys(meta).length > 0 ? { _meta: meta } : {}),
    }, undefined, {
      signal: signal,
      timeout: toolTimeout,
      resetTimeoutOnProgress,
    });
  },
});
