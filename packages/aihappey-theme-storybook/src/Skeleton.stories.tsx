import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { AihUiTheme } from "aihappey-types";

type SkeletonStoryArgs = {
  width?: number | string;
  height?: number | string;
  circle?: boolean;
  animation?: "pulse" | "wave";
};

const SkeletonStory = (args: SkeletonStoryArgs) => {
  const { Skeleton } = useTheme() as unknown as Pick<AihUiTheme, "Skeleton">;
  return <Skeleton {...args} />;
};

const meta = {
  title: "Skeleton",
  component: SkeletonStory,
  argTypes: {
    width: { control: { type: "text" } },
    height: { control: { type: "text" } },
    circle: { control: { type: "boolean" } },
    animation: { control: { type: "select" }, options: ["pulse", "wave"] },
  },
  args: {
    width: 200,
    height: 20,
    circle: false,
    animation: "wave",
  },
} satisfies Meta<typeof SkeletonStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Avatar: Story = {
  args: {
    width: 64,
    height: 64,
    circle: true,
  },
};

export const CardPlaceholder: Story = {
  render: () => {
    const { Skeleton } = useTheme() as unknown as Pick<AihUiTheme, "Skeleton">;
    return (
      <div style={{ display: "grid", gap: 12, width: 320 }}>
        <Skeleton width="100%" height={160} animation="wave" />
        <Skeleton width="80%" height={20} animation="wave" />
        <Skeleton width="60%" height={20} animation="wave" />
      </div>
    );
  },
};

