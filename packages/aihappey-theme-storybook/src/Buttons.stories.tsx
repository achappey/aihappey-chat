import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { AihUiTheme } from "aihappey-types";

type ButtonStoryArgs = {
  variant?: string;
  size?: string;
  disabled?: boolean;
  children: string;
};

const ButtonStory = (args: ButtonStoryArgs) => {
  const { variant, size, disabled, children } = args;
  const { Button } = useTheme() as unknown as Pick<AihUiTheme, "Button">;

  return (
    <Button variant={variant} size={size} disabled={disabled}>
      {children}
    </Button>
  );
};

const meta = {
  title: "Button",
  component: ButtonStory,
  argTypes: {
    variant: {
      control: { type: "text" },
    },
    size: {
      control: { type: "select" },
      options: ["small", "medium", "large"],
    },
    disabled: {
      control: { type: "boolean" },
    },
    children: {
      control: { type: "text" },
    },
  },
  args: {
    variant: undefined,
    size: "small",
    disabled: false,
    children: "Click me",
  },
} satisfies Meta<typeof ButtonStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Small: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

