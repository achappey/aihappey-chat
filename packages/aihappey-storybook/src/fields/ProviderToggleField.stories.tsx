import React, { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ProviderToggleField } from "aihappey-components";

const meta = {
    title: "Fields/ProviderToggleField",
    component: ProviderToggleField,
    args: {
        provider: "openai",
        label: "",
        checked: true,
        onChange: (() => { }) as any, // required prop; Controlled will also call it
    },
    argTypes: {
        provider: { control: "text" },
        label: { control: "text" },
        checked: { control: false }, // controlled
        onChange: { action: "change", control: false },
    },
} satisfies Meta<typeof ProviderToggleField>;

export default meta;
type Story = StoryObj<typeof meta>;

const Controlled: React.FC<React.ComponentProps<typeof ProviderToggleField>> = (args) => {
    const [checked, setChecked] = useState<boolean>(args.checked);

    // reset when switching stories
    useEffect(() => {
        setChecked(args.checked);
    }, [args.checked]);

    return (
        <ProviderToggleField
            {...args}
            checked={checked}
            onChange={(next) => {
                setChecked(next);
                args.onChange?.(next); // logs to actions
            }}
        />  
    );
};

export const Playground: Story = {
    args: {
        provider: "openai",
        label: "",
        checked: true,
    },
    render: (args) => <Controlled {...args} />,
};

export const CheckedWithCustomLabel: Story = {
    args: {
        provider: "perplexity",
        label: "Perplexity Search",
        checked: true,
    },
    render: (args) => <Controlled {...args} />,
};

export const Unchecked: Story = {
    args: {
        provider: "xai",
        label: "",
        checked: false,
    },
    render: (args) => <Controlled {...args} />,
};
