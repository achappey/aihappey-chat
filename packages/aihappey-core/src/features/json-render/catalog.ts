import { ActionSchema, createCatalog } from "@json-render/core";
import { jsonSchemaToZod } from "json-schema-to-zod";
import z from "zod";
import type { JsonRenderActionItem } from "aihappey-json-render-registry";
import type {
  JsonRenderCatalogItem,
  RuntimeCatalogDefinitions,
} from "aihappey-json-render-catalog";
import {
  buildRuntimeCatalogDefinition,
  mergeRuntimeCatalogDefinitions,
  createCatalogFromDefinitions,
  resolveCatalogSelection,
} from "aihappey-json-render-catalog";

const SpacingEnum = z.enum(["none", "xs", "sm", "md", "lg", "xl"]);

const OptionSchema = z.object({
    label: z.string(),
    value: z.union([z.string(), z.number(), z.boolean()]),
});

const TagItemSchema = z.object({
    key: z.string(),
    label: z.string(),
    description: z.string().optional(),
    icon: z.string().optional(),
    image: z.string().optional(),
});

const BreadcrumbItemSchema = z.object({
    key: z.string(),
    label: z.string(),
    icon: z.string().optional(),
    action: ActionSchema.optional(),
});

const TableColumnSchema = z.object({
    key: z.string(),
    header: z.string(),
    fieldPath: z.string().optional(),
    format: z.enum(["number", "currency", "percent"]).optional(),
    precision: z.number().int().min(0).max(6).optional(),
    sortable: z.boolean().optional(),
    width: z.union([z.string(), z.number()]).optional(),
});

const SlideSchema = z.object({
    key: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
    imageSrc: z.string().optional(),
});

const ToolbarActionSchema = z.object({
    label: z.string(),
    action: ActionSchema,
    icon: z.string().optional(),
    variant: z.string().optional(),
});

