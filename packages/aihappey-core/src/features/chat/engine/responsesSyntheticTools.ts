/** Standard Responses envelope for tools already executed by the gateway. */
export const GATEWAY_MCP_SERVER_LABEL = "aihappey";
export const GATEWAY_MCP_METADATA_KEY = "aihappey/gateway";

export const isGatewayResponsesTool = (item: any) =>
  item?.type === "mcp_call" && item?.server_label === GATEWAY_MCP_SERVER_LABEL;

export const gatewayResponsesResult = (item: any): any => {
  if (typeof item?.output !== "string") throw new Error("Gateway MCP output must be a JSON CallToolResult string.");
  const result = JSON.parse(item.output);
  if (!result || typeof result !== "object" || !Array.isArray(result.content))
    throw new Error("Gateway MCP output must preserve the complete CallToolResult envelope.");
  return result;
};

export const gatewayResponsesMetadata = (item: any, providerKey: string) => {
  const result = typeof item?.output === "string" ? gatewayResponsesResult(item) : undefined;
  const transport = result?._meta?.[GATEWAY_MCP_METADATA_KEY];
  const original = transport?.provider === providerKey ? transport?.providerMetadata?.[providerKey] : undefined;
  return { [providerKey]: {
    ...(original ?? {}), type: "mcp_call", id: item.id, item_id: item.id,
    name: item.name, tool_name: item.name, status: item.status,
    title: transport?.title ?? item.name,
    server_label: GATEWAY_MCP_SERVER_LABEL, gateway_synthetic: true,
  } };
};

const artifactTools = new Set(["download_file", "upload_files", "upload_generated_image", "generate_speech"]);

/** State results travel back to the gateway, never as executable client functions. */
export const gatewayResponsesReplay = (part: any, providerKey?: string): any[] | undefined => {
  const metadata = part?.callProviderMetadata?.[providerKey ?? ""] ?? part?.providerMetadata?.[providerKey ?? ""];
  if (!metadata?.gateway_synthetic || metadata.server_label !== GATEWAY_MCP_SERVER_LABEL) return undefined;
  const name = metadata.name ?? metadata.tool_name ?? part.toolName ?? part.type?.replace(/^tool-/, "");
  const result = part.output;
  if (!providerKey || artifactTools.has(name) || part.state !== "output-available"
    || !Array.isArray(result?.content) || result?._meta?.[GATEWAY_MCP_METADATA_KEY]?.provider !== providerKey) return [];
  return [{ type: "mcp_call", id: metadata.id ?? part.toolCallId, name,
    server_label: GATEWAY_MCP_SERVER_LABEL, status: result.isError === true ? "failed" : "completed",
    arguments: JSON.stringify(part.input ?? {}), output: JSON.stringify(result) }];
};
