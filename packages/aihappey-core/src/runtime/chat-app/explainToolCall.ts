import { mcpRuntime } from "aihappey-state";

export const explainToolCall = async (toolcall: string, language: string) => {
    const client = mcpRuntime.get("chatapp");

    if (!client) {
        throw new Error("ChatApp MCP is not connected");
    }

    const res: any = await client.callTool({
        name: "chat_app_explain_tool_call",
        arguments: {
            toolcall,
            language,
        },
    });

    if (
        res &&
        Array.isArray(res.content) &&
        res.content.length > 0 &&
        typeof res.content[0]?.text === "string"
    ) {
        return res.content[0].text;
    }

    return undefined;
};