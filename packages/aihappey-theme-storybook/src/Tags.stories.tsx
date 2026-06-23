import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { AihUiTheme } from "aihappey-types";

type TagsStoryArgs = {
  size?: "extra-small" | "small" | "medium";
  removable?: boolean;
};

const TagsStory = ({ removable, ...args }: TagsStoryArgs) => {
  const { Tags } = useTheme() as unknown as Pick<AihUiTheme, "Tags">;
  return (
    <Tags
      {...args}
      items={[
        { key: "1", label: "Tag 1", icon: "tag" },
        { key: "2", label: "Tag 2", description: "With description" },
        { key: "3", label: "Tag 3", icon: "settings" },
      ]}
      onRemove={removable ? (id) => console.log("Tags: remove", id) : undefined}
    />
  );
};

const meta = {
  title: "Tags",
  component: TagsStory,
  argTypes: {
    size: { control: { type: "select" }, options: ["extra-small", "small", "medium"] },
    removable: { control: { type: "boolean" } },
  },
  args: {
    size: "medium",
    removable: true,
  },
} satisfies Meta<typeof TagsStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = {
  args: {
    size: "small",
  },
};

export const ReadOnly: Story = {
  args: {
    removable: false,
  },
};

