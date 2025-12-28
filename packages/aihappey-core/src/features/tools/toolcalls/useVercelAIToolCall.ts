import { useCallback } from "react";
import { useAppStore } from "aihappey-state";
import type { Tool } from "@modelcontextprotocol/sdk/types";
import { createBackendProvider, generateText, stepCountIs, tool, ToolLoopAgent, ToolSet } from "aihappey-ai";
import { z } from "zod";
import { jsonSchemaToZod } from "json-schema-to-zod"; // or similar
import { useLocalTools } from "aihappey-tools";

type ToolTextResult = {
  isError: boolean;
  content: { type: "text"; text: string }[];
};

function fail(err: unknown): ToolTextResult {
  const message = err instanceof Error ? err.message : String(err);
  return { isError: true, content: [{ type: "text", text: message }] };
}

type LocalToolsToolName =
  | "vercel_ai_tool_loop_agent"
  | "vercel_ai_generate_text";

type LocalAgentsToolCall = {
  toolName: LocalToolsToolName;
  input: any;
};


// Simple local tool (runs fully in the browser)
const sumTool = tool({
  description: "Add two numbers",
  inputSchema: z.object({
    a: z.number(),
    b: z.number(),
  }),
  execute: async ({ a, b }) => {
    // fully local
    return { sum: a + b };
  },
});

export function useVercalAIToolCall(api: string,
  getAccessToken?: any,
  headers?: any,
  customFetch?: any) {
  const customHeaders = useAppStore(a => a.customHeaders);

  const allAgents = useAppStore(a => a.agents);
  const setAgents = useAppStore(a => a.setAgents);
  const deleteAgent = useAppStore(a => a.deleteAgent);
  const localTools = useLocalTools()

  const handleVercelAIToolCall = useCallback(
    async (toolCall: LocalAgentsToolCall): Promise<ToolTextResult | any> => {
      try {
        const provider = createBackendProvider(new URL(api!).hostname,
          api.replace("/api/chat", ""),
          {
            ...(headers ?? {}),
            ...(customHeaders ?? {})
          },
          getAccessToken);

        const model = provider(toolCall.input.model);

        switch (toolCall.toolName) {
          case "vercel_ai_tool_loop_agent":
            console.log(toolCall.input)
            const tools = await localTools.list();
            const normalizeToolName = (name: string) =>
              name.startsWith("functions.") ? name.slice("functions.".length) : name;

            const requestedTools = tools.filter(t =>
              toolCall.input.tools
                .map(normalizeToolName)
                .includes(t.id)
            );

            const aiTools: any = {
            };

            for (const a of requestedTools) {
              const fn = eval(a.execute);
              const zodSource = jsonSchemaToZod(JSON.parse(a.inputSchema));
              const zodSchema = new Function("z", `return ${zodSource}`)(z);
              const newTool = tool({
                description: a.description,
                inputSchema: zodSchema,
                execute: fn,
              });

              aiTools[a.id] = newTool
            }

            const result = await runToolLoopAgent(model, toolCall.input.instructions,
              aiTools, toolCall.input.prompt, toolCall.input.maxStepCount ?? 20
            )
            return {
              isError: false, content: [{
                type: "resource", resource: {
                  text: JSON.stringify(result),
                  mimeType: "application/json",
                  uri: "https://ai-sdk.dev/docs/agents"
                }
              }]
            };

          case "vercel_ai_generate_text":
            const generateTextRsult = await generateText({
              model: model,
              prompt: toolCall.input.prompt,
              tools: {}
            });

            return {
              isError: false, content: [{
                type: "resource", resource: {
                  text: JSON.stringify(generateTextRsult),
                  mimeType: "application/json",
                  uri: "https://ai-sdk.dev/docs/ai-sdk-core/generating-text"
                }
              }]
            };
          default:
            throw new Error(`Unsupported tool: ${toolCall.toolName}`);
        }
      } catch (e) {
        return fail(e);
      }
    },
    [allAgents, deleteAgent, setAgents]
  );

  return { handleVercelAIToolCall };
}

export const vercelAiGenerateText: Tool = {
  name: "vercel_ai_generate_text",
  title: "Generate text",
  description: "Runs a Vercel AI text generation.",
  inputSchema: {
    type: "object",
    properties: {
      model: {
        type: "string",
        description: "Model to run the agent on. For example 'openai/gpt-5-mini' or 'openai/gpt-5.1'"
      },
      prompt: {
        type: "string",
        description: "Prompt to ask the agent"
      },
    },
    required: [
      "prompt",
      "model"
    ]
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
};


export const vercelAiToolLoopAgent: Tool = {
  name: "vercel_ai_tool_loop_agent",
  title: "Run Tool Loop Agent",
  description: "Runs a generation on a Vercel AI Tool Loop Agent.",
  inputSchema: {
    type: "object",
    properties: {
      model: {
        type: "string",
        description: "Model to run the agent on. For example 'openai/gpt-5-mini' or 'openai/gpt-5.1'"
      },
      instructions: {
        type: "string",
        description: "Tool loop agent instructions"
      },
      tools: {
        type: "array",
        description: "List of tool names available to the agent",
        items: {
          type: "string"
        }
      },
      prompt: {
        type: "string",
        description: "Prompt to ask the agent"
      },
      maxStepCount: {
        type: "number",
        description: "Max step count. Defaults to 20."
      },
    },
    required: [
      "model",
      "instructions",
      "prompt",
      "tools"
    ]
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: true
  }
};

// Example usage (client-side)
export async function runToolLoopAgent(model: any, instructions: string,
  tools: ToolSet, prompt: string, maxStepCount: number = 20) {
  const localAgent = new ToolLoopAgent({
    model: model,
    instructions: instructions,
    tools: tools,
    stopWhen: stepCountIs(maxStepCount)
  })

  const result = await localAgent.generate({
    prompt: prompt,
  });

  return result;
}