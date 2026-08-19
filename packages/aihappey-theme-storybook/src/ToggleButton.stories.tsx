import React, { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { AihUiTheme } from "aihappey-types";

type ToggleButtonStoryArgs = {
  checked?: boolean;
  disabled?: boolean;
  variant?: string;
  size?: string;
  icon?: string;
  title?: string;
  children: string;
};

const ToggleButtonStory = (args: ToggleButtonStoryArgs) => {
  const { ToggleButton } = useTheme() as unknown as Pick<AihUiTheme, "ToggleButton">;
  const [checked, setChecked] = useState(args.checked);

  useEffect(() => {
    setChecked(args.checked);
  }, [args.checked]);

  return (
    <ToggleButton {...args} checked={checked} onClick={() => setChecked((current) => !current)}>
      {args.children}
    </ToggleButton>
  );
};

const meta = {
  title: "ToggleButton",
  component: ToggleButtonStory,
  argTypes: {
    checked: { control: { type: "boolean" } },
    disabled: { control: { type: "boolean" } },
    variant: { control: { type: "text" } },
    size: { control: { type: "select" }, options: ["small", "medium", "large"] },
    icon: { control: { type: "text" } },
    title: { control: { type: "text" } },
    children: { control: { type: "text" } },
  },
  args: {
    checked: false,
    disabled: false,
    size: "medium",
    children: "Toggle Me",
  },
} satisfies Meta<typeof ToggleButtonStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = {
  args: {
    checked: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const SelectedIconOnly: Story = {
  args: {
    checked: true,
    icon: "brain",
    title: "AI chat",
    children: "",
  },
};

export const UnselectedIconOnly: Story = {
  args: {
    checked: false,
    icon: "robot",
    title: "AI agents",
    children: "",
  },
};

