import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { AihUiTheme, SplitButtonSize, SplitButtonVariant } from "aihappey-types";

type SplitButtonStoryArgs = {
  label: string;
  variant?: SplitButtonVariant;
  size?: SplitButtonSize;
  disabled?: boolean;
  align?: "left" | "right";
};

const SplitButtonStory = (args: SplitButtonStoryArgs) => {
  const { SplitButton } = useTheme() as unknown as Pick<AihUiTheme, "SplitButton">;

  return (
    <SplitButton
      {...args}
      icon="add"
      onClick={() => console.log("SplitButton: primary action")}
      menuItems={[
        { key: "new", label: "New item", icon: "add", onClick: () => console.log("SplitButton: new") },
        { key: "copy", label: "Copy", icon: "copy", onClick: () => console.log("SplitButton: copy") },
        { key: "delete", label: "Delete", danger: true, onClick: () => console.log("SplitButton: delete") },
      ]}
    />
  );
};

const meta = {
  title: "SplitButton",
  component: SplitButtonStory,
  argTypes: {
    label: { control: { type: "text" } },
    variant: { control: { type: "select" }, options: ["primary", "secondary", "outline", "transparent"] },
    size: { control: { type: "select" }, options: ["small", "medium", "large"] },
    disabled: { control: { type: "boolean" } },
    align: { control: { type: "select" }, options: ["left", "right"] },
  },
  args: {
    label: "Create",
    variant: "primary",
    size: "medium",
    disabled: false,
    align: "left",
  },
} satisfies Meta<typeof SplitButtonStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Secondary: Story = {
  args: {
    variant: "secondary",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

