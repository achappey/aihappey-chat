import React, { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { ToolForm } from "aihappey-components";

const meta: Meta<typeof ToolForm> = {
    title: "Forms/Tools/ToolForm",
    component: ToolForm,
};

export default meta;

type Story = StoryObj<typeof ToolForm>;

const DemoWrapper: React.FC<{ schema: any; initial?: Record<string, any> }> = ({ schema, initial }) => {
    const [values, setValues] = useState<Record<string, any>>(initial ?? {});
    const [isValid, setIsValid] = useState<boolean>(true);

    const view = useMemo(() => JSON.stringify(values, null, 2), [values]);

    return (
        <ToolForm
            inputSchema={schema}
            values={values}
            onChange={setValues}
            onValidationChange={(v) => setIsValid(v.isValid)}
        />
    );
};

export const PrimitivesAndRequired: Story = {
    render: () => (
        <DemoWrapper
            schema={{
                type: "object",
                required: ["query", "limit"],
                properties: {
                    query: {
                        type: "string",
                        title: "Query",
                        description: "Search query",
                    },
                    limit: {
                        type: "integer",
                        title: "Limit",
                        description: "Maximum number of results",
                        minimum: 1,
                        maximum: 50,
                        default: 10,
                    },
                    includeArchived: {
                        type: "boolean",
                        title: "Include archived",
                        default: false,
                    },
                    threshold: {
                        type: "number",
                        title: "Threshold",
                        description: "0.0 - 1.0",
                        minimum: 0,
                        maximum: 1,
                        default: 0.75,
                    },
                },
            }}
        />
    ),
};

export const OneOfSelect: Story = {
    render: () => (
        <DemoWrapper
            schema={{
                type: "object",
                required: ["priority"],
                properties: {
                    priority: {
                        type: "string",
                        title: "Priority",
                        oneOf: [
                            { const: "low", title: "Low" },
                            { const: "medium", title: "Medium" },
                            { const: "high", title: "High" },
                        ],
                        default: "medium",
                    },
                },
            }}
        />
    ),
};

