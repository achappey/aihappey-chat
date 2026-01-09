import type { Tool } from "@modelcontextprotocol/sdk/types";
import type { StoredTool } from "aihappey-tools";
import { z } from "zod";
import { jsonSchemaToZod } from "json-schema-to-zod";

export type ToolTextResult = {
  isError: boolean;
  content: { type: "text"; text: string }[];
};

export function parseStoredToolInputSchema(tool: Pick<StoredTool, "inputSchema">): any {
  if (typeof tool.inputSchema !== "string" || !tool.inputSchema.trim()) {
    throw new Error("Missing inputSchema.");
  }
  try {
    return JSON.parse(tool.inputSchema);
  } catch {
    throw new Error("inputSchema must be valid JSON.");
  }
}

export function storedToolToMcpTool(tool: StoredTool): Tool {
  const schema = parseStoredToolInputSchema(tool);

  return {
    name: tool.id,
    title: tool.id,
    description: tool.description,
    inputSchema: schema,
    // Conservative hints: custom tools may do anything.
    annotations: {
      readOnlyHint: false,
      idempotentHint: false,
      destructiveHint: true,
      openWorldHint: true,
    },
  };
}

export function compileStoredToolExecute(tool: Pick<StoredTool, "execute">) {
  if (typeof tool.execute !== "string" || !tool.execute.trim()) {
    throw new Error("Missing execute.");
  }
  try {
    // Expecting something like: 'async ({a,b}) => { ... }'
    return new Function(`return (${tool.execute})`)() as (input: any) => any;
  } catch {
    throw new Error("execute must be a valid JavaScript function string.");
  }
}

export function isStoredToolValid(tool: StoredTool): boolean {
  try {
    parseStoredToolInputSchema(tool);
    compileStoredToolExecute(tool);
    return true;
  } catch {
    return false;
  }
}

export function compileZodFromStoredTool(tool: Pick<StoredTool, "inputSchema">) {
  const jsonSchema = parseStoredToolInputSchema(tool);
  try {
    const zodSource = jsonSchemaToZod(jsonSchema);
    // zodSource is code like: "z.object({ ... })"
    return new Function("z", `return (${zodSource});`)(z) as z.ZodTypeAny;
  } catch {
    throw new Error("Failed to convert inputSchema to zod schema.");
  }
}

export function normalizeToolResult(output: any): ToolTextResult {
  // Allow advanced users to return MCP-style tool results directly.
  if (
    output &&
    typeof output === "object" &&
    typeof output.isError === "boolean" &&
    Array.isArray(output.content)
  ) {
    return output as ToolTextResult;
  }

  if (typeof output === "string") {
    return { isError: false, content: [{ type: "text", text: output }] };
  }

  if (output == null) {
    return { isError: false, content: [{ type: "text", text: "" }] };
  }

  return {
    isError: false,
    content: [{ type: "text", text: JSON.stringify(output) }],
  };
}

export function toolErrorResult(err: unknown): ToolTextResult {
  return {
    isError: true,
    content: [{ type: "text", text: err instanceof Error ? err.message : String(err) }],
  };
}

