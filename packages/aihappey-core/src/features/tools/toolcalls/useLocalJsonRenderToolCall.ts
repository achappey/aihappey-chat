import { useCallback } from "react";
import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types";
import type { UIMessage } from "aihappey-types";

/* ============================================================
   Result helpers
============================================================ */

type ToolTextResult = {
    isError: boolean;
    content: { type: "text"; text: string }[];
};

const ok = (tree: any, uri: string, toolcallId: any): CallToolResult => ({
    isError: false,
    _meta: {
        toolCallId: toolcallId
    },
    content: [{
        type: "resource", resource: {
            text: JSON.stringify(tree),
            mimeType: "application/vnd.vercel-app+json",
            uri: uri
        }
    }],
});

const fail = (err: unknown): ToolTextResult => ({
    isError: true,
    content: [{ type: "text", text: err instanceof Error ? err.message : String(err) }],
});

/* ============================================================
   Tool definition (STATIC)
============================================================ */

export const localJsonRenderTool: Tool = {
    name: "local_json_render",
    title: "Render UI from tool output",
    description: "Render a streaming UI using the output of a previously executed tool call. The chat app handles the rendering, the component tree is only returned for reference.",
    inputSchema: {
        type: "object",
        properties: {
            prompt: {
                type: "string",
                description: "Detailed prompt describing the UI to render",
            },
            toolcallname: {
                type: "string",
                description: "Name of the executed tool call to use as data",
            },
        },
        required: ["prompt", "toolcallname"],
    },
    annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
    },
};

export const localJsonRenderPluginDef = {
    name: "local-json-render",
    match: (toolName: string) => toolName === "local_json_render",
    tools: [localJsonRenderTool],
};

type LocalJsonRenderToolCall = {
    toolName: "local_json_render";
    input?: { prompt?: string; toolcallname?: string };
};

type ToolInvocationPart = {
    type?: string;
    toolCallId?: string;
    toolName?: string;
    output?: any;
    state?: string;
};

function findLatestToolOutput(messages: UIMessage[] | undefined, toolName: string) {
    if (!messages?.length) return null;

    toolName = toolName.replace("functions.", "");
    for (let i = messages.length - 1; i >= 0; i -= 1) {
        const msg = messages[i];
        const parts = (msg as any)?.parts as ToolInvocationPart[] | undefined;
        if (!Array.isArray(parts)) continue;
        for (let j = parts.length - 1; j >= 0; j -= 1) {
            const part = parts[j];
            if (!part?.type?.startsWith("tool-")) continue;
            const name = part.toolName ?? part.type?.replace(/^tool-/, "");
            if (name === toolName) {
                return part;
            }
        }
    }
    return null;
}

export function useLocalJsonRenderRuntime(opts: {
    messages?: UIMessage[];
    conversationId?: string | null;
    setActiveData: any
    send: any
}) {
    const { messages, conversationId, setActiveData, send } = opts;

    const handle = useCallback(
        async (toolCall: LocalJsonRenderToolCall): Promise<any> => {
            try {
                const input = toolCall.input ?? {};
                const prompt = input.prompt?.trim();
                const toolcallname = input.toolcallname?.trim();
                if (!prompt) throw new Error("Missing prompt.");
                if (!toolcallname) throw new Error("Missing toolcallname.");
                if (!conversationId) throw new Error("Missing conversation id.");

                const part = findLatestToolOutput(messages, toolcallname);
                if (!part) {
                    throw new Error(`No tool output found for toolcallname: ${toolcallname}`);
                }
                const output = part.output?.structuredContent ?? part.output ?? null;
                setActiveData(output)
                const tree = await send(prompt)

                return ok(tree, "toolcall://" + toolcallname, part.toolCallId);
            } catch (e) {
                return fail(e);
            }
        },
        [conversationId, messages, send]
    );

    return { name: localJsonRenderPluginDef.name, handle };
}
