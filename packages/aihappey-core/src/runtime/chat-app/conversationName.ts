import { mcpRuntime } from "aihappey-state";

export const conversationName = async (message: string) => {
    const client = mcpRuntime.get("chatapp");

    if (!client) {
        throw new Error("ChatApp MCP is not connected");
    }

    const args = {
        userMessage: message,
    };

    const res: any = await client.callTool({
        name: "chat_app_generate_conversation_name",
        arguments: args,
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