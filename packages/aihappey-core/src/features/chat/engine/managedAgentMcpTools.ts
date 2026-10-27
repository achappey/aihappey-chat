import type { Tool } from "aihappey-mcp";
import type { store } from "aihappey-state";
import { activeAssistantMessages, isAgentToolPart, pendingToolApprovals } from "./toolApprovalState";

export type LocalToolSource = { kind: "plugin" | "local"; id: string };
export type ManagedAgentLocalTool = Tool & { source: LocalToolSource };
type ToolRoute = { serverId: string; toolName: string; source?: never }
  | { source: LocalToolSource; toolName: string; serverId?: never };
type McpState = ReturnType<typeof store.getState>;
type CatalogState = Pick<McpState, "mcpServerContent" | "mcpServers" | "toolAnnotations">;

export type ManagedAgentMcpCatalog = {
  tools: Tool[];
  routes: Map<string, ToolRoute>;
};

// Stable aliases keep approvals and routing scoped to both server and tool.
const hash = (value: string, seed: number) => {
  let result = seed;
  for (let i = 0; i < value.length; i++) {
    result = Math.imul(result ^ value.charCodeAt(i), 16777619);
  }
  return (result >>> 0).toString(16).padStart(8, "0");
};

export function buildManagedAgentMcpCatalog(
  state: CatalogState,
  connectedServers: { has: (serverId: string) => boolean },
  localTools: ManagedAgentLocalTool[] = [],
): ManagedAgentMcpCatalog {
  const tools: Tool[] = [];
  const routes = new Map<string, ToolRoute>();
  const gates = state.toolAnnotations ?? {};
  const allowed = (tool: Tool) => {
    const a = tool.annotations ?? {};
    return !(gates.readOnlyHint && !a.readOnlyHint)
      && !(!a.readOnlyHint && gates.idempotentHint && !a.idempotentHint)
      && !(!a.readOnlyHint && a.destructiveHint && !gates.destructiveHint)
      && !(a.openWorldHint && !gates.openWorldHint);
  };
  for (const [serverId, content] of Object.entries(state.mcpServerContent)) {
    const server = state.mcpServers[serverId];
    if (!server || server.config.disabled || !connectedServers.has(serverId)) continue;
    for (const tool of content.tools ?? []) {
      if (!allowed(tool)) continue;

      const identity = JSON.stringify([serverId, tool.name]);
      const suffix = hash(identity, 2166136261) + hash(identity, 3339675911);
      const label = tool.name.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 42);
      const name = `mcp_${label}_${suffix}`;
      if (routes.has(name)) throw new Error("Duplicate managed agent MCP tool identity");
      routes.set(name, { serverId, toolName: tool.name });
      tools.push({
        name,
        description: `${tool.description ?? tool.name} (MCP server: ${serverId})`,
        inputSchema: tool.inputSchema,
        ...(tool.annotations ? { annotations: tool.annotations } : {}),
      });
    }
  }
  const counts = new Map<string, number>();
  for (const tool of localTools) counts.set(tool.name, (counts.get(tool.name) ?? 0) + 1);
  const reserved = new Set([...routes.keys(), ...localTools.map(tool => tool.name), "ai_input_required"]);
  const identities = new Set<string>();
  for (const tool of localTools) {
    if (!allowed(tool)) continue;
    const source = { kind: tool.source.kind, id: tool.source.id };
    const identity = JSON.stringify([source.kind, source.id, tool.name]);
    if (identities.has(identity)) continue;
    identities.add(identity);
    let name = tool.name;
    if (routes.has(name) || counts.get(name)! > 1 || name === "ai_input_required" || !/^[a-zA-Z0-9_-]{1,64}$/.test(name)) {
      const label = name.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40);
      const alias = `local_${label}_${hash(identity, 2166136261)}${hash(identity, 3339675911)}`;
      name = alias;
      let index = 2;
      while (reserved.has(name)) name = `${alias.slice(0, 58)}_${index++}`;
    }
    reserved.add(name);
    routes.set(name, { source, toolName: tool.name });
    // Only the existing declaration contract crosses the wire, never source
    // metadata, stored execution code, or provider-native request options.
    tools.push({ name, description: tool.description, inputSchema: tool.inputSchema,
      ...(tool.annotations ? { annotations: tool.annotations } : {}) });
  }
  return { tools, routes };
}

export async function executeManagedAgentMcpTool(
  catalog: ManagedAgentMcpCatalog,
  toolCall: { toolCallId: string; toolName: string; input: unknown; providerExecuted?: boolean },
  callTool: McpState["callTool"],
  locale?: string,
  signal?: AbortSignal,
  callLocalTool?: (options: { toolCall: { toolCallId: string; toolName: string; input: unknown }; source: LocalToolSource; signal?: AbortSignal }) => Promise<unknown>,
) {
  if (toolCall.providerExecuted) return;
  try {
    signal?.throwIfAborted();
    const route = catalog.routes.get(toolCall.toolName);
    if (!route) throw new Error("Client tool is unavailable for this agent run");
    if (route.source) {
      if (!callLocalTool) throw new Error("Local tool runtime is unavailable for this agent run");
      return await callLocalTool({ toolCall: { ...toolCall, toolName: route.toolName }, source: route.source, signal });
    }
    return await callTool(toolCall.toolCallId, route.toolName, toolCall.input, locale, signal, route.serverId);
  } catch (error) {
    return {
      isError: true,
      content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }],
    };
  }
}

const clientToolParts = (messages: any[]) => {
  return activeAssistantMessages(messages).flatMap(message => (message.parts ?? []).filter((part: any) =>
      isAgentToolPart(part)
      && !part.providerExecuted && part.toolName !== "ai_input_required"
      && part.type !== "tool-ai_input_required"));
};

// Approval requests contain an already executed result, not a new client call.
// Wait for the full stream so only unresolved inputs are dispatched.
export function pendingManagedAgentMcpCalls(messages: any[], status: string) {
  if (status !== "ready") return [];
  return clientToolParts(messages)
    .filter((part: any) => part.state === "input-available" && part.output === undefined)
    .map((part: any) => ({
      toolCallId: part.toolCallId,
      toolName: part.toolName ?? part.type.slice("tool-".length),
      input: part.input,
    }));
}

export function managedAgentMcpCallsPending(messages: any[]) {
  return pendingToolApprovals(messages).length > 0 || clientToolParts(messages).some((part: any) =>
    part.state === "input-streaming" || part.state === "input-available"
    || part.state === "approval-requested");
}

export function managedAgentStopTools(catalog: ManagedAgentMcpCatalog, stopTools?: string[]) {
  const names = new Set((stopTools ?? []).map(name => name.trim().toLowerCase()));
  return [
    ...(stopTools ?? []),
    ...[...catalog.routes].filter(([, route]) => names.has(route.toolName.toLowerCase())).map(([name]) => name),
  ];
}
