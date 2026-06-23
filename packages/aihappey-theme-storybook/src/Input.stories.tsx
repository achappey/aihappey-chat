import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { AihUiTheme } from "aihappey-types";

type InputStoryArgs = {
  label?: string;
  placeholder?: string;
  hint?: string;
  disabled?: boolean;
  required?: boolean;
  orientation?: "horizontal" | "vertical";
  type?: string;
};

const InputStory = (args: InputStoryArgs) => {
  const { Input } = useTheme() as unknown as Pick<AihUiTheme, "Input">;
  return <Input {...args} />;
};

const meta = {
  title: "Input",
  component: InputStory,
  argTypes: {
    label: { control: { type: "text" } },
    placeholder: { control: { type: "text" } },
    hint: { control: { type: "text" } },
    disabled: { control: { type: "boolean" } },
    required: { control: { type: "boolean" } },
    orientation: { control: { type: "select" }, options: ["horizontal", "vertical"] },
    type: { control: { type: "select" }, options: ["text", "email", "password", "number"] },
  },
  args: {
    label: "Username",
    placeholder: "Enter username",
    hint: "Must be unique",
    orientation: "vertical",
    type: "text",
  },
} satisfies Meta<typeof InputStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const RequiredEmail: Story = {
  args: {
    label: "Email",
    placeholder: "user@example.com",
    type: "email",
    required: true,
  },
};

