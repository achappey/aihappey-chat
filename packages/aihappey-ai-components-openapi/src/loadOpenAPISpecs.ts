import { operationToSpec } from "./openapi-to-spec";

interface OpenAPIDocument {
    paths?: Record<
        string,
        Record<
            string,
            {
                operationId?: string;
                summary?: string;
                description?: string;
                requestBody?: {
                    content?: {
                        "application/json"?: {
                            schema?: any;
                        };
                    };
                };
            }
        >
    >;
    components?: {
        schemas?: Record<string, any>;
    };
}

/**
 * Resolve a local OpenAPI $ref like:
 *   #/components/schemas/User
 */
function resolveRef(ref: string, root: any): any {
    if (!ref.startsWith("#/")) return undefined;

    return ref
        .substring(2)
        .split("/")
        .reduce((obj, key) => (obj ? obj[key] : undefined), root);
}

/**
 * Recursively replaces $ref with actual schema content.
 * Supports internal refs only (browser-safe).
 */
function dereferenceSchema(schema: any, root: any): any {
    if (!schema || typeof schema !== "object") return schema;

    // resolve $ref
    if (typeof schema.$ref === "string") {
        const resolved = resolveRef(schema.$ref, root);
        if (!resolved) return schema;
        return dereferenceSchema(resolved, root);
    }

    // arrays
    if (Array.isArray(schema)) {
        return schema.map((item) => dereferenceSchema(item, root));
    }

    // objects
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(schema)) {
        result[key] = dereferenceSchema(value, root);
    }

    return result;
}

/**
 * Loads OpenAPI spec in browser and extracts operation specs.
 */
export async function loadOpenAPISpecs(specUrl: string) {
    const api = (await fetch(specUrl).then((r) =>
        r.json()
    )) as OpenAPIDocument;

    const specs: Record<string, any> = {};

    for (const [path, methods] of Object.entries(api.paths ?? {})) {
        for (const [method, operation] of Object.entries(methods)) {
            const schema =
                operation.requestBody?.content?.["application/json"]?.schema;

            if (!schema) continue;

            const resolvedSchema = dereferenceSchema(schema, api);

            const operationId =
                operation.operationId ||
                `${method}_${path.replace(/\//g, "_")}`;

            specs[operationId] = operationToSpec(
                operationId,
                method,
                path,
                resolvedSchema,
                operation.summary,
                operation.description
            );
        }
    }

    return specs;
}

/*
Usage:

const specs = await loadOpenAPISpecs(
    "https://api.example.com/openapi.json"
);

specs.createUser
specs.updateUser
*/
