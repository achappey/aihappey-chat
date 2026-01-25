import { useCallback } from "react";
import type { Tool } from "@modelcontextprotocol/sdk/types";
import {
    createBackendProvider,
    generateText,
    jsonSchema,
    Output,
} from "aihappey-ai";
import { useAppStore } from "aihappey-state";
import { useStructuredOutputs } from "aihappey-structured-outputs";

/* ============================================================
   Result helpers
============================================================ */

type ToolTextResult = {
    isError: boolean;
    content: { type: "text"; text: string }[];
};

const ok = (text: string): ToolTextResult => ({
    isError: false,
    content: [{ type: "text", text }],
});

const fail = (err: unknown): ToolTextResult => ({
    isError: true,
    content: [{ type: "text", text: JSON.stringify(err) }],
});

/* ============================================================
   Tool definitions (STATIC)
============================================================ */

export const localStructuredOutputsListTool: Tool = {
    name: "local_structured_outputs_list",
    title: "List structured output schemas",
    description: "List stored structured output schemas.",
    inputSchema: { type: "object", properties: {}, required: [] },
    annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
    },
};

export const localStructuredOutputsCreateTool: Tool = {
    name: "local_structured_outputs_create",
    title: "Create structured output schema",
    description: "Create and validate a structured output schema.",
    inputSchema: {
        type: "object",
        properties: {
            name: { type: "string", description: "Name of the schema" },
            schema: {
                type: "string",
                description: "JSON Schema string for structured output",
            },
        },
        required: ["name", "schema"],
    },
    annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
    },
};

export const localStructuredOutputsUpdateTool: Tool = {
    name: "local_structured_outputs_update",
    title: "Update structured output schema",
    description: "Update and validate an existing structured output schema.",
    inputSchema: {
        type: "object",
        properties: {
            id: { type: "string", description: "Schema id" },
            name: { type: "string", description: "Name of the schema" },
            schema: {
                type: "string",
                description: "JSON Schema string for structured output",
            },
        },
        required: ["id", "name", "schema"],
    },
    annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
    },
};

export const localStructuredOutputsDeleteTool: Tool = {
    name: "local_structured_outputs_delete",
    title: "Delete structured output schema",
    description: "Delete a structured output schema by id.",
    inputSchema: {
        type: "object",
        properties: {
            id: { type: "string", description: "Schema id" },
        },
        required: ["id"],
    },
    annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
    },
};


export const localStructuredOutputsExecuteTool: Tool = {
    name: "local_structured_outputs_execute",
    title: "Execute prompt with structured output schema",
    description: "Execute a prompt using a stored structured output schema and return validated structured output.",
    inputSchema: {
        type: "object",
        properties: {
            schemaId: {
                type: "string",
                description: "ID of the stored structured output schema",
            },
            prompt: {
                type: "string",
                description: "Prompt to execute with the schema",
            },
            model: {
                type: "string",
                description: "Optional model override (e.g. openai/gpt-5-mini)",
            },
        },
        required: ["schemaId", "prompt"],
    },
    annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
    },
};



/* ============================================================
   Plugin DEFINITION (STATIC)
============================================================ */

export const localStructuredOutputsPluginDef = {
    name: "local-structured-outputs",
    match: (toolName: string) => toolName.startsWith("local_structured_outputs_"),
    tools: [
        localStructuredOutputsListTool,
        localStructuredOutputsCreateTool,
        localStructuredOutputsUpdateTool,
        localStructuredOutputsDeleteTool,
        localStructuredOutputsExecuteTool, // 👈 NEW
    ],
};

type LocalStructuredOutputsToolName =
    | "local_structured_outputs_list"
    | "local_structured_outputs_create"
    | "local_structured_outputs_update"
    | "local_structured_outputs_delete"
    | "local_structured_outputs_execute"; // 👈 NEW;

type LocalStructuredOutputsToolCall = {
    toolName: LocalStructuredOutputsToolName;
    input?: any;
};

/* ============================================================
   Runtime helpers
============================================================ */

