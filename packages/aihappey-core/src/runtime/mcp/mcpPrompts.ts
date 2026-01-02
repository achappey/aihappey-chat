import { mcpRuntime } from "aihappey-state";

export const getPrompts = async (serverName: string) => {
    const client = mcpRuntime.get(serverName);

    if (!client) {
        throw new Error(`MCP ${serverName} is not connected`);
    }
    const res = await client.listPrompts();

    return [...res.prompts];
};

export const getPrompt = async (serverName: string, name: string, args: any) => {
    const client = mcpRuntime.get(serverName);

    if (!client) {
        throw new Error(`MCP ${serverName} is not connected`);
    }

    return await client.getPrompt({ name, arguments: args });
};

export const getCompletion = async (serverName: string, ref: {
    type: "ref/prompt";
    name: string;
} | {
    type: "ref/resource";
    uri: string;
}, args: {
    name: string;
    value: string;
}, context?: {
    arguments?: {
        [x: string]: string;
    } | undefined;
} | undefined) => {
    const client = mcpRuntime.get(serverName);

    if (!client) {
        throw new Error(`MCP ${serverName} is not connected`);
    }

    if (!client?.getServerCapabilities()?.completions) {
        throw new Error("MCP does not support completion");
    }

    return await client.complete({
        ref: ref,
        argument: args,
        context: context,
    });
};