import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { AihUiTheme } from "aihappey-types";

type BadgeStoryArgs = {
  appearance?: unknown;
  bg?: string;
  variant?: string;
  title?: string;
  children: string;
};

const BadgeStory = (args: BadgeStoryArgs) => {
  const { appearance, bg, variant, title, children } = args;
  const { Badge } = useTheme() as unknown as Pick<AihUiTheme, "Badge">;

  return (
    <Badge appearance={appearance} bg={bg} variant={variant} title={title}>
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
    variant: {
      control: { type: "text" },
    },
    title: {
      control: { type: "text" },
    },
    children: {
      control: { type: "text" },
    },
  },
  args: {
    appearance: undefined,
    bg: undefined,
    variant: undefined,
    title: "Badge",
    children: "Badge",
  },
} satisfies Meta<typeof BadgeStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary",
  },
};

export const InformativeTint: Story = {
  args: {
    appearance: "tint",
    bg: "informative",
    children: "GET",
  },
};

export const InformativeGhost: Story = {
  args: {
    appearance: "ghost",
    bg: "informative",
    children: "747",
  },
};

export const NeutralModelMetadata: Story = {
  args: {
    appearance: "neutral",
    children: "Language",
  },
};

export const SidebarMethodBadge: Story = {
  args: {
    appearance: "tint",
    bg: "informative",
    title: "Docs sidebar API reference badge",
    children: "POST",
  },
};

export const CustomBg: Story = {
  args: {
    bg: "#2563eb",
    title: "Custom background",
    children: "Primary",
  },
};

