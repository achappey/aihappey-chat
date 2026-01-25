import { useEffect } from "react";
import { ActionDefinition, Catalog, ComponentDefinition, createCatalog, UIElement, ValidationFunction, VisibilityCondition } from '@json-render/core';
import { z } from 'zod';
import { useUIStream } from "../json-render/useUIStream";
import { useChatContext } from "../chat/context/ChatContext";
import { ActionProvider, DataProvider, useDataValue, VisibilityProvider } from "@json-render/react";
import { ErrorBoundary } from "react-error-boundary";
import { Renderer } from "../json-render/Renderer";

const catalog = createCatalog({
    components: {
        Card: {
            props: z.object({
                title: z.string(),
                description: z.string().nullable(),
                padding: z.enum(['sm', 'md', 'lg']).default('md'),
            }),
            description: "UI container that holds other UI primitives. Never embed other cards into cards. Give every card a title and description.",
            hasChildren: true, // Can contain other components
        },
        Button: {
            description: "Always give a button a label.",
            props: z.object({
                label: z.string(),
                //valuePath: z.string(), // JSON Pointer to data
                //format: z.enum(['currency', 'percent', 'number']),
            }),
        },

        Metric: {
            props: z.object({
                label: z.string(),
                valuePath: z.string(), // JSON Pointer to data
                format: z.enum(['currency', 'percent', 'number']),
            }),
        },
    },

    actions: {
        submit_form: {
            params: z.object({
                formId: z.string(),
            }),
            description: 'Submit a form',
        },

        export_data: {
            params: z.object({
                format: z.enum(['csv', 'pdf', 'json']),
            }),
        },
    },

});

interface ComponentProps {
    element: {
        key: string;
        type: string;
        props: Record<string, unknown>;
        children?: UIElement[];
        visible?: VisibilityCondition;
        //validation?: ValidationSchema;
    };
    children?: React.ReactNode;  // Rendered children
    onAction: (name: string, params: object) => void;
}

const Metric = ({ element }: any) => {
    // Read-only value
    const value: any = useDataValue(element.props.valuePath);

    return (
        <div className="metric">
            <span className="label">{element.props.label}</span>
            <span>{value}</span>
        </div>
    );
};

const registry: any = {
    Metric: Metric,
    Container: ({ element, children }: ComponentProps) => (
        <div>
            {children}
        </div>
    ),
    Card: ({ element, children }: ComponentProps) => (
        <div className="card">
            <h2>{element.props.title as any}</h2>
            {element.props.description as any && (
                <p>{element.props.description as any}</p>
            )}
            {children}
        </div>
    ),

    Button: ({ element, onAction }: ComponentProps) => (
        <button onClick={() => onAction(element.props.action as any, {})}>
            {element.props.label as any}
        </button>
    ),
};



/**
 * Generate a prompt for AI that describes the catalog
 */
export function generateCatalogPrompt<
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


/////



function downloadFile(file: File, downloadName?: string) {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadName ?? file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export const JsonRenderPage = () => {
    const { config } = useChatContext()
    //const getAccessToken = useAccessToken([])
    //const [, , , refreshToken] = useAccessToken(config.agentScopes ?? []);
    const getAccessToken = config?.getAccessToken;
    console.log(catalog)
    const systemPrompt = generateCatalogPrompt(catalog);
    console.log(systemPrompt)
    const { tree, send } = useUIStream({
        api: config.baseUrl + "/api/generate",
        catalogPrompt: systemPrompt, model: "openai/gpt-5.2", getAccessToken
    });

    const sale: Record<string, any> = {
        id: "sale-001",
        customerName: "ACME BV",
        amount: 12500,
        currency: "EUR",
        status: "won",
        date: "2026-01-25"
    };

    console.log(tree);
    useEffect(() => {
        const getData = async () => {

            //  console.log(result)
        }
        getData();
    }, [])

    return (
        <div

        >
            <div style={{
                paddingLeft: 12, paddingRight: 12,
                display: "flex", alignItems: "center"
            }}>

            </div>

            <ErrorBoundary fallbackRender={(er) => "Something went wrong:" + er.error}>
                <DataProvider initialData={sale}>
                    <VisibilityProvider>
                        <ActionProvider>
                            <Renderer tree={tree} registry={registry} />
                        </ActionProvider>
                    </VisibilityProvider>
                </DataProvider>
            </ErrorBoundary>

        </div>
    );
};
