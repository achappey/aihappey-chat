import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { AihUiTheme } from "aihappey-types";

type BadgeStoryArgs = {
  appearance?: unknown;
  bg?: string;
  title?: string;
  children: string;
};

const BadgeStory = (args: BadgeStoryArgs) => {
  const { appearance, bg, title, children } = args;
  const { Badge } = useTheme() as unknown as Pick<AihUiTheme, "Badge">;

  return (
    <Badge appearance={appearance} bg={bg} title={title}>
      {children}
    </Badge>
  );
};

const meta = {
  title: "Badge",
  component: BadgeStory,
  argTypes: {
    appearance: {
      control: { type: "text" },
    },
    bg: {
      control: { type: "color" },
    },
    title: {
      control: { type: "text" },
    },
    children: {
      control: { type: "text" },
    },
  },
  args: {
    appearance: "filled",
    bg: undefined,
    title: "Badge",
    children: "Badge",
  },
} satisfies Meta<typeof BadgeStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomBg: Story = {
  args: {
    bg: "#2563eb",
    title: "Custom background",
    children: "Primary",
  },
};

