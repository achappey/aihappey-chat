import { mcpRuntime } from "aihappey-state";

export const readResource = async (serverName: string, uri: string) => {
    const client = mcpRuntime.get(serverName);

    if (!client) {
        throw new Error("ChatApp MCP is not connected");
    }

    return await client.readResource({
        uri
    });
};