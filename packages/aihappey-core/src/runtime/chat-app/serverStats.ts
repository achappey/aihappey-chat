import { mcpRuntime } from "aihappey-state";

export const serverStats = async () => {
    const client = mcpRuntime.get("chatapp");

    if (!client) {
        throw new Error("ChatApp MCP is not connected");
    }

    const res = await client.callTool({
        name: "chat_app_get_mcp_server_stats",
        arguments: {},
    });

    if (
        res &&
        Array.isArray(res.content) &&
        res.content.length > 0 &&
        typeof res.content[0]?.resource?.text === "string"
    ) {
        return res.content[0].resource?.text;
    }

    return undefined;
};