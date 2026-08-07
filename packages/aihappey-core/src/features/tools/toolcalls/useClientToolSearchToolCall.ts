import { useCallback, useMemo } from "react";
import type { Tool } from "@modelcontextprotocol/sdk/types";
import { DEFAULT_SIDE_INFERENCE_AGENT_SELECTION, useAppStore } from "aihappey-state";
import { invokeSideInferenceAgent } from "../../../runtime/chat-app/sideInferenceAgentCall";
import {
  CLIENT_TOOL_SEARCH_NAME,
  CLIENT_TOOL_SEARCH_PLUGIN_ID,
  EMPTY_CLIENT_TOOL_SEARCH_RESULT,
  OPENAI_CLIENT_TOOL_SEARCH_NAME,
  clientToolSearchGoal,
  parseClientToolSearchSelection,
  toCanonicalToolCatalog,
} from "../clientToolSearch";

const toCallToolResult = (result: { selectedTools: Array<{ name: string }> }) => ({
  content: [{
    type: "text",
    text: result.selectedTools.length > 0
      ? `Selected ${result.selectedTools.length} tool(s): ${result.selectedTools.map((tool) => tool.name).join(", ")}`
      : "No matching tools were selected.",
  }],
  structuredContent: result,
});

export const CLIENT_TOOL_SEARCH_INSTRUCTIONS =
  "Select the tools that best satisfy the supplied search goal from the supplied tool catalog. Return exactly one JSON object with the shape {\"selectedToolNames\":[\"exact_tool_name\"]}. Use only exact names present in the catalog, preserve relevance order, include no duplicates, select at most 10 tools, and include no markdown or text outside the JSON object.";

export const clientToolSearchTool: Tool = {
  name: CLIENT_TOOL_SEARCH_NAME,
  description: "Search the available tool catalog and load the tools that best satisfy a goal.",
  inputSchema: {
    type: "object",
    properties: {
      goal: {
        type: "string",
        description: "A concise description of the capability or task to find tools for.",
      },
    },
    required: ["goal"],
    additionalProperties: false,
  },
};

export const clientToolSearchPluginDef = {
  name: CLIENT_TOOL_SEARCH_PLUGIN_ID,
  title: "Client tool search",
  description: "Use an app agent in this browser to select and load relevant tools.",
  match: (toolName: string) => toolName === CLIENT_TOOL_SEARCH_NAME,
  tools: [clientToolSearchTool],
};

type UseClientToolSearchArgs = {
  api: string;
  getAccessToken?: () => Promise<string | null | undefined>;
  headers?: Record<string, string>;
  customFetch?: typeof fetch;
  tools: unknown[];
};

export const useClientToolSearchRuntime = ({
  api,
  getAccessToken,
  headers,
  customFetch,
  tools,
}: UseClientToolSearchArgs) => {
  const agents = useAppStore((state) => state.agents);
  const models = useAppStore((state) => state.models);
  const selectedModel = useAppStore((state) => state.selectedModel);
  const customHeaders = useAppStore((state) => state.customHeaders);
  const gatewayEnabled = useAppStore((state) => state.gatewayEnabled);
  const agentName = useAppStore((state) => state.sideInferenceAgentNames?.toolSearchAgent)
    ?? DEFAULT_SIDE_INFERENCE_AGENT_SELECTION.toolSearchAgent;

  const catalog = useMemo(() => toCanonicalToolCatalog(tools), [tools]);

  const handle = useCallback(async (toolCall: any, _signal?: AbortSignal) => {
    const goal = clientToolSearchGoal(toolCall?.input);
    if (!goal || catalog.length === 0) return toCallToolResult(EMPTY_CLIENT_TOOL_SEARCH_RESULT);

    const output = await invokeSideInferenceAgent({
      feature: "toolSearch",
      input: { goal, tools: catalog },
      baseUrl: api,
      getAccessToken,
      customHeaders: Object.keys(customHeaders ?? {}).length ? customHeaders : headers,
      gatewayEnabled,
      fetch: customFetch,
      agents,
      models,
      agentName,
      fallbackModelId: selectedModel,
      fallbackInstructions: CLIENT_TOOL_SEARCH_INSTRUCTIONS,
    });

    return toCallToolResult(parseClientToolSearchSelection(output, catalog));
  }, [agentName, agents, api, catalog, customFetch, customHeaders, gatewayEnabled, getAccessToken, headers, models, selectedModel]);

  return useMemo(() => ({
    name: CLIENT_TOOL_SEARCH_PLUGIN_ID,
    match: (toolName: string) => toolName === CLIENT_TOOL_SEARCH_NAME || toolName === OPENAI_CLIENT_TOOL_SEARCH_NAME,
    handle,
  }), [handle]);
};
