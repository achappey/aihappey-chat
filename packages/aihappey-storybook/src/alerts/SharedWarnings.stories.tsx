import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { SharedWarnings } from "aihappey-components";

const meta = {
    title: "Alerts/SharedWarnings",
    component: SharedWarnings,
} satisfies Meta<typeof SharedWarnings>;

export default meta;
type Story = StoryObj<typeof meta>;

const exampleWarnings = [
    {
        type: "unsupported-setting",
        feature: "temperature",
        details: "Provider ignored this setting.",
    },
    {
        type: "unsupported-feature",
        feature: "image_generation",
        details: "The selected model does not support images.",
    },
    {
        type: "other",
        message: "Some warnings may be non-standard and come as plain messages.",
    },
] as unknown as React.ComponentProps<typeof SharedWarnings>["warnings"];

export const Empty: Story = {
    args: {
        warnings: [],
        dismiss: () => { },
    },
};

export const Multiple: Story = {
    args: {
        warnings: exampleWarnings,
        dismiss: () => { },
    },
    render: (args) => {
        return (
            <SharedWarnings {...args} />
        );
    },
};
export const DismissInteraction: Story = {
    args: {
        warnings: exampleWarnings,
    },
    render: (args) => {
        const [warnings, setWarnings] = React.useState(args.warnings);

        return (
            <SharedWarnings
                warnings={warnings}
                dismiss={(warning) => {
                    setWarnings((prev) => prev.filter((w) => w !== warning));
                }}
            />
        );
    },
};


