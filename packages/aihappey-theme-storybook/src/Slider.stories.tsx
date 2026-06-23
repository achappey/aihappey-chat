import React, { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { AihUiTheme } from "aihappey-types";

type SliderStoryArgs = {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  disabled?: boolean;
  showValue?: boolean;
};

const SliderStory = (args: SliderStoryArgs) => {
  const { Slider } = useTheme() as unknown as Pick<AihUiTheme, "Slider">;
  const [value, setValue] = useState(args.value);

  useEffect(() => {
    setValue(args.value);
  }, [args.value]);

  return <Slider {...args} value={value} onChange={setValue} valueFormat={(v) => `${v}%`} />;
};

const meta = {
  title: "Slider",
  component: SliderStory,
  argTypes: {
    value: { control: { type: "number", min: 0, max: 100 } },
    min: { control: { type: "number" } },
    max: { control: { type: "number" } },
    step: { control: { type: "number" } },
    label: { control: { type: "text" } },
    disabled: { control: { type: "boolean" } },
    showValue: { control: { type: "boolean" } },
  },
  args: {
    value: 50,
    min: 0,
    max: 100,
    step: 1,
    label: "Volume",
    showValue: true,
  },
} satisfies Meta<typeof SliderStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

