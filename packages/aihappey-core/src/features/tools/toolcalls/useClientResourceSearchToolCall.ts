import { useCallback, useMemo } from "react";
import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types";
import { DEFAULT_SIDE_INFERENCE_AGENT_SELECTION, useAppStore } from "aihappey-state";
import { invokeSideInferenceAgent } from "../../../runtime/chat-app/sideInferenceAgentCall";
import {
  CLIENT_RESOURCE_SEARCH_NAME,
  CLIENT_RESOURCE_SEARCH_PLUGIN_ID,
  EMPTY_CLIENT_RESOURCE_SEARCH_RESULT,
  clientResourceSearchQuery,
  parseClientResourceSearchSelection,
  toResourceSearchCatalog,
} from "../clientResourceSearch";

export const CLIENT_RESOURCE_SEARCH_INSTRUCTIONS =
  "Select the MCP resources and resource templates that are relevant to the supplied query from the supplied server-scoped catalog, using the MCP server instructions as additional context when provided. Prefer returning all clearly relevant entries; return empty arrays only when no catalog entry is reasonably related to the query. Return exactly one JSON object with the shape {\"selectedResourceUris\":[\"exact_resource_uri\"],\"selectedResourceTemplateUriTemplates\":[\"exact_uri_template\"]}. Use only exact values present in the catalog, preserve relevance order, include no duplicates, select at most 20 entries in each array, and include no markdown or text outside the JSON object.";

export const clientResourceSearchTool: Tool = {
  name: CLIENT_RESOURCE_SEARCH_NAME,
  title: "Search MCP resources",
  description:
    "Search the resources and resource templates advertised by one connected MCP server. Results preserve their MCP shapes and can be read with read_resource.",
  inputSchema: {
    type: "object",
    properties: {
      serverUrl: {
        type: "string",
        description: "Exact URL of the connected MCP server whose resources should be searched.",
      },
      query: {
        type: "string",
        description: "Concise description or keywords for the resources to find.",
      },
    },
    required: ["serverUrl", "query"],
    additionalProperties: false,
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
};

export const clientResourceSearchPluginDef = {
  name: CLIENT_RESOURCE_SEARCH_PLUGIN_ID,
  title: "Client resource search",
  description: "Use an app agent in this browser to search a connected MCP server's resource catalog.",
  match: (toolName: string) => toolName === CLIENT_RESOURCE_SEARCH_NAME,
  tools: [clientResourceSearchTool],
};

type UseClientResourceSearchArgs = {
  api: string;
  getAccessToken?: () => Promise<string | null | undefined>;
  headers?: Record<string, string>;
  customFetch?: typeof fetch;
  mcpServerContent: Record<string, any>;
  mcpServers: Record<string, any>;
};

const toCallToolResult = (result: { resources: any[]; resourceTemplates: any[] }): CallToolResult => ({
  content: [{
    type: "text",
    text: `Found ${result.resources.length} resource(s) and ${result.resourceTemplates.length} resource template(s).`,
  }],
  structuredContent: result,
});

export const useClientResourceSearchRuntime = ({
  api,
  getAccessToken,
  headers,
  customFetch,
  mcpServerContent,
  mcpServers,
}: UseClientResourceSearchArgs) => {
  const agents = useAppStore((state) => state.agents);
  const models = useAppStore((state) => state.models);
  const selectedModel = useAppStore((state) => state.selectedModel);
  const customHeaders = useAppStore((state) => state.customHeaders);
  const gatewayEnabled = useAppStore((state) => state.gatewayEnabled);
  const agentName = useAppStore((state) => state.sideInferenceAgentNames?.resourceSearchAgent)
    ?? DEFAULT_SIDE_INFERENCE_AGENT_SELECTION.resourceSearchAgent;

  const handle = useCallback(async (toolCall: any, _signal?: AbortSignal): Promise<CallToolResult> => {
    const serverUrl = typeof toolCall?.input?.serverUrl === "string"
      ? toolCall.input.serverUrl.trim()
      : "";
    if (!serverUrl) throw new Error("Missing serverUrl.");

    const serverName = Object.keys(mcpServers).find((name) =>
      mcpServers[name]?.config?.disabled !== true
      && mcpServers[name]?.config?.url === serverUrl
    );
    if (!serverName) {
      const connectedUrls = Object.keys(mcpServers)
        .filter((name) => mcpServers[name]?.config?.disabled !== true)
        .map((name) => mcpServers[name]?.config?.url)
        .filter(Boolean);
      throw new Error(`Invalid url. Connected servers: ${connectedUrls.join("\n")}`);
    }

    const query = clientResourceSearchQuery(toolCall?.input);
    const catalog = toResourceSearchCatalog(mcpServerContent[serverName]);
    if (!query || (catalog.resources.length === 0 && catalog.resourceTemplates.length === 0)) {
      return toCallToolResult(EMPTY_CLIENT_RESOURCE_SEARCH_RESULT);
    }

    const output = await invokeSideInferenceAgent({
      feature: "resourceSearch",
      input: {
        query,
        serverUrl,
        mcpServerInstructions: typeof mcpServerContent[serverName]?.instructions === "string"
          && mcpServerContent[serverName].instructions.trim()
            ? mcpServerContent[serverName].instructions.trim()
            : null,
        ...catalog,
      },
      baseUrl: api,
      getAccessToken,
      customHeaders: Object.keys(customHeaders ?? {}).length ? customHeaders : headers,
      gatewayEnabled,
      fetch: customFetch,
      agents,
      models,
      agentName,
      fallbackModelId: selectedModel,
      fallbackInstructions: CLIENT_RESOURCE_SEARCH_INSTRUCTIONS,
    });

    return toCallToolResult(parseClientResourceSearchSelection(output, catalog));
  }, [agentName, agents, api, customFetch, customHeaders, gatewayEnabled, getAccessToken, headers, mcpServerContent, mcpServers, models, selectedModel]);

  return useMemo(() => ({
    name: CLIENT_RESOURCE_SEARCH_PLUGIN_ID,
    match: (toolName: string) => toolName === CLIENT_RESOURCE_SEARCH_NAME,
    handle,
  }), [handle]);
};

