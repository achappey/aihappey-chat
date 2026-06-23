import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { AihUiTheme } from "aihappey-types";

type ProgressBarStoryArgs = {
  value?: number;
  label?: string;
  variant?: string;
  striped?: boolean;
  animated?: boolean;
};

const ProgressBarStory = (args: ProgressBarStoryArgs) => {
  const { ProgressBar } = useTheme() as unknown as Pick<AihUiTheme, "ProgressBar">;
  return <ProgressBar {...args} />;
};

const meta = {
  title: "ProgressBar",
  component: ProgressBarStory,
  argTypes: {
    value: { control: { type: "number", min: 0, max: 100 } },
    label: { control: { type: "text" } },
    variant: { control: { type: "select" }, options: ["primary", "success", "warning", "danger", "info"] },
    striped: { control: { type: "boolean" } },
    animated: { control: { type: "boolean" } },
  },
  args: {
    value: 60,
    label: "60%",
    variant: "primary",
    striped: false,
    animated: false,
  },
} satisfies Meta<typeof ProgressBarStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Success: Story = {
  args: {
    value: 100,
    label: "Complete",
    variant: "success",
  },
};

export const Animated: Story = {
  args: {
    value: 40,
    striped: true,
    animated: true,
  },
};

