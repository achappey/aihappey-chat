import { useCallback } from "react";
import type { Tool } from "@modelcontextprotocol/sdk/types";

/* ============================================================
   Result helpers
============================================================ */

type ToolTextResult = {
  isError: boolean;
  content: { type: "text"; text: string }[];
};

const ok = (text: string): ToolTextResult => ({
  isError: false,
  content: [{ type: "text", text }],
});

const fail = (err: unknown): ToolTextResult => ({
  isError: true,
  content: [
    {
      type: "text",
      text: err instanceof Error ? err.message : String(err),
    },
  ],
});

/* ============================================================
   Tool definitions (STATIC)
============================================================ */

export const localTodoGetTool: Tool = {
  name: "local_todo_get",
  title: "Get todo list",
  description: "Retrieve the todo list for the current conversation.",
  inputSchema: {
    type: "object",
    properties: {},
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};

export const localTodoSetTool: Tool = {
  name: "local_todo_set",
  title: "Set todo list",
  description:
    "Replace the entire todo list for the current conversation. Must be a full markdown checklist.",
  inputSchema: {
    type: "object",
    properties: {
      todos: {
        type: "string",
        description:
          "Full markdown todo list (e.g. '- [ ] item', '- [x] item')",
      },
    },
    required: ["todos"],
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
  },
};

/* ============================================================
   Plugin DEFINITION (STATIC)
============================================================ */

export const localTodoPluginDef = {
  name: "local-todo",
  match: (toolName: string) => toolName.startsWith("local_todo_"),
  tools: [localTodoGetTool, localTodoSetTool],
};

/* ============================================================
   Plugin RUNTIME (execution only)
============================================================ */

type LocalTodoToolCall =
  | { toolName: "local_todo_get"; input?: any }
  | { toolName: "local_todo_set"; input?: { todos?: string } };

function storageKey(conversationId: string) {
  return `todo:${conversationId}`;
}

export function useLocalTodoRuntime(conversationId?: string | null) {
  const handle = useCallback(
    async (toolCall: LocalTodoToolCall): Promise<ToolTextResult> => {
      try {
        if (!conversationId) {
          throw new Error("Missing conversationId.");
        }

        const key = storageKey(conversationId);

        switch (toolCall.toolName) {
          case "local_todo_get": {
            const todos = localStorage.getItem(key) ?? "";
            return ok(todos);
          }

          case "local_todo_set": {
            const todos = toolCall.input?.todos;
            if (typeof todos !== "string") {
              throw new Error("Missing todos.");
            }
            localStorage.setItem(key, todos);
            return ok("OK");
          }

          default:
            throw new Error(`Unsupported tool: ${toolCall}`);
        }
      } catch (e) {
        return fail(e);
      }
    },
    [conversationId]
  );

  return {
    name: localTodoPluginDef.name,
    handle,
  };
}
