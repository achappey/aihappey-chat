import { useCallback } from "react";
import { useAppStore } from "aihappey-state";
import type { Tool } from "@modelcontextprotocol/sdk/types";
import {
  createBackendProvider,
  generateText,
  stepCountIs,
  tool,
  ToolLoopAgent,
  type ToolSet,
} from "aihappey-ai";
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

function fail(err: unknown): ToolTextResult {
  const message = err instanceof Error ? err.message : String(err);
  return { isError: true, content: [{ type: "text", text: message }] };
}

/* ============================================================
   Tool definitions (STATIC)
============================================================ */

export const vercelAiGenerateText: Tool = {
  name: "vercel_ai_generate_text",
  title: "Generate text",
  description: "Runs a Vercel AI text generation.",
  inputSchema: {
    type: "object",
    properties: {
      model: {
        type: "string",
        description:
          "Model to run on. For example 'openai/gpt-5-mini' or 'openai/gpt-5.2'",
      },
      prompt: {
        type: "string",
        description: "Prompt to ask the model",
      },
    },
    required: ["prompt", "model"],
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
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
        description:
          "Model to run on. For example 'openai/gpt-5-mini' or 'openai/gpt-5.2'",
      },
      instructions: {
        type: "string",
        description: "Tool loop agent instructions",
      },
      tools: {
        type: "array",
        description: "List of tool names available to the agent",
        items: { type: "string" },
      },
      prompt: {
        type: "string",
        description: "Prompt to ask the agent",
      },
      maxStepCount: {
        type: "number",
        description: "Max step count. Defaults to 20.",
      },
    },
    required: ["model", "instructions", "prompt", "tools"],
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: true,
  },
};

/* ============================================================
   Plugin DEFINITION (STATIC)
============================================================ */

export const vercelAIPluginDef = {
  name: "vercel-ai",
  match: (toolName: string) => toolName.startsWith("vercel_ai_"),
  tools: [vercelAiToolLoopAgent, vercelAiGenerateText],
};

/* ============================================================
   Runtime helpers (PURE)
============================================================ */

type VercelAIToolName = "vercel_ai_tool_loop_agent" | "vercel_ai_generate_text";

type VercelAIToolCall = {
  toolName: VercelAIToolName;
  input: any;
};

const normalizeToolName = (name: string) =>
  typeof name === "string" && name.startsWith("functions.")
    ? name.slice("functions.".length)
    : name;

function toJsonResource(uri: string, value: any) {
  return {
    isError: false,
    content: [
      {
        type: "resource",
        resource: {
          text: JSON.stringify(value),
          mimeType: "application/json",
          uri,
        },
      },
    ],
  };
}

function buildToolSetFromLocalTools(items: Array<{ id: string; description: string; inputSchema: string; execute: string }>) {
  const out: ToolSet = {};

  for (const a of items) {
    const fn = new Function(`return (${a.execute})`)(); // eslint-disable-line no-new-func
    const zodSource = jsonSchemaToZod(JSON.parse(a.inputSchema));
    const zodSchema = new Function("z", `return ${zodSource}`)(z); // eslint-disable-line no-new-func

    out[a.id] = tool({
      description: a.description,
      inputSchema: zodSchema,
      execute: fn,
    });
  }

  return out;
}

export async function runToolLoopAgent(
  model: any,
  instructions: string,
  tools: ToolSet,
  prompt: string,
  maxStepCount: number = 20
) {
  const localAgent = new ToolLoopAgent({
    model,
    instructions,
    tools,
    stopWhen: stepCountIs(maxStepCount),
  });

  return await localAgent.generate({ prompt });
}

/* ============================================================
   Plugin RUNTIME (execution only)
============================================================ */

export function useVercalAIToolCall(
  api: string,
  getAccessToken?: any,
  headers?: any,
  customFetch?: any
) {
  const customHeaders = useAppStore(a => a.customHeaders);
  const localTools = useLocalTools();

  const handle = useCallback(
    async (toolCall: VercelAIToolCall): Promise<any> => {
      try {
        if (!api) throw new Error("api is required.");

        const provider = createBackendProvider(
          new URL(api).hostname,
          api.replace("/api/chat", ""),
          { ...(headers ?? {}), ...(customHeaders ?? {}) },
          getAccessToken
        );

        const modelId = toolCall?.input?.model;
        if (!modelId) throw new Error("Missing input.model.");

        const model = provider(modelId);

        switch (toolCall.toolName) {
          case "vercel_ai_tool_loop_agent": {
            const instructions = String(toolCall?.input?.instructions ?? "");
            const prompt = String(toolCall?.input?.prompt ?? "");
            const maxStepCount = Number(toolCall?.input?.maxStepCount ?? 20);

            const requested = Array.isArray(toolCall?.input?.tools)
              ? toolCall.input.tools.map(normalizeToolName)
              : [];

            const stored = await localTools.list();
            const selected = stored.filter(t => requested.includes(t.id));

            const toolSet = buildToolSetFromLocalTools(selected);

            const result = await runToolLoopAgent(
              model,
              instructions,
              toolSet,
              prompt,
              maxStepCount
            );

            return toJsonResource("https://ai-sdk.dev/docs/agents", result);
          }

          case "vercel_ai_generate_text": {
            const prompt = String(toolCall?.input?.prompt ?? "");

            const result = await generateText({
              model,
              prompt,
              tools: {},
            });

            return toJsonResource(
              "https://ai-sdk.dev/docs/ai-sdk-core/generating-text",
              result
            );
          }

          default:
            throw new Error(`Unsupported tool: ${toolCall.toolName}`);
        }
      } catch (e) {
        return fail(e);
      }
    },
    [api, headers, customHeaders, getAccessToken, customFetch, localTools]
  );

  // runtime only
  return {
    name: vercelAIPluginDef.name,
    handle,
  };
}
