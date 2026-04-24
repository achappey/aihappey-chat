import { mcpRuntime } from "aihappey-state";

export const readResource = async (serverName: string, uri: string,
    cursor: string | undefined = undefined,
    limit: number | undefined = 100) => {
    const client = mcpRuntime.get(serverName);

    if (!client) {
        throw new Error(`MCP ${serverName} is not connected`);
    }

    return await client.readResource({
        uri,
        _meta: {
            cursor: cursor,
            limit: limit
        }
    });
};