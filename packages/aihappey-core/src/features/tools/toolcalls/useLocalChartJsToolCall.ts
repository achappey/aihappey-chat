import { useCallback } from "react";
import type { Tool } from "@modelcontextprotocol/sdk/types";
import { getChartJsRuntimeCapabilities } from "../../../runtime/charting/chartjs-setup";

type ToolTextResult = {
  isError: boolean;
  structuredContent?: any,
  content?: { type: "text"; text: string }[];
};

const ok = (text: string): ToolTextResult => ({
  isError: false,
  structuredContent: JSON.parse(text)
});

const fail = (err: unknown): ToolTextResult => ({
  isError: true,
  content: [{ type: "text", text: err instanceof Error ? err.message : String(err) }],
});

const stringifyJsonSafe = (value: unknown) => {
  const seen = new WeakSet<object>();

  return JSON.stringify(value, (_key, current) => {
    if (typeof current === "function" || typeof current === "symbol" || typeof current === "undefined") {
      return undefined;
    }

    if (typeof current === "number" && !Number.isFinite(current)) {
      return null;
    }

    if (current && typeof current === "object") {
      if (seen.has(current)) return "[Circular]";
      seen.add(current);
    }

    return current;
  });
};

export const localChartJsCapabilitiesTool: Tool = {
  name: "local_chartjs_capabilities",
  title: "Get Chart.js runtime capabilities",
  description:
    "Return the local Chart.js runtime registry: registered controllers/chart types, elements, scales, plugins, defaults, plugin option paths, Chart.js version, and AI usage rules for chartjs markdown blocks.",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};

export const localChartJsPluginDef = {
  name: "local-chartjs",
  match: (toolName: string) => toolName === "local_chartjs_capabilities",
  tools: [localChartJsCapabilitiesTool],
};

type LocalChartJsToolCall = {
  toolName: "local_chartjs_capabilities";
  input?: any;
};

export function useLocalChartJsRuntime() {
  const handle = useCallback(async (toolCall: LocalChartJsToolCall): Promise<ToolTextResult> => {
    try {
      if (toolCall.toolName !== "local_chartjs_capabilities") {
        throw new Error(`Unsupported tool: ${toolCall.toolName}`);
      }

      return ok(stringifyJsonSafe(getChartJsRuntimeCapabilities()));
    } catch (e) {
      return fail(e);
    }
  }, []);

  return {
    name: localChartJsPluginDef.name,
    handle,
  };
}
