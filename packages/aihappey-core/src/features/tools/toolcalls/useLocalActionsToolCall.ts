import { useCallback } from "react";
import type { Tool } from "@modelcontextprotocol/sdk/types";
import { useJsonRenderRegistry } from "aihappey-json-render-registry";

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
  content: [{ type: "text", text: err instanceof Error ? err.message : String(err) }],
});

/* ============================================================
   Tool definitions (STATIC)
============================================================ */

export const localActionsCreate: Tool = {
  name: "local_actions_create",
  title: "Create local action",
  description: "Create a new local json-render action.",
  inputSchema: {
    type: "object",
    properties: {
      registryId: { type: "string", description: "Registry id (e.g. app)" },
      actionName: { type: "string", description: "Name of the new action" },
      description: { type: "string", description: "Description of the action" },
      title: { type: "string", description: "Human-readable action display name" },
      paramsSchema: {
        type: "string",
        description:
          "A STRING containing valid JSON Schema for the action params. Example: " +
          '{"type":"object","properties":{"id":{"type":"string"}},"required":["id"]}',
      },
      execute: {
        type: "string",
        description:
          "Stringified javascript function. Example: 'async ({ id }) => { return { ok: true, id }; }'",
      },
    },
    required: ["actionName", "execute"],
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
  },
};

export const localActionsList: Tool = {
  name: "local_actions_list",
  title: "List local actions",
  description: "List all available local json-render actions.",
  inputSchema: { type: "object", properties: {} },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};

export const localActionsDelete: Tool = {
  name: "local_actions_delete",
  title: "Delete local action",
  description: "Delete an existing local json-render action by name.",
  inputSchema: {
    type: "object",
    properties: {
      actionName: { type: "string", description: "Name of the local action to delete" },
    },
    required: ["actionName"],
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: false,
  },
};

/* ============================================================
   Plugin DEFINITION (STATIC)
============================================================ */

export const localActionsPluginDef = {
  name: "local-actions",
  match: (toolName: string) => toolName.startsWith("local_actions_"),
  tools: [localActionsList, localActionsCreate, localActionsDelete],
};

type LocalActionsToolName =
  | "local_actions_create"
  | "local_actions_delete"
  | "local_actions_list";

type LocalActionsToolCall = {
  toolName: LocalActionsToolName;
  input: any;
};

/* ============================================================
   Plugin RUNTIME (execution only)
============================================================ */

export function useLocalActionsRuntime() {
  const registry = useJsonRenderRegistry();

  const handle = useCallback(
    async (toolCall: LocalActionsToolCall): Promise<ToolTextResult> => {
      try {
        switch (toolCall.toolName) {
          case "local_actions_create": {
            const input = toolCall.input ?? {};
            const actionName = input.actionName;
            const execute = input.execute;

            if (!actionName) throw new Error("Missing actionName.");
            if (!execute) throw new Error("Missing execute.");

            const registryId = input.registryId ?? "app";

            await registry.addAction(
              registryId,
              actionName,
              execute,
              input.paramsSchema,
              input.description,
              input.title,
            );

            return ok("action created");
          }

          case "local_actions_list": {
            const items = registry.actions.map((a) => ({
              actionName: a.name,
              registryId: a.registryId,
              description: a.description,
              title: a.title,
              paramsSchema: a.paramsSchema,
              execute: a.code,
            }));
            return ok(JSON.stringify(items));
          }

          case "local_actions_delete": {
            const { actionName } = toolCall.input ?? {};
            if (!actionName) throw new Error("Missing actionName.");

            const action = registry.actions.find((a) => a.name === actionName);
            if (!action) throw new Error(`Action not found: ${actionName}`);
            await registry.deleteAction(action.id);
            return ok("Action deleted");
          }

          default:
            throw new Error(`Unsupported tool: ${toolCall.toolName}`);
        }
      } catch (e) {
        return fail(e);
      }
    },
    [registry],
  );

  return { name: localActionsPluginDef.name, handle };
}
