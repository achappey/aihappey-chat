import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { AihUiTheme, TextAs } from "aihappey-types";

type TextStoryArgs = {
  as?: TextAs;
  children: string;
  italic?: boolean;
  weight?: "bold" | "medium" | "regular" | "semibold";
  align?: "center" | "start" | "end" | "justify";
  truncate?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  block?: boolean;
  font?: "base" | "numeric" | "monospace";
  size?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 1000;
};

const TextStory = (args: TextStoryArgs) => {
  const { Text } = useTheme() as unknown as Pick<AihUiTheme, "Text">;
  return <Text {...args} />;
};

const meta = {
  title: "Text",
  component: TextStory,
  argTypes: {
    as: { control: { type: "select" }, options: ["span", "p", "strong", "em", "h1", "h2", "h3", "pre"] },
    children: { control: { type: "text" } },
    italic: { control: { type: "boolean" } },
    weight: { control: { type: "select" }, options: ["regular", "medium", "semibold", "bold"] },
    align: { control: { type: "select" }, options: ["start", "center", "end", "justify"] },
    truncate: { control: { type: "boolean" } },
    underline: { control: { type: "boolean" } },
    strikethrough: { control: { type: "boolean" } },
    block: { control: { type: "boolean" } },
    font: { control: { type: "select" }, options: ["base", "numeric", "monospace"] },
    size: { control: { type: "select" }, options: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000] },
  },
  args: {
    as: "p",
    children: "The quick brown fox jumps over the lazy dog.",
    weight: "regular",
    size: 400,
  },
} satisfies Meta<typeof TextStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Heading: Story = {
  args: {
    as: "h2",
    children: "Theme typography heading",
    weight: "semibold",
    size: 700,
  },
};

export const MonospaceTruncated: Story = {
  args: {
    as: "pre",
    children: "npm run build --workspace aihappey-theme-storybook -- --debug",
    font: "monospace",
    truncate: true,
    block: true,
  },
};

