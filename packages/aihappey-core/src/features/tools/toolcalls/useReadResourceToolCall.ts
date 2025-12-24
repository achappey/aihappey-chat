import { useCallback } from "react";
import { readResource as defaultReadResource } from "../../../runtime/mcp/readResource";
import type { Tool } from "@modelcontextprotocol/sdk/types";

type ToolResult = {
  isError: boolean;
  content: any[];
  _meta?: Record<string, any>;
};

type ReadResourceToolCall = {
  toolName: "read_resource";
  input: { serverUrl: string; uri: string };
};

function isValidAbsoluteUri(uri: string): boolean {
  try {
    new URL(uri);
    return true;
  } catch {
    return false;
  }
}

export function useReadResourceToolCall(opts: {
  mcpServers: any;
  readResource?: typeof defaultReadResource;
}) {
  const { mcpServers } = opts;
  const readResource = opts.readResource ?? defaultReadResource;

  const handleReadResourceToolCall = useCallback(
    async (toolCall: ReadResourceToolCall): Promise<ToolResult> => {
      const connectedUrls = Object.keys(mcpServers)
        .filter(k => mcpServers[k]?.config?.disabled !== true)
        .map(k => mcpServers[k]?.config?.url);

      const { serverUrl, uri } = toolCall.input ?? {};

      if (!serverUrl) throw new Error("Missing serverUrl.");
      if (!connectedUrls.includes(serverUrl)) {
        throw new Error("Invalid url. Connected servers: " + connectedUrls.join("\n"));
      }

      if (!uri) throw new Error("Missing uri.");
      if (!isValidAbsoluteUri(uri)) {
        throw new Error(
          `Invalid URI: ${uri}\n` +
            "Please provide an absolute URI with a scheme (e.g., 'https://', 'file:///', 'bot://').\n\n" +
            "Examples of valid URIs:\n" +
            "  - https://example.com/resource\n" +
            "  - file:///C:/folder/file.txt\n" +
            "  - bot://my-server/resource\n" +
            "  - ftp://myserver.com/file\n" +
            "  - custom-scheme://foo/bar\n\n" +
            "Relative paths like '/foo/bar' or 'folder/file.txt' are not accepted."
        );
      }

      const serverName = Object.keys(mcpServers).find(
        k => mcpServers[k]?.config?.url === serverUrl
      );

      if (!serverName) throw new Error("Server not found");

      const resource = await readResource(serverName, uri);

      return {
        isError: false,
        content: (resource?.contents ?? []).map((z: any) => ({
          type: "resource",
          resource: z,
        })),
      };
    },
    [mcpServers, readResource]
  );

  return { handleReadResourceToolCall };
}


export const resourceTool: Tool = {
    name: "read_resource",
    title: "Read an MCP resource",
    description:
        "Reads a resource by URI from a MCP server. Use this to read MCP resources. The serverUrl and the resource uri can be from completely different domains. If the resource has a markdown (text/markdown) mime type, do not include its full content in your response. The markdown files are visible in the in the Canvas tab.",
    inputSchema: {
        type: "object",
        properties: {
            serverUrl: {
                type: "string",
                description: "URL of the MCP server. Make sure this is always the url of a connected MCP server. NOT the uri of the resource."
            },
            uri: {
                type: "string",
                description: "URI of the resource to read. Make sure this is always the uri of the requested resource."
            },
        },
        required: ["uri", "serverUrl"],
    },
    annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
    }
};
