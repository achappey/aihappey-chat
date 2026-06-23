import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { AihUiTheme } from "aihappey-types";

type SpinnerStoryArgs = {
  size?: string;
  label?: string;
};

const SpinnerStory = (args: SpinnerStoryArgs) => {
  const { Spinner } = useTheme() as unknown as Pick<AihUiTheme, "Spinner">;
  return <Spinner {...args} />;
};

const meta = {
  title: "Spinner",
  component: SpinnerStory,
  argTypes: {
    size: { control: { type: "select" }, options: ["small", "medium", "large"] },
    label: { control: { type: "text" } },
  },
  args: {
    size: "medium",
    label: "Loading...",
  },
} satisfies Meta<typeof SpinnerStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = {
  args: {
    size: "small",
  },
};

export const Large: Story = {
  args: {
    size: "large",
  },
};

