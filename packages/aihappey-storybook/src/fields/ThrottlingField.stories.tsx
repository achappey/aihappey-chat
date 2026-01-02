import React, { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ThrottlingField } from "aihappey-components";

const meta = {
  title: "Fields/ThrottlingField",
  component: ThrottlingField,
  args: {
    value: 250,
    min: 0,
    max: 1000,
    step: 10,
    // keep required prop satisfied; Controlled will also call it (actions panel)
    onChange: (() => {}) as any,
  },
  argTypes: {
    value: { control: false }, // controlled by the wrapper
    onChange: { action: "change", control: false },
    min: { control: "number" },
    max: { control: "number" },
    step: { control: "number" },
  },
} satisfies Meta<typeof ThrottlingField>;

export default meta;
type Story = StoryObj<typeof meta>;

const Controlled: React.FC<React.ComponentProps<typeof ThrottlingField>> = (args) => {
  const [value, setValue] = useState<number>(args.value);

  // reset when switching stories
  useEffect(() => {
    setValue(args.value);
  }, [args.value]);

  return (
      <ThrottlingField
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
    value: 250,
    min: 0,
    max: 1000,
    step: 10,
  },
  render: (args) => <Controlled {...args} />,
};

export const SlowUpdates: Story = {
  args: {
    value: 400,
    min: 0,
    max: 2000,
    step: 50,
  },
  render: (args) => <Controlled {...args} />,
};

export const FineGrained: Story = {
  args: {
    value: 120,
    min: 0,
    max: 500,
    step: 1,
  },
  render: (args) => <Controlled {...args} />,
};

