import type { StateCreator } from "zustand";
import {
  CreateMessageRequest, CreateMessageResult,
  type ReadResourceResult,
  type ServerCapabilities, type LoggingMessageNotification,
  ProgressNotification, Prompt, type ElicitRequest, type Tool,
  Resource, ResourceTemplate, type ElicitResult,
} from "aihappey-mcp";
import { connectServerPersistent, mcpRuntime } from "./uiSlice";
import { AGENT_RESOURCE_TYPE, AGENTS_RESOURCE_TYPE, CONVERSATION_RESOURCE_TYPE, CONVERSATIONS_RESOURCE_TYPE } from "aihappey-types";

type LogLevel = "error" | "debug" | "info" | "notice" | "warning" | "critical" | "alert" | "emergency";

type McoContents = {
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
  logLevel: LogLevel;
  toolTimeout: number
  safeHosts: string[]
  setSafeHosts: (safeHosts: string[]) => void;
  resetTimeoutOnProgress: boolean
  progress: ProgressNotification[];
  addProgress: (notif: ProgressNotification) => void;
  clearProgress: () => void;
  sampling: Record<string, SamplingRequest>;
  addSampling: (id: string, createdAt: string, server: string, request: CreateMessageRequest, result?: CreateMessageResult) => void;
  clearSampling: () => void;

  tokens: Record<string, string>;
  mcpServerContent: Record<string, McoContents>;
  setToken: (url: string, token: string) => void;
  //getToolIcon: (toolName: string) => any[] | undefined
  clearToken: (url: string) => void;
  callTool: (toolCallId: string | undefined, name: string, parameters: any, locale?: string, signal?: AbortSignal)
    => Promise<any | undefined>;
  clearMcpContent: (name: string) => void;
  refreshPrompts: (url: string) => Promise<void>;
  getPrompts: (name: string) => Promise<Prompt[]>;
  getPrompt: (serverName: string, name: string, args: any) => Promise<any | undefined>;
  getCompletion: (name: string, ref: any, arg: any, context: any) => Promise<any | undefined>;

  setLogLevel: (logLevel: LogLevel) => Promise<void>;
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
    let tools: any[] = []
    let resources: any[] = []
    let resourceTemplates: any[] = []

    if (capabilities?.tools) {
      var toolList = capabilities?.tools ? await client.listTools() : undefined;
      tools.push(...toolList?.tools ?? []);
    }

    if (capabilities?.resources) {
      var resourceList = await client.listResources();
      resources.push(...resourceList?.resources);

      var resourceTemplateList = await client.listResourceTemplates();
      resourceTemplates.push(...resourceTemplateList?.resourceTemplates);
    }

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
          tools,
          resources,
          resourceTemplates,
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
  addProgress: (notif) =>
    set((state: any) => ({
      progress: [...state.progress, notif]
    })),
  clearProgress: () =>
    set((state: any) => {
      return { progress: [] };
    }),
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

  /*getToolIcon: (toolName: string) => {
    const { tools, clients } = get();

    // Find the server URL that owns this tool
    const serverUrl = Object.keys(tools).find(url => {
      const toolList = tools[url];
      if (!Array.isArray(toolList)) return false;
      return toolList.some((t: any) => t.name === toolName);
    });

    if (!serverUrl) {
      console.warn(`⚠️ No server found for tool '${toolName}'`);
      return undefined;
    }
    const client: McpConnectResult["client"] = clients[serverUrl];
    return client.getServerVersion()?.icons;
  },*/
  /* readServerResource: async (serverUrl: string, uri: string) => {
     // Find the server URL that owns this resource
     const { mcpServers } = get();
     const serverName = Object.keys(mcpServers)
       .find(z => mcpServers[z].config?.url == serverUrl)
 
     if (!serverName || !mcpRuntime.has(serverName))
       throw new Error("Server not found or not connected")
 
     const client = mcpRuntime.get(serverName);
     if (!client)
       throw new Error("Client not found or not connected")
 
     return await client.readResource({ uri });
   },*/

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

    const meta: Record<string, any> = {};
    if (locale) meta["chat/locale"] = locale;
    if (toolCallId) meta.progressToken = toolCallId;

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

  refreshPrompts: async (url) => {
    const { clients, capabilities } = get();
    const client = clients[url];
    if (!client) return;

    // Only refresh if server has prompts capability (optional, for robustness)
    const hasPromptsCapability = capabilities[url]?.prompts !== undefined;
    if (!hasPromptsCapability) return;

    try {
      const res = await client.listPrompts();
      set((state: any) => ({
        prompts: { ...state.prompts, [url]: res.prompts },
      }));
    } catch (e) {
      set((state: any) => ({
        mcpErrors: { ...state.mcpErrors, [url]: "Failed to fetch prompts" },
      }));
    }
  },
  getCompletion: async (name, ref, args, context) => {
    const { mcpServerContent } = get();
    const client = mcpRuntime.get(name);

    if (!client) {
      throw new Error("ChatApp MCP is not connected");
    }

    if (!mcpServerContent[name]?.capabilities?.completions) {
      throw new Error("MCP does not support completion");
    }

    try {
      return await client.complete({
        ref: ref,
        argument: args,
        context: context,
      });
    } catch (e) {
      return undefined;
    }
  },
  getPrompt: async (serverName, name, args) => {
    const client = mcpRuntime.get(serverName.toLowerCase())

    if (!client) {
      throw new Error("MCP is not connected");
    }

    try {
      return await client.getPrompt({ name, arguments: args });
      // set((state: any) => ({
      //   prompts: { ...state.prompts, [url]: res.prompts },
      // }));
    } catch (e) {
      //   set((state: any) => ({
      //    mcpErrors: { ...state.mcpErrors, [url]: "Failed to fetch prompts" },
      // }));
      return undefined;
    }
  },
  getPrompts: async (name) => {
    const { mcpServerContent } = get();
    const client = mcpRuntime.get(name.toLowerCase());

    if (!client) {
      throw new Error("MCP is not connected");
    }

    try {
      const res = await client.listPrompts();
      return [...res.prompts]
    } catch (e) {
    }

    return [];
  }
});