function parseSchemaString(schema: unknown) {
    if (typeof schema !== "string" || !schema.trim()) {
        throw new Error("Missing schema.");
    }
    try {
        return JSON.parse(schema);
    } catch {
        throw new Error("schema must be valid JSON.");
    }
}

async function validateSchema(
    api: string,
    headers: Record<string, string>,
    getAccessToken: any,
    schemaString: string
) {
    if (!api) throw new Error("api is required.");
    const provider = createBackendProvider(
        new URL(api).hostname,
        api,
        headers,
        getAccessToken
    );
    const model = provider("openai/gpt-5-mini");
    const parsed = parseSchemaString(schemaString);
    const schema = jsonSchema(parsed);

    const response = await generateText({
        model,
        output: Output.object({ schema }),
        prompt: "Generate a sample output that fits this schema.",
        tools: {},
    });

    console.log(response.response.body)
}

/* ============================================================
   Plugin RUNTIME (execution only)
============================================================ */

export function useLocalStructuredOutputsRuntime(api: string, getAccessToken?: any, headers?: any) {
    const customHeaders = useAppStore(a => a.customHeaders);
    const store = useStructuredOutputs();

    const handle = useCallback(
        async (toolCall: LocalStructuredOutputsToolCall): Promise<ToolTextResult> => {
            try {
                switch (toolCall.toolName) {
                    case "local_structured_outputs_execute": {
                        const input = toolCall.input ?? {};
                        const schemaId = input.schemaId;
                        const prompt = input.prompt;
                        const modelId = input.model ?? "openai/gpt-5-mini";

                        if (!schemaId) throw new Error("Missing schemaId.");
                        if (!prompt) throw new Error("Missing prompt.");

                        const item = store.items.find(i => i.id === schemaId);
                        if (!item) throw new Error(`Schema not found: ${schemaId}`);

                        const provider = createBackendProvider(
                            new URL(api).hostname,
                            api,
                            { ...(headers ?? {}), ...(customHeaders ?? {}) },
                            getAccessToken
                        );

                        const model = provider(modelId);

                        const parsed = parseSchemaString(item.json_schema);
                        const schema = jsonSchema(parsed);

                        const response = await generateText({
                            model,
                            prompt,
                            output: Output.object({ schema }),
                            tools: {},
                        });

                        return ok(JSON.stringify(response.output ?? response));
                    }


                    case "local_structured_outputs_list": {
                        const items = store.items.map(item => ({
                            id: item.id,
                            name: item.name,
                            schema: item.json_schema,
                        }));
                        return ok(JSON.stringify(items));
                    }

                    case "local_structured_outputs_create": {
                        const input = toolCall.input ?? {};
                        const name = input.name;
                        const schema = input.schema;
                        if (!name) throw new Error("Missing name.");
                        if (!schema) throw new Error("Missing schema.");

                        await validateSchema(
                            api,
                            { ...(headers ?? {}), ...(customHeaders ?? {}) },
                            getAccessToken,
                            schema
                        );

                        const created = await store.add(name, schema);
                        return ok(JSON.stringify(created));
                    }

                    case "local_structured_outputs_update": {
                        const input = toolCall.input ?? {};
                        const id = input.id;
                        const name = input.name;
                        const schema = input.schema;
                        if (!id) throw new Error("Missing id.");
                        if (!name) throw new Error("Missing name.");
                        if (!schema) throw new Error("Missing schema.");

                        await validateSchema(
                            api,
                            { ...(headers ?? {}), ...(customHeaders ?? {}) },
                            getAccessToken,
                            schema
                        );

                        const updated = await store.update(id, name, schema);
                        return ok(JSON.stringify(updated));
                    }

                    case "local_structured_outputs_delete": {
                        const { id } = toolCall.input ?? {};
                        if (!id) throw new Error("Missing id.");
                        await store.delete(id);
                        return ok("Schema deleted");
                    }

                    default:
                        throw new Error(`Unsupported tool: ${toolCall.toolName}`);
                }
            } catch (e) {
                return fail(e);
            }
        },
        [api, customHeaders, getAccessToken, headers, store]
    );

    return {
        name: localStructuredOutputsPluginDef.name,
        handle,
    };
}
