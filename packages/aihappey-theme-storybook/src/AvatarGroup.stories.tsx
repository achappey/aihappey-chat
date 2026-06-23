import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useTheme } from "aihappey-components";
import type { AihUiTheme, AvatarGroupLayout, AvatarSize } from "aihappey-types";

type AvatarGroupStoryArgs = {
  layout?: AvatarGroupLayout;
  size?: AvatarSize;
  maxInlineItems?: number;
};

const people = [
  { key: "ada", name: "Ada Lovelace", initials: "AL" },
  { key: "grace", name: "Grace Hopper", initials: "GH" },
  { key: "katherine", name: "Katherine Johnson", initials: "KJ" },
  { key: "margaret", name: "Margaret Hamilton", initials: "MH" },
  { key: "radia", name: "Radia Perlman", initials: "RP" },
];

const AvatarGroupStory = ({ layout, size, maxInlineItems = 4 }: AvatarGroupStoryArgs) => {
  const { AvatarGroup } = useTheme() as unknown as Pick<AihUiTheme, "AvatarGroup">;
  const { inlineItems, overflowItems } = AvatarGroup.partitionItems({ items: people, layout, maxInlineItems });

  return (
    <AvatarGroup layout={layout} size={size}>
      {inlineItems.map((person) => (
        <AvatarGroup.Item key={person.key} name={person.name} initials={person.initials} size={size} overflowLabel={person.name} />
      ))}
      {overflowItems?.length ? (
        <AvatarGroup.Popover count={overflowItems.length} indicator="count">
          {overflowItems.map((person) => (
            <AvatarGroup.Item key={person.key} name={person.name} initials={person.initials} size={size} overflowLabel={person.name} />
          ))}
        </AvatarGroup.Popover>
      ) : null}
    </AvatarGroup>
  );
};

const meta = {
  title: "AvatarGroup",
  component: AvatarGroupStory,
  argTypes: {
    layout: { control: { type: "select" }, options: ["spread", "stack", "pie"] },
    size: { control: { type: "select" }, options: [24, 32, 40, 48, 56, 64] },
    maxInlineItems: { control: { type: "number", min: 1, max: 5 } },
  },
  args: {
    layout: "stack",
    size: 40,
    maxInlineItems: 3,
  },
} satisfies Meta<typeof AvatarGroupStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Spread: Story = {
  args: {
    layout: "spread",
    maxInlineItems: 5,
  },
};

export const Large: Story = {
  args: {
    size: 64,
    maxInlineItems: 4,
  },
};

