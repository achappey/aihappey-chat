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

export const listConversationToolcallsTool: Tool = {
    name: "list_json_render_toolcalls",
    title: "List available tool calls",
    description: "Returns tool calls available for json render in the current conversation.",
    inputSchema: {
        type: "object",
        properties: {},
    },
    annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
    },
};


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
            toolCallId: {
                type: "string",
                description: "Id of the executed tool call to use as data",
            },
        },
        required: ["prompt", "toolCallId"],
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
    match: (toolName: string) => toolName === "local_json_render" || toolName == "list_json_render_toolcalls",
    tools: [localJsonRenderTool, listConversationToolcallsTool],
};


type LocalJsonRenderToolCall = {
    toolName: "local_json_render" | "list_json_render_toolcalls";
    // input?: { prompt?: string; toolcallname?: string };
    input?: any;
};

type ToolInvocationPart = {
    type?: string;
    toolCallId?: string;
    toolName?: string;
    input?: any;
    output?: any;
    state?: string;
};

const JSON_RENDER_MIME = "application/vnd.vercel-app+json";

function parseJsonRenderTree(output: any) {
    const content = output?.content;
    if (!Array.isArray(content)) return null;
    const resource = content.find(
        (entry: any) => entry?.type === "resource" && entry?.resource?.mimeType === JSON_RENDER_MIME
    );
    const raw = resource?.resource?.text;
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function findLatestToolOutput(messages: UIMessage[] | undefined, toolCallId: string) {
    if (!messages?.length) return null;

   // toolName = toolName.replace("functions.", "");
    for (let i = messages.length - 1; i >= 0; i -= 1) {
        const msg = messages[i];
        const parts = (msg as any)?.parts as ToolInvocationPart[] | undefined;
        if (!Array.isArray(parts)) continue;
        for (let j = parts.length - 1; j >= 0; j -= 1) {
            const part = parts[j];
            if (!part?.type?.startsWith("tool-")) continue;
          //  const name = part.toolName ?? part.type?.replace(/^tool-/, "");
            if (part.toolCallId === toolCallId) {
                return part;
            }
        }
    }
    return null;
}

export function findLatestLocalJsonRenderTree(messages: UIMessage[] | undefined, toolCallId: string) {
    if (!messages?.length) return null;
    if (!toolCallId) return null;
    const matchId = toolCallId.trim();
    if (!matchId) return null;

    for (let i = messages.length - 1; i >= 0; i -= 1) {
        const msg = messages[i];
        const parts = (msg as any)?.parts as ToolInvocationPart[] | undefined;
        if (!Array.isArray(parts)) continue;
        for (let j = parts.length - 1; j >= 0; j -= 1) {
            const part = parts[j];
            if (!part?.type?.startsWith("tool-")) continue;
            const name = part.toolName ?? part.type?.replace(/^tool-/, "");
            if (name !== "local_json_render") continue;
            const inputId = String(part?.input?.toolCallId ?? "").trim();
            if (!inputId || inputId !== matchId) continue;
            const tree = parseJsonRenderTree(part?.output);
            if (tree) return tree;
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
            switch (toolCall.toolName) {
                case "local_json_render": {
                    const input = toolCall.input ?? {};
                    const prompt = input.prompt?.trim();
                    const toolCallId = input.toolCallId?.trim();
                    if (!prompt) throw new Error("Missing prompt.");
                    if (!toolCallId) throw new Error("Missing toolCallId.");
                    if (!conversationId) throw new Error("Missing conversation id.");

                    const part = findLatestToolOutput(messages, toolCallId);
                    if (!part) {
                        throw new Error(`No tool output found for toolCallId: ${toolCallId}`);
                    }
                    const output = part.output;
                    setActiveData(output)
                    const tree = await send(prompt, toolCallId)

                    return ok(tree, "toolcall://" + toolCallId, part.toolCallId);


                }

                case "list_json_render_toolcalls": {
                    if (!messages?.length) {
                        return ok([], "toolcall://list", undefined);
                    }

                    const seen = new Map<string, string | undefined>();

                    for (const msg of messages) {
                        const parts = (msg as any)?.parts as ToolInvocationPart[] | undefined;
                        if (!Array.isArray(parts)) continue;

                        for (const part of parts) {
                            if (!part?.type?.startsWith("tool-")) continue;
                            const name = part.toolName ?? part.type.replace(/^tool-/, "");
                            if (!seen.has(name)) {
                                seen.set(name, part.toolCallId);
                            }
                        }
                    }

                    return ok(
                        Array.from(seen.entries()).map(([name, id]) => ({ name, id })),
                        "toolcall://conversation",
                        undefined
                    );
                }
                default:
                    break;
            }



        },
        [conversationId, messages, send]
    );

    return { name: localJsonRenderPluginDef.name, handle };
}
