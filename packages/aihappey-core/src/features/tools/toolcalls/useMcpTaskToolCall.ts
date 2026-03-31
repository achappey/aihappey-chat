import { useCallback, useMemo } from "react";
import type { Tool } from "@modelcontextprotocol/sdk/types";
import { useAppStore } from "aihappey-state";

type ToolTextResult = {
  isError: boolean;
  content: { type: "text"; text: string }[];
  structuredContent?: Record<string, any>;
};

type TaskAction = "get" | "result" | "list" | "cancel";

const ok = (text: string, structuredContent?: Record<string, any>): ToolTextResult => ({
  isError: false,
  content: [{ type: "text", text }],
  structuredContent,
});

const fail = (err: unknown): ToolTextResult => ({
  isError: true,
  content: [{
    type: "text",
    text: err instanceof Error ? err.message : String(err),
  }],
});

const getTaskServersForAction = (mcpServerContent: Record<string, any>, action: TaskAction) => {
  return Object.entries(mcpServerContent)
    .filter(([_, content]) => {
      switch (action) {
        case "get":
        case "result":
          return !!content?.capabilities?.tasks?.requests?.tools?.call;
        case "list":
          return !!content?.capabilities?.tasks?.list;
        case "cancel":
          return !!content?.capabilities?.tasks?.cancel;
        default:
          return false;
      }
    })
    .map(([serverName]) => serverName)
    .sort();
};

const buildServerNameProperty = (serverNames: string[]) => ({
  type: "string",
  ...(serverNames.length > 0 ? { enum: serverNames } : {}),
  description: "Optional connected MCP server name. If omitted, the app searches compatible connected task servers.",
});

export const mcpTaskPluginDef = {
  name: "mcp-task",
  match: (toolName: string) => toolName.startsWith("mcp_task_"),
};

