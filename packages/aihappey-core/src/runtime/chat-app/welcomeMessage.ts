import { mcpRuntime } from "aihappey-state";

export const fetchWelcomeMessage = async (language: string,
    currentUser?: string | null) => {
    const client = mcpRuntime.get("chatapp");

    if (!client) {
        throw new Error("ChatApp MCP is not connected");
    }

    const args = {
        language: language,
        currentUser: currentUser ?? null,
        currentDateTime: new Date().toLocaleString(navigator.language,
            { timeZoneName: "long" }),
    };

    const res: any = await client.callTool({
        name: "chat_app_generate_welcome_message",
        arguments: args,
    });

    return typeof res?.content?.[0]?.text === "string"
        ? res.content[0].text
        : undefined;
};