import { ActionDefinition, Catalog, ComponentDefinition, ValidationFunction } from "@json-render/core";

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
        const schema = def.props?.toJSONSchema?.();
        const props = schema?.properties ?? {};

        // Convert to loose "LLM signature"
        const propSigs = Object.entries(props).map(([key, value]: any) => {
            const type =
                value.type === "string" ? "string" :
                    value.type === "number" ? "number" :
                        value.type === "boolean" ? "boolean" :
                            value.enum ? value.enum.map((v: any) => JSON.stringify(v)).join("|") :
                                "any";

            const optional = schema?.required?.includes(key) ? "" : "?";
            return `${key}${optional}: ${type}`;
        });

        const sig = propSigs.length
            ? `{ ${propSigs.join(", ")} }`
            : `{}`;

        lines.push(`- ${String(name)}: ${sig}${def.description ? ` - ${def.description}` : ""}`);
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
            const schema = def.params?.toJSONSchema?.();
            const props = schema?.properties ?? {};

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

            lines.push(`- ${String(name)}: ${sig}${def.description ? ` - ${def.description}` : ""}`);
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


/**
 * Generate a prompt for AI that describes the catalog
 */
export function generateCatalogPrompt2<
    TComponents extends Record<string, ComponentDefinition>,
    TActions extends Record<string, ActionDefinition>,
    TFunctions extends Record<string, ValidationFunction>,
>(catalog: Catalog<TComponents, TActions, TFunctions>): string {
    const lines: string[] = [
        `# ${catalog.name} Component Catalog`,
        "",
        "## Output Format",
        "You must generate the UI by outputting a stream of JSON objects (JSONL), where each line is a patch operation to build the component tree.",
        "Do not output a single large JSON object. Output small patches as you think.",
        "",
        "### Patch Operations",
        "- `add`: Add an element to the tree or add a child to an array",
        "- `set`: Set a property value or replace an existing value",
        "",
        "### Example Patches",
        '{"op": "add", "path": "/elements/root", "value": {"key": "root", "type": "Card", "props": {}}}',
        '{"op": "set", "path": "/root", "value": "root"}',
        '{"op": "add", "path": "/elements/child1", "value": {"key": "child1", "type": "Button", "props": {"label": "Click Me"}}}',
        '{"op": "add", "path": "/elements/root/children", "value": "child1"}',
        "",
        "## Available Components",
        "",
    ];

    // Components
    for (const name of catalog.componentNames) {
        const def = catalog.components[name]!;
        console.log(def)
        console.log(def.props.toJSONSchema().properties)
        lines.push(`### ${String(name)}`);
        if (def.description) {
            lines.push(def.description);
        }
        const props = def.props.toJSONSchema().properties
        if (props) {
            lines.push("## props");
            lines.push(JSON.stringify(props));
        }
        lines.push("");
    }

    // Actions
    if (catalog.actionNames.length > 0) {
        lines.push("## Available Actions");
        lines.push("");
        for (const name of catalog.actionNames) {
            const def = catalog.actions[name]!;
            lines.push(
                `- \`${String(name)}\`${def.description ? `: ${def.description}` : ""}`,
            );
        }
        lines.push("");
    }

    // Visibility
    lines.push("## Visibility Conditions");
    lines.push("");
    lines.push("Components can have a `visible` property:");
    lines.push("- `true` / `false` - Always visible/hidden");
    lines.push('- `{ "path": "/data/path" }` - Visible when path is truthy');
    lines.push('- `{ "auth": "signedIn" }` - Visible when user is signed in');
    lines.push('- `{ "and": [...] }` - All conditions must be true');
    lines.push('- `{ "or": [...] }` - Any condition must be true');
    lines.push('- `{ "not": {...} }` - Negates a condition');
    lines.push('- `{ "eq": [a, b] }` - Equality check');
    lines.push("");

    // Validation
    lines.push("## Validation Functions");
    lines.push("");
    lines.push(
        "Built-in: `required`, `email`, `minLength`, `maxLength`, `pattern`, `min`, `max`, `url`",
    );
    if (catalog.functionNames.length > 0) {
        lines.push(`Custom: ${catalog.functionNames.map(String).join(", ")}`);
    }
    lines.push("");

    return lines.join("\n");
}

