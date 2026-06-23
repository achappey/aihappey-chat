import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { AihUiTheme } from "aihappey-types";

type ImageStoryArgs = {
  src?: string;
  fit?: "none" | "center" | "contain" | "cover" | "default";
  shadow?: boolean;
  block?: boolean;
  width?: number;
  height?: number;
  bordered?: boolean;
  shape?: "circular" | "rounded" | "square";
};

const ImageStory = (args: ImageStoryArgs) => {
  const { Image } = useTheme() as unknown as Pick<AihUiTheme, "Image">;
  return <Image {...args} title="Theme story image" />;
};

const meta = {
  title: "Image",
  component: ImageStory,
  argTypes: {
    src: { control: { type: "text" } },
    fit: { control: { type: "select" }, options: ["none", "center", "contain", "cover", "default"] },
    shadow: { control: { type: "boolean" } },
    block: { control: { type: "boolean" } },
    width: { control: { type: "number" } },
    height: { control: { type: "number" } },
    bordered: { control: { type: "boolean" } },
    shape: { control: { type: "select" }, options: ["square", "rounded", "circular"] },
  },
  args: {
    src: "https://placehold.co/300x200",
    width: 300,
    height: 200,
    fit: "cover",
    bordered: true,
    shadow: false,
    shape: "rounded",
  },
} satisfies Meta<typeof ImageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Circular: Story = {
  args: {
    src: "https://placehold.co/160x160",
    width: 160,
    height: 160,
    shape: "circular",
    fit: "cover",
  },
};

export const Contained: Story = {
  args: {
    fit: "contain",
    shadow: true,
  },
};

