import { useCallback } from "react";
import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types";
import type { UIMessage } from "aihappey-types";

/* ============================================================
   Result helpers
============================================================ */
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

/* ============================================================
   Tool definition
============================================================ */
export const localJsonRenderTool: Tool = {
    name: "local_json_render",
    title: "Render streaming UI app",
    description: "Render or update a streaming UI app directly from a prompt. The chat app handles rendering; the component tree is returned for reference.",
    inputSchema: {
        type: "object",
        properties: {
            prompt: {
                type: "string",
                description: "Detailed prompt describing the UI to render",
            },
            catalogIds: {
                type: "array",
                description: "Optional list of catalog ids to use for this render request",
                items: { type: "string" },
            },
           /* registryIds: {
                type: "array",
                description: "Optional list of registry ids to use for this render request",
                items: { type: "string" },
            },*/
        },
        required: ["prompt"],
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
    toolCallId?: string;
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

function sanitizeStringList(input: unknown): string[] | undefined {
    if (!Array.isArray(input)) return undefined;
    const cleaned = input
        .map((value) => String(value ?? "").trim())
        .filter(Boolean);
    if (!cleaned.length) return undefined;
    return Array.from(new Set(cleaned));
}

export function findLatestLocalJsonRenderTree(messages: UIMessage[] | undefined) {
    if (!messages?.length) return null;

    for (let i = messages.length - 1; i >= 0; i -= 1) {
        const msg = messages[i];
        const parts = (msg as any)?.parts as ToolInvocationPart[] | undefined;
        if (!Array.isArray(parts)) continue;
        for (let j = parts.length - 1; j >= 0; j -= 1) {
            const part = parts[j];
            if (!part?.type?.startsWith("tool-")) continue;
            const name = part.toolName ?? part.type?.replace(/^tool-/, "");
            if (name !== "local_json_render") continue;
            const tree = parseJsonRenderTree(part?.output);
            if (tree) return tree;
        }
    }
    return null;
}

export function useLocalJsonRenderRuntime(opts: {
    setActiveData: any;
    send: (request: {
        prompt: string;
        catalogIds?: string[];
        registryIds?: string[];
    }) => Promise<any>;
}) {
    const { setActiveData, send } = opts;

    const handle = useCallback(
        async (toolCall: LocalJsonRenderToolCall): Promise<any> => {
            switch (toolCall.toolName) {
                case "local_json_render": {
                    const input = toolCall.input ?? {};
                    const prompt = String(input.prompt ?? "").trim();
                    const catalogIds = sanitizeStringList(input.catalogIds);
                   // const registryIds = sanitizeStringList(input.registryIds);
                    if (!prompt) throw new Error("Missing prompt.");
                    setActiveData(undefined);
                    const tree = await send({
                        prompt,
                        catalogIds,
                        //registryIds,
                    });

                    return ok(tree, `toolcall://local_json_render/${toolCall.toolCallId ?? "latest"}`, toolCall.toolCallId);
                }
                default:
                    break;
            }
        },
        [send, setActiveData]
    );

    return { name: localJsonRenderPluginDef.name, handle };
}