export const componentDefinitions = {
    Container: {
        description:
            "Generic layout container. Use for vertical or horizontal stacks and spacing between elements.",
        props: z.object({
            direction: z.enum(["row", "column"]).default("column"),
            gap: z.number().optional(),
            align: z.enum(["flex-start", "center", "flex-end", "stretch"]).optional(),
            justify: z
                .enum([
                    "flex-start",
                    "center",
                    "flex-end",
                    "space-between",
                    "space-around",
                    "space-evenly",
                ])
                .optional(),
            wrap: z.boolean().optional(),
            padding: SpacingEnum.optional(),
            width: z.union([z.string(), z.number()]).optional(),
            maxWidth: z.union([z.string(), z.number()]).optional(),
        }),
        hasChildren: true,
    },
    Stack: {
        description: "Vertical layout container with spacing between children.",
        props: z.object({
            gap: z.number().optional(),
            align: z.enum(["flex-start", "center", "flex-end", "stretch"]).optional(),
            padding: SpacingEnum.optional(),
        }),
        hasChildren: true,
    },
    Row: {
        description: "Horizontal layout container with optional wrapping.",
        props: z.object({
            gap: z.number().optional(),
            align: z.enum(["flex-start", "center", "flex-end", "stretch"]).optional(),
            justify: z
                .enum([
                    "flex-start",
                    "center",
                    "flex-end",
                    "space-between",
                    "space-around",
                    "space-evenly",
                ])
                .optional(),
            wrap: z.boolean().optional(),
        }),
        hasChildren: true,
    },
    Grid: {
        description:
            "Grid layout for cards or tiles. Use columns or minColumnWidth for responsive grids.",
        props: z.object({
            columns: z.number().int().min(1).optional(),
            minColumnWidth: z.number().int().min(120).optional(),
            gap: z.number().optional(),
            width: z.union([z.string(), z.number()]).optional(),
        }),
        hasChildren: true,
    },
    Card: {
        description:
            "Card container with title and description. Use as primary group container, avoid nesting cards inside cards.",
        props: z.object({
            title: z.string(),
            description: z.string().optional(),
            text: z.string().optional(),
            size: z.enum(["small", "medium", "large"]).optional(),
        }),
        hasChildren: true,
    },
    Header: {
        description: "Heading text (h1-h6).",
        props: z.object({
            text: z.string().optional(),
            level: z.number().int().min(1).max(6).optional(),
        }),
        hasChildren: true,
    },
    Paragraph: {
        description: "Paragraph/body text.",
        props: z.object({
            text: z.string().optional(),
        }),
        hasChildren: true,
    },
    Badge: {
        description: "Small status badge with optional variant.",
        props: z.object({
            text: z.string().optional(),
            variant: z.string().optional(),
            appearance: z.string().optional(),
        }),
        hasChildren: true,
    },
  /*  Tags: {
        description: "Group of tags for labels or filters.",
        props: z.object({
            items: z.array(TagItemSchema),
            size: z.enum(["extra-small", "small", "medium"]).optional(),
        }),
    },
    Breadcrumb: {
        description:
            "Breadcrumb navigation for page hierarchy. Use action on items for navigation.",
        props: z.object({
            items: z.array(BreadcrumbItemSchema),
        }),
    },
    Button: {
        description: "Clickable button. Provide label and optional action.",
        props: z.object({
            label: z.string(),
            variant: z.string().optional(),
            size: z.string().optional(),
            icon: z.string().optional(),
            iconPosition: z.enum(["left", "right"]).optional(),
            disabled: z.boolean().optional(),
            action: ActionSchema.optional(),
        }),
    },
    ToggleButton: {
        description: "Toggle button for on/off states.",
        props: z.object({
            label: z.string().optional(),
            checked: z.boolean().optional(),
            variant: z.string().optional(),
            size: z.string().optional(),
            icon: z.string().optional(),
            iconPosition: z.enum(["left", "right"]).optional(),
            action: ActionSchema.optional(),
        }),
    },
    SplitButton: {
        description:
            "Button with dropdown menu actions. Use menuItems for secondary actions.",
        props: z.object({
            label: z.string(),
            variant: z.string().optional(),
            size: z.string().optional(),
            shape: z.enum(["rounded", "circular", "square"]).optional(),
            align: z.enum(["left", "right"]).optional(),
            icon: z.string().optional(),
            iconPosition: z.enum(["left", "right"]).optional(),
            disabled: z.boolean().optional(),
            action: ActionSchema.optional(),
            menuItems: z.array(
                z.object({
                    key: z.string(),
                    label: z.string(),
                    icon: z.string().optional(),
                    danger: z.boolean().optional(),
                    disabled: z.boolean().optional(),
                    action: ActionSchema.optional(),
                }),
            ),
        }),
    },
    Toolbar: {
        description: "Horizontal toolbar for grouping actions.",
        props: z.object({
            ariaLabel: z.string().optional(),
            size: z.enum(["small", "medium", "large"]).optional(),
        }),
        hasChildren: true,
    },
    ToolbarButton: {
        description: "Action button intended for toolbar usage.",
        props: z.object({
            label: z.string().optional(),
            icon: z.string().optional(),
            variant: z.string().optional(),
            disabled: z.boolean().optional(),
            action: ActionSchema.optional(),
        }),
    },
    ToolbarDivider: {
        description: "Visual divider inside a toolbar.",
        props: z.object({}),
    },
    Input: {
        description: "Text input bound to a data path.",
        props: z.object({
            label: z.string().optional(),
            hint: z.string().optional(),
            placeholder: z.string().optional(),
            type: z.string().optional(),
            required: z.boolean().optional(),
            disabled: z.boolean().optional(),
            valuePath: z.string(),
        }),
    },
    TextArea: {
        description: "Multi-line text input bound to a data path.",
        props: z.object({
            label: z.string().optional(),
            placeholder: z.string().optional(),
            rows: z.number().int().min(2).max(16).optional(),
            readOnly: z.boolean().optional(),
            required: z.boolean().optional(),
            disabled: z.boolean().optional(),
            valuePath: z.string(),
        }),
    },
    Switch: {
        description: "Boolean toggle bound to a data path.",
        props: z.object({
            label: z.string().optional(),
            hint: z.string().optional(),
            size: z.string().optional(),
            required: z.boolean().optional(),
            disabled: z.boolean().optional(),
            valuePath: z.string(),
        }),
    },
    Slider: {
        description: "Numeric slider bound to a data path.",
        props: z.object({
            label: z.string().optional(),
            min: z.number().optional(),
            max: z.number().optional(),
            step: z.number().optional(),
            showValue: z.boolean().optional(),
            disabled: z.boolean().optional(),
            valuePath: z.string(),
        }),
    },
    Select: {
        description: "Dropdown select bound to a data path.",
        props: z.object({
            label: z.string().optional(),
            placeholder: z.string().optional(),
            multiple: z.boolean().optional(),
            disabled: z.boolean().optional(),
            valuePath: z.string(),
            options: z.array(OptionSchema),
        }),
    },
    SearchBox: {
        description: "Search input bound to a data path.",
        props: z.object({
            placeholder: z.string().optional(),
            disabled: z.boolean().optional(),
            autoFocus: z.boolean().optional(),
            valuePath: z.string(),
        }),
    },*/
    ProgressBar: {
        description: "Progress indicator. Use value or valuePath.",
        props: z.object({
            label: z.string().optional(),
            variant: z.string().optional(),
            striped: z.boolean().optional(),
            animated: z.boolean().optional(),
            value: z.number().min(0).max(100).optional(),
            valuePath: z.string().optional(),
        }),
    },
    Skeleton: {
        description: "Loading placeholder.",
        props: z.object({
            width: z.union([z.string(), z.number()]).optional(),
            height: z.union([z.string(), z.number()]).optional(),
            circle: z.boolean().optional(),
            animation: z.enum(["pulse", "wave"]).optional(),
        }),
    },
    Spinner: {
        description: "Loading spinner.",
        props: z.object({
            size: z.string().optional(),
            label: z.string().optional(),
        }),
    },
    Image: {
        description: "Image with optional sizing and fit mode.",
        props: z.object({
            src: z.string(),
            title: z.string().optional(),
            width: z.union([z.string(), z.number()]).optional(),
            height: z.union([z.string(), z.number()]).optional(),
            fit: z.enum(["none", "center", "contain", "cover", "default"]).optional(),
            bordered: z.boolean().optional(),
            shadow: z.boolean().optional(),
        }),
    },
    Carousel: {
        description: "Carousel for image or content slides.",
        props: z.object({
            slides: z.array(SlideSchema),
            interval: z.number().optional(),
            controls: z.boolean().optional(),
            indicators: z.boolean().optional(),
        }),
    },
    Table: {
        description:
            "Simple data table using columns + data or dataPath. Use for small datasets.",
        props: z.object({
            columns: z.array(TableColumnSchema),
            data: z.array(z.record(z.string(), z.unknown())).optional(),
            dataPath: z.string().optional(),
            striped: z.boolean().optional(),
            bordered: z.boolean().optional(),
            hover: z.boolean().optional(),
            size: z.string().optional(),
        }),
    },
    DataGrid: {
        description:
            "Advanced data grid with sortable columns. Use for larger datasets.",
        props: z.object({
            columns: z.array(TableColumnSchema),
            data: z.array(z.record(z.string(), z.unknown())).optional(),
            dataPath: z.string().optional(),
            selectionMode: z.enum(["single", "multiselect", "none"]).optional(),
        }),
    },
    JsonViewer: {
        description: "Structured JSON viewer. Use valuePath for data binding.",
        props: z.object({
            title: z.string().optional(),
            value: z.any().optional(),
            valuePath: z.string().optional(),
        }),
    },
    Chart: {
        description: "Chart.js block. Provide type and data (or bind via dataPath).",
        props: z.object({
            type: z.string(),
            data: z.any().optional(),
            dataPath: z.string().optional(),
            options: z.any().optional(),
            height: z.number().optional(),
        }),
    },
    Metric: {
        description:
            "Metric display reading a numeric value from valuePath. Use format for display.",
        props: z.object({
            label: z.string(),
            valuePath: z.string(),
            format: z.enum(["number", "currency", "percent"]).optional(),
            precision: z.number().int().min(0).max(6).optional(),
        }),
    },
    /*Modal: {
        description:
            "Modal dialog. Use show=true to display. Provide optional action buttons.",
        props: z.object({
            title: z.string(),
            show: z.boolean().optional(),
            size: z.string().optional(),
            centered: z.boolean().optional(),
            onCloseAction: ActionSchema.optional(),
            primaryAction: ToolbarActionSchema.optional(),
            secondaryAction: ToolbarActionSchema.optional(),
        }),
        hasChildren: true,
    },*/
    AudioPlayer: {
        description: "Audio player for a remote or base64 audio source.",
        props: z.object({
            src: z.string(),
        }),
    },
};

