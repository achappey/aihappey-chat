import React, { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { TemperatureField } from "aihappey-components";

const meta = {
    title: "Fields/TemperatureField",
    component: TemperatureField,
    args: {
        value: 0.7,
        // keep required prop satisfied; Controlled will also call it (actions panel)
        onChange: (() => { }) as any,
    },
    argTypes: {
        value: { control: false }, // controlled by the wrapper
        onChange: { action: "change", control: false },
    },
} satisfies Meta<typeof TemperatureField>;

export default meta;
type Story = StoryObj<typeof meta>;

const Controlled: React.FC<React.ComponentProps<typeof TemperatureField>> = (args) => {
    const [value, setValue] = useState<number>(args.value);

    // reset when switching stories
    useEffect(() => {
        setValue(args.value);
    }, [args.value]);

    return (
        <TemperatureField
            {...args}
            value={value}
            onChange={(next) => {
                setValue(next);
                args.onChange?.(next); // logs to Storybook Actions
            }}
        />
    );
};

export const Playground: Story = {
    args: {
        value: 0.7,
    },
    render: (args) => <Controlled {...args} />,
};

export const Zero: Story = {
    args: {
        value: 0,
    },
    render: (args) => <Controlled {...args} />,
};

export const One: Story = {
    args: {
        value: 1,
    },
    render: (args) => <Controlled {...args} />,
};

export const LowMediumHigh: Story = {
    render: () => (
        <div style={{ display: "grid", gap: 16, maxWidth: 480 }}>
            <Controlled value={0.15} onChange={() => { }} />
            <Controlled value={0.5} onChange={() => { }} />
            <Controlled value={0.9} onChange={() => { }} />
        </div>
    ),
};

