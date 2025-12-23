import { mcpRuntime } from "aihappey-state";

export const chatAppInstructions = () => {
    const client = mcpRuntime.get("chatapp");

    if (!client) {
        throw new Error("ChatApp MCP is not connected");
    }

    return client.getInstructions();
};