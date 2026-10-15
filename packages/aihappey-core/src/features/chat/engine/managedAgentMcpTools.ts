import type { Tool } from "aihappey-mcp";
import type { store } from "aihappey-state";

type ToolRoute = { serverId: string; toolName: string };
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
): ManagedAgentMcpCatalog {
  const tools: Tool[] = [];
  const routes = new Map<string, ToolRoute>();
  const gates = state.toolAnnotations ?? {};
  for (const [serverId, content] of Object.entries(state.mcpServerContent)) {
    const server = state.mcpServers[serverId];
    if (!server || server.config.disabled || !connectedServers.has(serverId)) continue;
    for (const tool of content.tools ?? []) {
      const a = tool.annotations ?? {};
      if (gates.readOnlyHint && !a.readOnlyHint) continue;
      if (!a.readOnlyHint && gates.idempotentHint && !a.idempotentHint) continue;
      if (!a.readOnlyHint && a.destructiveHint && !gates.destructiveHint) continue;
      if (a.openWorldHint && !gates.openWorldHint) continue;

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
  return { tools, routes };
}

export async function executeManagedAgentMcpTool(
  catalog: ManagedAgentMcpCatalog,
  toolCall: { toolCallId: string; toolName: string; input: unknown; providerExecuted?: boolean },
  callTool: McpState["callTool"],
  locale?: string,
  signal?: AbortSignal,
) {
  if (toolCall.providerExecuted) return;
  try {
    signal?.throwIfAborted();
    const route = catalog.routes.get(toolCall.toolName);
    if (!route) throw new Error("Client MCP tool is unavailable for this agent run");
    return await callTool(toolCall.toolCallId, route.toolName, toolCall.input, locale, signal, route.serverId);
  } catch (error) {
    return {
      isError: true,
      content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }],
    };
  }
}

const clientToolParts = (messages: any[]) => {
  const last = messages.at(-1);
  return last?.role === "assistant"
    ? (last.parts ?? []).filter((part: any) =>
      (part.type?.startsWith("tool-") || part.type === "dynamic-tool")
      && !part.providerExecuted && part.toolName !== "ai_input_required"
      && part.type !== "tool-ai_input_required")
    : [];
};

// The SDK invokes onToolCall before reading a following approval request.
// Wait for the full stream and use its final approval state before dispatch.
export function pendingManagedAgentMcpCalls(messages: any[], status: string) {
  if (status !== "ready") return [];
  return clientToolParts(messages)
    .filter((part: any) => part.state === "input-available"
      || (part.state === "approval-responded" && part.approval?.approved === true))
    .map((part: any) => ({
      toolCallId: part.toolCallId,
      toolName: part.toolName ?? part.type.slice("tool-".length),
      input: part.input,
    }));
}

export function managedAgentMcpCallsPending(messages: any[]) {
  return clientToolParts(messages).some((part: any) =>
    part.state === "input-streaming" || part.state === "input-available"
    || part.state === "approval-requested"
    || (part.state === "approval-responded" && part.approval?.approved === true));
}

export function managedAgentStopTools(catalog: ManagedAgentMcpCatalog, stopTools?: string[]) {
  const names = new Set((stopTools ?? []).map(name => name.trim().toLowerCase()));
  return [
    ...(stopTools ?? []),
    ...[...catalog.routes].filter(([, route]) => names.has(route.toolName.toLowerCase())).map(([name]) => name),
  ];
}
