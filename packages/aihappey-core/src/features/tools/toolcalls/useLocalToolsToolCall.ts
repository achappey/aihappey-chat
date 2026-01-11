import { useCallback } from "react";
import type { Tool } from "@modelcontextprotocol/sdk/types";
import { tool as registerRuntimeTool } from "aihappey-ai";
import { z } from "zod";
import { jsonSchemaToZod } from "json-schema-to-zod";
import { useLocalTools } from "aihappey-tools";

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

export const localToolsDelete: Tool = {
  name: "local_tools_delete",
  title: "Delete local tool",
  description: "Delete an existing local tool by name.",
  inputSchema: {
    type: "object",
    properties: {
      toolName: {
        type: "string",
        description: "Name of the local tool to delete",
      },
    },
    required: ["toolName"],
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: false,
  },
};

export const listLocalTools: Tool = {
  name: "local_tools_list",
  title: "List local tools",
  description: "List all available local tools.",
  inputSchema: { type: "object", properties: {} },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};

export const localToolsCreate: Tool = {
  name: "local_tools_create",
  title: "Create local tool",
  description: "Create a new local tool.",
  inputSchema: {
    type: "object",
    properties: {
      toolName: { type: "string", description: "Name of the new tool" },
      description: { type: "string", description: "Description of the tool" },
      inputSchema: {
        type: "string",
        description:
          "A STRING containing valid JSON Schema for the tool input (not TypeScript). Example: " +
          '{"type":"object","properties":{"a":{"type":"number"},"b":{"type":"number"}},"required":["a","b"]}',
      },
      execute: {
        type: "string",
        description:
          "Stringified javascript function. Example: 'async ({ a, b }) => { return { sum: a + b }; }'",
      },
      title: { type: "string", description: "Human-readable tool display name" },
    },
    required: ["toolName", "description", "inputSchema", "execute"],
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

export const localToolsPluginDef = {
  name: "local-tools",
  match: (toolName: string) => toolName.startsWith("local_tools_"),
  tools: [listLocalTools, localToolsCreate, localToolsDelete],
};

type LocalToolsToolName = "local_tools_create" | "local_tools_delete" | "local_tools_list";

type LocalToolsToolCall = {
  toolName: LocalToolsToolName;
  input: any;
};

/* ============================================================
   Runtime helpers
============================================================ */

function parseJsonSchemaString(inputSchema: unknown) {
  if (typeof inputSchema !== "string" || !inputSchema.trim()) {
    throw new Error("Missing inputSchema.");
  }
  try {
    return JSON.parse(inputSchema);
  } catch {
    throw new Error("inputSchema must be valid JSON.");
  }
}

function compileExecuteFunction(execute: unknown) {
  if (typeof execute !== "string" || !execute.trim()) {
    throw new Error("Missing execute.");
  }
  try {
    // Expecting something like: 'async ({a,b}) => { ... }'
    return new Function(`return (${execute})`)() as (...args: any[]) => any;
  } catch {
    throw new Error("execute must be a valid JavaScript function string.");
  }
}

function compileZodSchemaFromJsonSchema(jsonSchema: any) {
  try {
    const zodSource = jsonSchemaToZod(jsonSchema);
    // zodSource is code like: "z.object({ ... })"
    return new Function("z", `return (${zodSource});`)(z);
  } catch {
    throw new Error("Failed to convert inputSchema to zod schema.");
  }
}

/* ============================================================
   Plugin RUNTIME (execution only)
============================================================ */

export function useLocalToolsRuntime() {
  const localTools = useLocalTools();

  const handle = useCallback(
    async (toolCall: LocalToolsToolCall): Promise<ToolTextResult> => {
      try {
        switch (toolCall.toolName) {
          case "local_tools_create": {
            const input = toolCall.input ?? {};
            const toolName = input.toolName;
            const description = input.description;

            if (!toolName) throw new Error("Missing toolName.");
            if (!description) throw new Error("Missing description.");

            const jsonSchema = parseJsonSchemaString(input.inputSchema);
            const fn = compileExecuteFunction(input.execute);
            const zodSchema = compileZodSchemaFromJsonSchema(jsonSchema);

            // register for current runtime session
            registerRuntimeTool({
              description,
              inputSchema: zodSchema,
              execute: fn,
            });

            // persist in local tool store
            await localTools.add({
              id: toolName,
              description,
              title: input.title,
              inputSchema: input.inputSchema,
              execute: input.execute,
            });

            return ok("tool created");
          }

          case "local_tools_list": {
            const items = localTools.items.map(t => ({
              toolName: t.id,
              description: t.description,
              inputSchema: t.inputSchema,
              execute: t.execute,
            }));
            return ok(JSON.stringify(items));
          }

          case "local_tools_delete": {
            const { toolName } = toolCall.input ?? {};
            if (!toolName) throw new Error("Missing toolName.");

            await localTools.delete(toolName);
            return ok("Tool deleted");
          }

          default:
            throw new Error(`Unsupported tool: ${toolCall.toolName}`);
        }
      } catch (e) {
        return fail(e);
      }
    },
    [localTools]
  );

  return { name: localToolsPluginDef.name, handle };
}
