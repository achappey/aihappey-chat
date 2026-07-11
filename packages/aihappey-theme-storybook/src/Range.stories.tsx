import React, { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { AihUiTheme, RangeValue } from "aihappey-types";

type RangeStoryArgs = {
  value: RangeValue;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  minLabel?: string;
  maxLabel?: string;
  disabled?: boolean;
  showValue?: boolean;
};

const RangeStory = (args: RangeStoryArgs) => {
  const { Range } = useTheme() as unknown as Pick<AihUiTheme, "Range">;
  const [value, setValue] = useState<RangeValue>(args.value);

  useEffect(() => {
    setValue(args.value);
  }, [args.value]);

  return <Range {...args} value={value} onChange={setValue} valueFormat={(v) => `${v}%`} />;
};

const meta = {
  title: "Range",
  component: RangeStory,
  argTypes: {
    value: { control: { type: "object" } },
    min: { control: { type: "number" } },
    max: { control: { type: "number" } },
    step: { control: { type: "number" } },
    label: { control: { type: "text" } },
    minLabel: { control: { type: "text" } },
    maxLabel: { control: { type: "text" } },
    disabled: { control: { type: "boolean" } },
    showValue: { control: { type: "boolean" } },
  },
  args: {
    value: [20, 80],
    min: 0,
    max: 100,
    step: 1,
    label: "Allowed range",
    minLabel: "Minimum",
    maxLabel: "Maximum",
    showValue: true,
  },
} satisfies Meta<typeof RangeStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