export function buildMcpTaskTools(mcpServerContent: Record<string, any>): Tool[] {
  const serverNames = Object.keys(mcpServerContent).sort();
  const canGetResult = getTaskServersForAction(mcpServerContent, "get").length > 0;
  const canList = getTaskServersForAction(mcpServerContent, "list").length > 0;
  const canCancel = getTaskServersForAction(mcpServerContent, "cancel").length > 0;

  if (!canGetResult && !canList && !canCancel) return [];

  const tools: Tool[] = [];

  if (canGetResult) {
    tools.push({
      name: "mcp_task_get",
      title: "Get MCP task status",
      description: "Get the latest status for an MCP task. If server_name is omitted, compatible connected MCP task servers are searched.",
      inputSchema: {
        type: "object",
        properties: {
          server_name: buildServerNameProperty(serverNames),
          task_id: { type: "string", description: "Task ID returned by the MCP server." },
        },
        required: ["task_id"],
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    });

    tools.push({
      name: "mcp_task_result",
      title: "Get MCP task result",
      description: "Fetch the final result for an MCP task. If server_name is omitted, compatible connected MCP task servers are searched.",
      inputSchema: {
        type: "object",
        properties: {
          server_name: buildServerNameProperty(serverNames),
          task_id: { type: "string", description: "Task ID returned by the MCP server." },
        },
        required: ["task_id"],
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    });
  }

  if (canList) {
    tools.push({
      name: "mcp_task_list",
      title: "List MCP tasks",
      description: "List MCP tasks for one connected server, or across all connected task-capable servers when server_name is omitted.",
      inputSchema: {
        type: "object",
        properties: {
          server_name: buildServerNameProperty(serverNames),
          cursor: { type: "string", description: "Optional opaque pagination cursor." },
        },
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    });
  }

  if (canCancel) {
    tools.push({
      name: "mcp_task_cancel",
      title: "Cancel MCP task",
      description: "Cancel an MCP task. If server_name is omitted, compatible connected MCP task servers are searched.",
      inputSchema: {
        type: "object",
        properties: {
          server_name: buildServerNameProperty(serverNames),
          task_id: { type: "string", description: "Task ID returned by the MCP server." },
        },
        required: ["task_id"],
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
    });
  }

  return tools;
}

type McpTaskToolCall =
  | { toolName: "mcp_task_get"; input?: { server_name?: string; task_id?: string } }
  | { toolName: "mcp_task_result"; input?: { server_name?: string; task_id?: string } }
  | { toolName: "mcp_task_list"; input?: { server_name?: string; cursor?: string } }
  | { toolName: "mcp_task_cancel"; input?: { server_name?: string; task_id?: string } };

export function useMcpTaskRuntime() {
  const mcpServerContent = useAppStore((s) => s.mcpServerContent);
  const getMcpTask = useAppStore((s: any) => s.getMcpTask);
  const getMcpTaskResult = useAppStore((s: any) => s.getMcpTaskResult);
  const listMcpTasks = useAppStore((s: any) => s.listMcpTasks);
  const cancelMcpTask = useAppStore((s: any) => s.cancelMcpTask);

  const resolveServers = useCallback((action: TaskAction, requested?: string) => {
    const serverName = String(requested ?? "").trim();
    if (serverName) return [serverName];

    const servers = getTaskServersForAction(mcpServerContent, action);
    if (servers.length === 0) {
      throw new Error(`No connected MCP servers support tasks/${action}.`);
    }

    return servers;
  }, [mcpServerContent]);

  const tryTaskOperation = useCallback(async <T,>(
    action: Exclude<TaskAction, "list">,
    requestedServer: string | undefined,
    fn: (serverName: string) => Promise<T>
  ) => {
    const servers = resolveServers(action, requestedServer);
    const errors: string[] = [];

    for (const serverName of servers) {
      try {
        return await fn(serverName);
      } catch (error) {
        errors.push(`${serverName}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    throw new Error(errors.join("\n"));
  }, [resolveServers]);

  const handle = useCallback(async (toolCall: McpTaskToolCall) => {
    try {
      switch (toolCall.toolName) {
        case "mcp_task_get": {
          const taskId = String(toolCall.input?.task_id ?? "").trim();
          if (!taskId) throw new Error("Missing task_id.");

          const task = await tryTaskOperation("get", toolCall.input?.server_name, async (serverName) => {
            return await getMcpTask(serverName, taskId);
          });

          return ok(JSON.stringify(task, null, 2), { task });
        }

        case "mcp_task_result": {
          const taskId = String(toolCall.input?.task_id ?? "").trim();
          if (!taskId) throw new Error("Missing task_id.");

          return await tryTaskOperation("result", toolCall.input?.server_name, async (serverName) => {
            return await getMcpTaskResult(serverName, taskId);
          });
        }

        case "mcp_task_list": {
          const requestedServer = String(toolCall.input?.server_name ?? "").trim();
          const cursor = typeof toolCall.input?.cursor === "string" && toolCall.input.cursor.trim().length > 0
            ? toolCall.input.cursor.trim()
            : undefined;

          if (requestedServer) {
            const result = await listMcpTasks(requestedServer, cursor);
            return ok(JSON.stringify(result, null, 2), result);
          }

          const servers = resolveServers("list");
          const result = await Promise.all(servers.map(async (serverName) => ({
            serverName,
            ...(await listMcpTasks(serverName, cursor)),
          })));

          return ok(JSON.stringify({ servers: result }, null, 2), { servers: result });
        }

        case "mcp_task_cancel": {
          const taskId = String(toolCall.input?.task_id ?? "").trim();
          if (!taskId) throw new Error("Missing task_id.");

          const task = await tryTaskOperation("cancel", toolCall.input?.server_name, async (serverName) => {
            return await cancelMcpTask(serverName, taskId);
          });

          return ok(JSON.stringify(task, null, 2), { task });
        }

        default:
          throw new Error(`Unsupported tool: ${toolCall}`);
      }
    } catch (error) {
      return fail(error);
    }
  }, [cancelMcpTask, getMcpTask, getMcpTaskResult, listMcpTasks, resolveServers, tryTaskOperation]);

  return useMemo(() => ({
    name: mcpTaskPluginDef.name,
    handle,
  }), [handle]);
}
