import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { AihUiTheme } from "aihappey-types";

type ToolbarStoryArgs = {
  size?: "small" | "medium" | "large";
  ariaLabel?: string;
};

const ToolbarStory = (args: ToolbarStoryArgs) => {
  const { Toolbar, ToolbarButton, ToolbarDivider } =
    useTheme() as unknown as Pick<AihUiTheme, "Toolbar" | "ToolbarButton" | "ToolbarDivider">;
  return (
    <Toolbar {...args}>
      <ToolbarButton onClick={() => console.log("Toolbar: new")}>New</ToolbarButton>
      <ToolbarButton onClick={() => console.log("Toolbar: save")}>Save</ToolbarButton>
      <ToolbarDivider />
      <ToolbarButton onClick={() => console.log("Toolbar: delete")}>Delete</ToolbarButton>
    </Toolbar>
  );
};

const meta = {
  title: "Toolbar",
  component: ToolbarStory,
  argTypes: {
    size: { control: { type: "select" }, options: ["small", "medium", "large"] },
    ariaLabel: { control: { type: "text" } },
  },
  args: {
    size: "medium",
    ariaLabel: "Story toolbar",
  },
} satisfies Meta<typeof ToolbarStory>;

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

