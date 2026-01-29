import { ActionDefinition, Catalog, ComponentDefinition, ValidationFunction } from "@json-render/core";

function renderSchemaType(schema: any): string {
    if (!schema) return "any";

    if (schema.enum) {
        return schema.enum.map((v: any) => JSON.stringify(v)).join(" | ");
    }

    if (schema.type === "array") {
        return `${renderSchemaType(schema.items)}[]`;
    }

    if (schema.type === "object") {
        const props = schema.properties ?? {};
        const required = schema.required ?? [];
        const inner = Object.entries(props).map(([k, v]: any) => {
            const opt = required.includes(k) ? "" : "?";
            return `${k}${opt}: ${renderSchemaType(v)}`;
        });
        return `{ ${inner.join("; ")} }`;
    }

    if (Array.isArray(schema.type)) {
        return schema.type.join(" | ");
    }

    return schema.type ?? "any";
}



export function generateCatalogPrompt<
    TComponents extends Record<string, ComponentDefinition>,
    TActions extends Record<string, ActionDefinition>,
    TFunctions extends Record<string, ValidationFunction>,
>(catalog: Catalog<TComponents, TActions, TFunctions>): string {
    const lines: string[] = [];

    lines.push(`You are a UI generator that outputs JSONL (JSON Lines) patches.`);
    lines.push("");
    lines.push(`AVAILABLE COMPONENTS (${catalog.componentNames.length}):`);
    lines.push("");

    // =========================
    // Components
    // =========================
    for (const name of catalog.componentNames) {
        const def = catalog.components[name]!;

        // Pull JSON Schema from Zod
        // NOTE: If a generated Zod schema is malformed (eg: has `undefined` in its shape),
        // Zod's `toJSONSchema()` can throw with errors like "Cannot read properties of undefined (reading '_zod')".
        // We log the component/action name here to pinpoint the broken entry.
        let schema: any;
        let props: Record<string, any> = {};
        let schemaError: string | undefined;
        try {
            schema = def.props?.toJSONSchema?.();
            props = schema?.properties ?? {};
        } catch (e) {
            schemaError = e instanceof Error ? e.message : String(e);
            // eslint-disable-next-line no-console
            console.error("[generateCatalogPrompt] Component toJSONSchema failed", {
                componentName: String(name),
                description: def.description,
                error: schemaError,
            });
        }

        // Convert to loose "LLM signature"
        const propSigs = Object.entries(props).map(([key, value]: any) => {
            /*     const type =
                     value.type === "string" ? "string" :
                         value.type === "number" ? "number" :
                             value.type === "boolean" ? "boolean" :
                                 value.enum ? value.enum.map((v: any) => JSON.stringify(v)).join("|") :
                                     "any";*/
            const type = renderSchemaType(value);

            const optional = schema?.required?.includes(key) ? "" : "?";
            return `${key}${optional}: ${type}`;
        });

        const sig = propSigs.length
            ? `{ ${propSigs.join(", ")} }`
            : `{}`;

        const desc = def.description ? ` - ${def.description}` : "";
        const errNote = schemaError ? ` - SCHEMA ERROR: ${schemaError}` : "";
        lines.push(`- ${String(name)}: ${sig}${desc}${errNote}`);
    }

    // =========================
    // Actions
    // =========================
    if (catalog.actionNames.length > 0) {
        lines.push("");
        lines.push("ACTIONS:");
        lines.push("");

        for (const name of catalog.actionNames) {
            const def = catalog.actions[name]!;
            let schema: any;
            let props: Record<string, any> = {};
            let schemaError: string | undefined;
            try {
                schema = def.params?.toJSONSchema?.();
                props = schema?.properties ?? {};
            } catch (e) {
                schemaError = e instanceof Error ? e.message : String(e);
                // eslint-disable-next-line no-console
                console.error("[generateCatalogPrompt] Action toJSONSchema failed", {
                    actionName: String(name),
                    description: def.description,
                    error: schemaError,
                });
            }

            const paramSigs = Object.entries(props).map(([key, value]: any) => {
                const type =
                    value.type === "string" ? "string" :
                        value.type === "number" ? "number" :
                            value.type === "boolean" ? "boolean" :
                                value.enum ? value.enum.map((v: any) => JSON.stringify(v)).join("|") :
                                    "any";

                const optional = schema?.required?.includes(key) ? "" : "?";
                return `${key}${optional}: ${type}`;
            });

            const sig = paramSigs.length
                ? `{ ${paramSigs.join(", ")} }`
                : `{}`;

            const desc = def.description ? ` - ${def.description}` : "";
            const errNote = schemaError ? ` - SCHEMA ERROR: ${schemaError}` : "";
            lines.push(`- ${String(name)}: ${sig}${desc}${errNote}`);
        }
    }

    // =========================
    // Output format rules
    // =========================
    lines.push("");
    lines.push("OUTPUT FORMAT (JSONL):");
    lines.push(`{"op":"set","path":"/root","value":"element-key"}`);
    lines.push(
        `{"op":"add","path":"/elements/key","value":{"key":"...","type":"...","props":{...},"children":[...]}}`,
    );
    lines.push("");
    /*
      lines.push("ALL COMPONENTS support:");
      lines.push("- className?: string[]  // Tailwind classes for custom styling");
      lines.push("");*/

    lines.push("RULES:");
    lines.push("1. First line sets /root to root element key");
    lines.push("2. Add elements with /elements/{key}");
    lines.push("3. Children array contains string keys, not objects");
    lines.push("4. Parent first, then children");
    lines.push("5. Each element needs: key, type, props");
    lines.push("6. Use valuePath from the root object and prefer structuredContent if available, fallback to contents array if needed, for example: '/structuredContent/xxx', '/structuredContent/xxx/zzz' '/content/0/text', etc ");
    //lines.push("6. Use className for Tailwind styling when needed");
    lines.push("");

    /*lines.push("FORBIDDEN CLASSES (NEVER USE):");
    lines.push("- min-h-screen, h-screen, min-h-full, h-full, min-h-dvh, h-dvh");
    lines.push("- bg-gray-50, bg-slate-50, bg-white, bg-black");
    lines.push("");
  
    lines.push("MOBILE-FIRST RESPONSIVE:");
    lines.push("- Always design mobile-first");
    lines.push("- Grids: start with columns:1, expand using className");
    lines.push("- DO NOT put page headers inside Card");
    lines.push("- Horizontal stacks that overflow: use className:[\"flex-wrap\"]");
    lines.push("- Forms: Card should be the root element");
    lines.push("");*/

    // =========================
    // Generic Example (not tied to real components)
    // =========================
    lines.push("EXAMPLE:");
    lines.push(`{"op":"set","path":"/root","value":"pageRoot"}`);
    lines.push(
        `{"op":"add","path":"/elements/pageRoot","value":{"key":"pageRoot","type":"Container","props":{"layout":"vertical","gap":"lg"},"children":["headerBlock","contentBlock"]}}`,
    );
    lines.push(
        `{"op":"add","path":"/elements/headerBlock","value":{"key":"headerBlock","type":"TitleBlock","props":{"text":"Demo Title","size":"xl"},"children":[]}}`,
    );
    lines.push(
        `{"op":"add","path":"/elements/contentBlock","value":{"key":"contentBlock","type":"ContentBox","props":{"padding":"md"},"children":["action1"]}}`,
    );
    lines.push(
        `{"op":"add","path":"/elements/action1","value":{"key":"action1","type":"ActionButton","props":{"label":"Do Something","variant":"primary"}}}`,
    );
    lines.push("");

    lines.push("Generate JSONL:");

    return lines.join("\n");
}