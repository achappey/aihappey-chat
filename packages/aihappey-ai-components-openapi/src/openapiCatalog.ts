import { createCatalog } from "@json-render/core";
import { z } from "zod";

export const OPENAPI_CATALOG_ID = "openapi";
export const OPENAPI_CATALOG_LABEL = "OpenAPI";

export const openapiStaticActionDefinitions = {
    submit: {
        description: "Submit form to API endpoint",
        params: z.object({
            operationId: z.string(),
        }),
    },
    reset: {
        description: "Reset form to defaults",
        params: z.object({}),
    },
};

export const openapiComponentDefinitions = {
    // Form container
    Form: {
        description: "API form container",
        props: z.object({
            operationId: z.string(),
            endpoint: z.string(),
            method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
            title: z.string().optional(),
            description: z.string().optional(),
        }),
    },

    // Field components mapped to OpenAPI types
    StringField: {
        description: "String input field",
        props: z.object({
            name: z.string(),
            label: z.string(),
            description: z.string().optional(),
            required: z.boolean().optional(),
            format: z
                .enum(["text", "email", "uri", "uuid", "date", "date-time", "password"])
                .optional(),
            minLength: z.number().optional(),
            maxLength: z.number().optional(),
            pattern: z.string().optional(),
            placeholder: z.string().optional(),
            defaultValue: z.string().optional(),
        }),
    },

    NumberField: {
        description: "Number input field",
        props: z.object({
            name: z.string(),
            label: z.string(),
            description: z.string().optional(),
            required: z.boolean().optional(),
            type: z.enum(["integer", "number"]).optional(),
            minimum: z.number().optional(),
            maximum: z.number().optional(),
            exclusiveMinimum: z.number().optional(),
            exclusiveMaximum: z.number().optional(),
            multipleOf: z.number().optional(),
            defaultValue: z.number().optional(),
        }),
    },

    BooleanField: {
        description: "Boolean toggle field",
        props: z.object({
            name: z.string(),
            label: z.string(),
            description: z.string().optional(),
            defaultValue: z.boolean().optional(),
        }),
    },

    EnumField: {
        description: "Enum selection field",
        props: z.object({
            name: z.string(),
            label: z.string(),
            description: z.string().optional(),
            required: z.boolean().optional(),
            options: z.array(
                z.object({
                    value: z.string(),
                    label: z.string().optional(),
                }),
            ),
            defaultValue: z.string().optional(),
        }),
    },

    ArrayField: {
        description: "Array of items",
        props: z.object({
            name: z.string(),
            label: z.string(),
            description: z.string().optional(),
            minItems: z.number().optional(),
            maxItems: z.number().optional(),
            uniqueItems: z.boolean().optional(),
        }),
    },

    ObjectField: {
        description: "Nested object group",
        props: z.object({
            name: z.string(),
            label: z.string(),
            description: z.string().optional(),
            collapsible: z.boolean().optional(),
        }),
    },

    // Response display components
    ResponseDisplay: {
        description: "Displays API response",
        props: z.object({
            status: z.number(),
            statusText: z.string().optional(),
        }),
    },

    SchemaTable: {
        description: "Displays data matching a schema",
        props: z.object({
            schema: z.string(),
            data: z.array(z.record(z.string(), z.unknown())),
        }),
    },
};

export const openapiCatalog = createCatalog({
    components: openapiComponentDefinitions,
    actions: openapiStaticActionDefinitions,
});

export const openapiDefaultCatalogDefinitions = [
    {
        name: OPENAPI_CATALOG_ID,
        manageable: false,
        components: openapiComponentDefinitions,
        actions: openapiStaticActionDefinitions,
        validationFunctions: {},
    },
];
