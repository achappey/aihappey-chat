import { useCallback } from "react";
import { useAppStore } from "aihappey-state";
import type { Tool } from "@modelcontextprotocol/sdk/types";
import { tool } from "aihappey-ai";
import { z } from "zod";
import { jsonSchemaToZod } from "json-schema-to-zod"; // or similar
import { useLocalTools } from "aihappey-tools";

type ToolTextResult = {
  isError: boolean;
  content: { type: "text"; text: string }[];
};

function ok(text: string): ToolTextResult {
  return { isError: false, content: [{ type: "text", text }] };
}

function fail(err: unknown): ToolTextResult {
  const message = err instanceof Error ? err.message : String(err);
  return { isError: true, content: [{ type: "text", text: message }] };
}

type LocalToolsToolName =
  | "local_tools_create"
  | "local_tools_delete"
  | "local_tools_list";

type LocalAgentsToolCall = {
  toolName: LocalToolsToolName;
  input: any;
};

export function useLocalToolsToolCall() {
  const allAgents = useAppStore(a => a.agents);
  const setAgents = useAppStore(a => a.setAgents);
  const deleteAgent = useAppStore(a => a.deleteAgent);
  const localTools = useLocalTools()

  const handleLocalToolsToolCall = useCallback(
    async (toolCall: LocalAgentsToolCall): Promise<ToolTextResult> => {
      try {
        switch (toolCall.toolName) {
          case "local_tools_create":
            const fn = eval(toolCall.input.execute);
            const zodSource = jsonSchemaToZod(JSON.parse(toolCall.input.inputSchema));
            const zodSchema = new Function("z", `return ${zodSource}`)(z);

            tool({
              description: toolCall.input.description,
              inputSchema: zodSchema,
              execute: fn,
            });

            await localTools.add({
              description: toolCall.input.description,
              inputSchema: toolCall.input.inputSchema,
              execute: toolCall.input.execute,
              id: toolCall.input.toolName
            })
            //  const test = newTool.execute({a: 1, b: 2}, {})
            ///     console.log(config.api)
            //   console.log(config.getAccessToken)
            /*      const provider = createBackendProvider(new URL(api!).hostname,
                    api.replace("/api/chat", ""), getAccessToken);
      
                  const model = provider("openai/gpt-5-mini"); // or whatever id your backend accepts
      
                  const reuslt = await runLocalAgentExample(model, newTool)*/
            return ok("tool created");
          case "local_tools_list":
            const items = localTools.items.map(z => ({
              description: z.description,
              inputSchema: z.inputSchema,
              execute: z.execute,
              toolName: z.id
            }))

            return ok(JSON.stringify(items))
          case "local_tools_delete":
            await localTools.delete(toolCall.input.toolName)

            return ok("Tool deleted")
          default:
            throw new Error(`Unsupported tool: ${toolCall.toolName}`);
        }
      } catch (e) {
        return fail(e);
      }
    },
    [allAgents, deleteAgent, setAgents]
  );

  return { handleLocalToolsToolCall };
}

export const localToolsDelete: Tool = {
  name: "local_tools_delete",
  title: "Delete local tool",
  description: "Delete an existing local tool by name.",
  inputSchema: {
    type: "object",
    properties: {
      toolName: {
        type: "string",
        description: "Name of the local tool to delete"
      }
    },
    required: [
      "toolName"
    ]
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: false
  }
};


export const listLocalTools: Tool = {
  name: "local_tools_list",
  title: "List local tools",
  description: "List all available local tools.",
  inputSchema: {
    type: "object",
    properties: {

    },
    required: [
    ]
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};



export const localToolsCreate: Tool = {
  name: "local_tools_create",
  title: "Create local tool",
  description: "Create a new local tool.",
  inputSchema: {
    type: "object",
    properties: {
      toolName: {
        type: "string",
        description: "Name of the new tool"
      },
      description: {
        type: "string",
        description: "Description of the tool"
      },

      inputSchema: {
        type: "string",
        description:
          "A STRING containing valid JSON Schema for the tool input (not TypeScript). Example: " +
          '{"type":"object","properties":{"a":{"type":"number"},"b":{"type":"number"}},"required":["a","b"]}'
      },

      execute: {
        type: "string",
        description: "Stringified version of the javascript to execute. For example: 'async ({ a, b }) => {  return { sum: a + b };  }'"
      },
    },
    required: [
      "description",
      "inputSchema",
      "execute"
    ]
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false
  }
};