export const staticActionDefinitions = {
  /*  submit_form: {
        params: z.object({
            formId: z.string(),
        }),
        description: "Submit a form",
    },
    export_data: {
        params: z.object({
            format: z.enum(["csv", "pdf", "json"]),
        }),
        description: "Export data",
    },*/
};

export const catalog = createCatalog({
    name: "Aihappey UI",
    components: componentDefinitions,
    actions: staticActionDefinitions,
});

function parseParamsSchema(paramsSchema?: string) {
    if (typeof paramsSchema !== "string" || !paramsSchema.trim()) {
        return z.object({});
    }
    try {
        const jsonSchema = JSON.parse(paramsSchema);
        const zodSource = jsonSchemaToZod(jsonSchema);
        return new Function("z", `return (${zodSource});`)(z) as z.ZodTypeAny;
    } catch {
        return z.object({});
    }
}

export function buildCatalogWithActions(
    actionItems: JsonRenderActionItem[],
    registryId = "app",
) {
    const runtimeActions = actionItems
        .filter((item) => item.registryId === registryId)
        .reduce<Record<string, { params: z.ZodTypeAny; description?: string }>>(
            (acc, item) => {
                acc[item.name] = {
                    params: parseParamsSchema(item.paramsSchema),
                    description: item.description ?? item.title,
                };
                return acc;
            },
            {},
        );

    return createCatalog({
        name: "Aihappey UI",
        components: componentDefinitions,
        actions: {
            ...staticActionDefinitions,
            ...runtimeActions,
        },
    });
}

export function createCatalogFromStored(
    catalogs: JsonRenderCatalogItem[],
    catalogList: string | undefined,
    fallbackCatalog?: RuntimeCatalogDefinitions,
) {
    const availableNames = catalogs.map((item) => item.name);
    const selectedNames = resolveCatalogSelection(
        catalogList,
        availableNames,
        fallbackCatalog ? [fallbackCatalog.name] : ["app"],
    );

    const selected = catalogs.filter((item) => selectedNames.includes(item.name));
    const runtimeDefs = selected.map(buildRuntimeCatalogDefinition);
    if (fallbackCatalog) {
        runtimeDefs.unshift(fallbackCatalog);
    }
    const merged = mergeRuntimeCatalogDefinitions(runtimeDefs, "Aihappey UI");
    return createCatalogFromDefinitions(merged);
}
